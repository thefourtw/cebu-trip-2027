# 開發交接筆記（給接手的 Claude / 開發者）

> 這份是「目前進度 + 待辦 + 設計原則」的速覽。完整概念見 `README.md`。

## 這是什麼
給一位 9 歲（台灣）孩子的**情境式英語口說**陪練。語音為主、家長陪同。純前端靜態網頁雛形。

## 怎麼跑
```bash
cd english-buddy && python3 -m http.server 8000   # 或雙擊「啟動.command」
# Chrome 開 http://localhost:8000
```
- 用 **Chrome**（Edge 的語音辨識在 Mac 上常默默失敗）。
- 第一次進設定要貼 Anthropic API key（存在瀏覽器 localStorage）。

## 檔案
- `index.html` 介面
- `styles.css` 樣式（含卡通舞台動畫）
- `scenes.js` 場景與目標語塊資料（**最容易擴充的地方**）
- `app.js` 對話/語音/進度/螺旋複習邏輯
- `啟動.command` / `更新.command` 給家長雙擊用

## 核心設計原則（不要破壞）
1. 教**整句語塊**不是單字。
2. 三機制做成系統：高頻曝光、有目的地使用（任務式）、**跨場景螺旋複習**（`app.js` 的 `recycledChunks()`）。
3. 每個語塊追蹤 `exposure`（AI 說過）與 `used`（孩子說出），進度看得見。

## 目前狀態（v0.1+）
- ✅ 6 個場景、語塊進度、螺旋複習
- ✅ 卡通舞台：漸層背景 + 漂浮道具 + 角色頭像（說話時跳動）
- ✅ 語音輸入（Web Speech）含具體錯誤提示
- ✅ 語音輸出兩種引擎：瀏覽器內建 / **OpenAI 真人語音**（`gpt-4o-mini-tts`，設定可切換、可試聽）

## 待辦 / 下一步
- [ ] **驗證 OpenAI TTS 從瀏覽器直連是否被 CORS 擋**。若 `speakOpenAI()` 報「連線失敗（跨網域）」→ 需要一個極小本機代理（Python/Node）轉發 `POST /v1/audio/speech`，把瀏覽器指到代理而非直連 api.openai.com。
- [ ] v0.2：語塊熟練度分級（聽過 → 說過 → 熟練）、每日連續紀錄、更多場景。
- [ ] 場景美術升級選項：手繪 SVG 場景，或 AI 生成卡通圖。
- [ ] 上線前：把 API key 從瀏覽器移到後端代理（目前只適合自家單機）。

## 已知限制
- API key 放瀏覽器 = 只適合單機自用。
- 瀏覽器語音品質有天花板，要真人質感請用 OpenAI 引擎。
