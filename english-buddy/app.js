// English Buddy — 對話邏輯、語音、進度、螺旋複習
// 純前端雛形：直接從瀏覽器呼叫 Claude API（只適合自家單機使用）。

const LS_KEY = "english-buddy";
const API_URL = "https://api.anthropic.com/v1/messages";

// 模型可切換。預設用 Haiku 4.5：語音對話講求即時來回，越快孩子越投入。
// 想要更聰明的鷹架可在「設定」改成 Opus。
const MODELS = {
  "claude-haiku-4-5": "Haiku 4.5（快，推薦語音對話）",
  "claude-opus-4-8": "Opus 4.8（最聰明，回應稍慢）"
};

// ---- 全域狀態 ----
let state = {
  apiKey: "",
  model: "claude-haiku-4-5",
  progress: {} // { "sceneId|en": { exposure, used } }
};
let scene = null;       // 目前場景
let messages = [];      // 對話歷史（傳給 API）
let recognizing = false;
let recognition = null;

// ---- 工具：localStorage ----
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    state = { ...state, ...saved };
    state.progress = saved.progress || {};
  } catch (e) { /* 忽略 */ }
}
function save() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

function chunkKey(sceneId, en) { return sceneId + "|" + en; }
function getStat(sceneId, en) {
  return state.progress[chunkKey(sceneId, en)] || { exposure: 0, used: 0 };
}
function bump(sceneId, en, field) {
  const k = chunkKey(sceneId, en);
  const cur = state.progress[k] || { exposure: 0, used: 0 };
  cur[field] += 1;
  state.progress[k] = cur;
  save();
}

// 文字正規化（去標點、小寫），用來比對語塊
function normalize(t) {
  return (" " + t.toLowerCase() + " ").replace(/[^a-z\s']/g, " ").replace(/\s+/g, " ");
}
function matchChunks(text, chunks) {
  const n = normalize(text);
  return chunks.filter(c => c.patterns.some(p => n.includes(" " + p.trim() + " ") || n.includes(p.trim())));
}

// ---- 螺旋複習：挑出別的場景已學過的高價值語塊 ----
function recycledChunks(currentSceneId) {
  const learned = [];
  for (const s of window.SCENES) {
    if (s.id === currentSceneId) continue;
    for (const c of s.chunks) {
      const stat = getStat(s.id, c.en);
      if (stat.used > 0) learned.push({ en: c.en, used: stat.used });
    }
  }
  learned.sort((a, b) => b.used - a.used);
  return learned.slice(0, 4).map(c => c.en);
}

// ---- 組系統提示詞 ----
function buildSystem(s) {
  const targets = s.chunks.map(c => `- "${c.en}"`).join("\n");
  const recycled = recycledChunks(s.id);
  const recycledLine = recycled.length
    ? `\nAlso naturally reuse these phrases the child learned before (spiral review): ${recycled.map(r => `"${r}"`).join(", ")}.`
    : "";
  return `You are ${s.aiName}, ${s.aiRole}. You are talking with a 9-year-old child from Taiwan who is learning English. Make this fun and warm.

RULES:
- Speak ONLY in simple, friendly English at a very basic (CEFR A1) level. Short sentences.
- Keep EVERY reply to 1-2 short sentences. Never lecture or over-explain.
- Stay fully in character as ${s.aiName}.
- Your job is to gently guide the child to complete this task: ${s.goal}
- Naturally use these target phrases so the child hears them repeatedly:
${targets}
- If the child is silent, stuck, or answers in Chinese, give ONE simple choice or a tiny hint. You may add ONE short Chinese hint in parentheses AFTER your English, e.g. "What flavor do you like? (你喜歡什麼口味？)". Use Chinese hints sparingly and drop them once the child is doing well.
- Warmly praise every attempt ("Great job!", "Nice try!", "Yes!").${recycledLine}
- Do NOT use emoji. Do NOT write pronunciation guides or romaji. Just speak as the character.
- When the task is done, celebrate briefly in one sentence.`;
}

// ---- 呼叫 Claude API ----
async function askClaude() {
  if (!state.apiKey) {
    addBubble("sys", "請先在右上「⚙️ 設定」貼上 API key。");
    return null;
  }
  const body = {
    model: state.model,
    max_tokens: 200,
    system: buildSystem(scene),
    messages: messages.map(m => ({ role: m.role, content: m.content }))
  };
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": state.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 401) addBubble("sys", "API key 無效，請到設定重新貼上。");
      else addBubble("sys", `出錯了（${res.status}）：${txt.slice(0, 120)}`);
      return null;
    }
    const data = await res.json();
    const block = (data.content || []).find(b => b.type === "text");
    return block ? block.text.trim() : "";
  } catch (e) {
    addBubble("sys", "連線失敗，請檢查網路。");
    return null;
  }
}

// ---- 語音合成（AI 念出來）----
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  // 去掉中文括號提示，只念英文部分，發音才順
  const englishOnly = text.replace(/[（(][^（()）]*[)）]/g, "").trim();
  const u = new SpeechSynthesisUtterance(englishOnly || text);
  u.lang = "en-US";
  u.rate = 0.9; // 給孩子聽得清楚
  const voices = window.speechSynthesis.getVoices();
  const en = voices.find(v => /en[-_]US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang));
  if (en) u.voice = en;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// ---- 語音辨識（孩子說話）----
function setupRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.lang = "en-US";
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    document.getElementById("textInput").value = transcript;
    handleKidInput(transcript);
  };
  r.onend = () => { recognizing = false; updateMicUI(); };
  r.onerror = () => { recognizing = false; updateMicUI(); };
  return r;
}

