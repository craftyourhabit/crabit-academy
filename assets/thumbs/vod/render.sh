#!/bin/bash
# VOD 썸네일 렌더링: ./render.sh <id>  →  <id>.png (1600x900)
# _template.html 의 VODS 에 등록된 id 만 됩니다.
set -e
cd "$(dirname "$0")"
ID="$1"
[ -z "$ID" ] && { echo "사용법: ./render.sh <id>"; exit 1; }
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1600,900 --virtual-time-budget=8000 \
  --screenshot="$PWD/$ID.png" "file://$PWD/_template.html?id=$ID" >/dev/null 2>&1
echo "$ID.png"
