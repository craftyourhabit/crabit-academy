#!/bin/bash
# 메일에 첨부할 썸네일을 만듭니다. ./만들기.sh <event_id>
# assets/thumbs/vod/<event_id>.png 를 480px JPEG 로 줄여 이 폴더에 저장합니다.
#
# 왜 줄이나: 메일에 붙일 때 파일을 base64 글자로 바꿔 보내는데,
# 파일이 크면 그 글자가 수만 자가 되어 중간에 깨지기 쉽습니다.
# 480px, 10KB 안쪽이면 안전하고 메일에서도 충분히 선명합니다.
set -e
cd "$(dirname "$0")/../.."
ID="$1"
[ -z "$ID" ] && { echo "사용법: ./만들기.sh <event_id>"; exit 1; }
SRC="assets/thumbs/vod/$ID.png"
[ -f "$SRC" ] || { echo "원본이 없습니다: $SRC"; exit 1; }
OUT="admin/메일-썸네일/$ID.jpg"
ffmpeg -v error -y -i "$SRC" -vf scale=480:-1 -q:v 10 "$OUT"
SIZE=$(wc -c < "$OUT" | tr -d ' ')
echo "$OUT ($SIZE bytes)"
[ "$SIZE" -gt 12000 ] && echo "경고: 12KB가 넘습니다. -q:v 값을 12~14로 올려 다시 만드세요."
exit 0