function toggleMic() {
  if (!recognition) {
    addBubble("sys", "這個瀏覽器不支援語音辨識，請用下方打字框，建議改用 Chrome。");
    return;
  }
  if (recognizing) { recognition.stop(); return; }
  recognizing = true;
  updateMicUI();
  try { recognition.start(); } catch (e) { recognizing = false; updateMicUI(); }
}

function updateMicUI() {
  const btn = document.getElementById("micBtn");
  if (!btn) return;
  btn.classList.toggle("listening", recognizing);
  btn.textContent = recognizing ? "🔴 聽你說…" : "🎤 我要說";
}

// ---- 處理孩子輸入 ----
async function handleKidInput(text) {
  text = (text || "").trim();
  if (!text) return;
  document.getElementById("textInput").value = "";
  addBubble("kid", text);
  messages.push({ role: "user", content: text });

  // 偵測孩子說出了哪些目標語塊 → 記「used」
  const spoke = matchChunks(text, scene.chunks);
  spoke.forEach(c => bump(scene.id, c.en, "used"));
  if (spoke.length) renderChunks();

  // 等 AI 回覆
  addBubble("sys", "…");
  const reply = await askClaude();
  removeLastSys();
  if (reply == null) return;

  addBubble("ai", reply);
  messages.push({ role: "assistant", content: reply });
  // AI 說出的目標語塊 → 記「exposure」
  matchChunks(reply, scene.chunks).forEach(c => bump(scene.id, c.en, "exposure"));
  renderChunks();
  speak(reply);
}

// ---- 畫面：對話泡泡 ----
function addBubble(who, text) {
  const box = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = "bubble " + who;
  if (who === "sys") div.dataset.sys = "1";
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
function removeLastSys() {
  const box = document.getElementById("messages");
  const items = box.querySelectorAll('[data-sys="1"]');
  if (items.length) items[items.length - 1].remove();
}

// ---- 畫面：進度側欄 ----
function renderChunks() {
  const wrap = document.getElementById("chunkList");
  if (!wrap) return;
  wrap.innerHTML = "";
  scene.chunks.forEach(c => {
    const stat = getStat(scene.id, c.en);
    const div = document.createElement("div");
    div.className = "chunk" + (stat.used > 0 ? " spoken" : "");
    const stars = "★".repeat(Math.min(stat.used, 5)) + "☆".repeat(Math.max(0, 5 - Math.min(stat.used, 5)));
    div.innerHTML = `
      <div class="en">${c.en}</div>
      <div class="zh">${c.zh}</div>
      <div class="meter"><span>👂 聽過 ${stat.exposure}</span><span class="stars" title="說出 ${stat.used} 次">🗣️ ${stars}</span></div>`;
    wrap.appendChild(div);
  });
}

// ---- 開始一個場景 ----
function startScene(s) {
  scene = s;
  messages = [];
  document.getElementById("sceneMenu").classList.add("hidden");
  document.getElementById("playView").classList.remove("hidden");
  document.getElementById("chatTask").innerHTML = `任務：<b>${s.goalZh}</b>`;
  document.getElementById("chatTitle").textContent = `${s.emoji} ${s.title}`;
  document.getElementById("messages").innerHTML = "";
  renderChunks();

  // AI 開場白（直接顯示 + 念出來，不用先花一次 API）
  addBubble("ai", s.opener);
  messages.push({ role: "assistant", content: s.opener });
  matchChunks(s.opener, s.chunks).forEach(c => bump(s.id, c.en, "exposure"));
  renderChunks();
  speak(s.opener);
}

function backToMenu() {
  if (recognizing && recognition) recognition.stop();
  window.speechSynthesis && window.speechSynthesis.cancel();
  document.getElementById("playView").classList.add("hidden");
  document.getElementById("sceneMenu").classList.remove("hidden");
}

// ---- 場景選單 ----
function renderMenu() {
  const grid = document.getElementById("sceneGrid");
  grid.innerHTML = "";
  window.SCENES.forEach(s => {
    const card = document.createElement("button");
    card.className = "scene-card";
    card.innerHTML = `<div class="emoji">${s.emoji}</div><div class="name">${s.title}</div><div class="goal">${s.goalZh}</div>`;
    card.onclick = () => startScene(s);
    grid.appendChild(card);
  });
}

// ---- 設定面板 ----
function renderSettings() {
  document.getElementById("apiKeyInput").value = state.apiKey;
  const sel = document.getElementById("modelSelect");
  sel.innerHTML = "";
  Object.entries(MODELS).forEach(([id, label]) => {
    const opt = document.createElement("option");
    opt.value = id; opt.textContent = label;
    if (id === state.model) opt.selected = true;
    sel.appendChild(opt);
  });
}
function toggleSettings() { document.getElementById("settings").classList.toggle("hidden"); }
function saveSettings() {
  state.apiKey = document.getElementById("apiKeyInput").value.trim();
  state.model = document.getElementById("modelSelect").value;
  save();
  toggleSettings();
}

// ---- 啟動 ----
window.addEventListener("DOMContentLoaded", () => {
  load();
  recognition = setupRecognition();
  renderMenu();
  renderSettings();

  document.getElementById("settingsBtn").onclick = toggleSettings;
  document.getElementById("saveSettings").onclick = saveSettings;
  document.getElementById("backBtn").onclick = backToMenu;
  document.getElementById("micBtn").onclick = toggleMic;
  document.getElementById("sendBtn").onclick = () => handleKidInput(document.getElementById("textInput").value);
  document.getElementById("textInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleKidInput(e.target.value);
  });

  // 某些瀏覽器要等 voices 載入
  if ("speechSynthesis" in window) window.speechSynthesis.getVoices();

  if (!state.apiKey) toggleSettings(); // 第一次自動打開設定
});
