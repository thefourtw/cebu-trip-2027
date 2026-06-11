#!/bin/bash
# 雙擊我就會把 English Buddy 更新到最新版本（更新完關掉視窗即可）
cd "$(dirname "$0")" || exit 1
DIR="$(pwd)"
echo "🔄 正在更新 English Buddy..."
TMP="$(mktemp -d)"
git clone -b claude/english-conversation-learning-8obajl --depth 1 \
  https://github.com/thefourtw/cebu-trip-2027.git "$TMP" \
  || { echo "❌ 下載失敗，請檢查網路後再試一次。"; read -p "按 Enter 關閉..."; exit 1; }
cp -R "$TMP"/english-buddy/. "$DIR"/
rm -rf "$TMP"
chmod +x "$DIR"/*.command 2>/dev/null
echo ""
echo "✅ 更新完成！"
echo "👉 回 Chrome 按 Cmd + Shift + R 重新整理就會看到新版。"
read -p "按 Enter 關閉這個視窗..."
