#!/bin/bash
# 雙擊我就會開啟 English Buddy（這個視窗要一直開著，關掉等於關掉 App）
cd "$(dirname "$0")" || exit 1
echo "🚀 English Buddy 啟動中..."
echo "⚠️  請別關這個視窗，關掉伺服器就會停。要結束時按 Ctrl + C。"
echo ""
# 用 Chrome 開（沒裝就用預設瀏覽器）
( sleep 1; open -a "Google Chrome" "http://localhost:8000" 2>/dev/null \
  || open "http://localhost:8000" ) &
python3 -m http.server 8000
