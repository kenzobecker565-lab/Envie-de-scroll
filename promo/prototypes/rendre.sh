#!/bin/bash
# Rend l'extrait de 5 s d'un prototype avec le son de l'affaire n°5 :
#   bash prototypes/rendre.sh flat   → prototypes/flat/proto-flat.mp4
set -e
cd "$(dirname "$0")/.."
N=$1
B=build/proto-$N
CHROMIUM=${CHROMIUM:-/opt/pw-browsers/chromium} node render.mjs --ad=proto-$N --from=60.05 --to=65.25 --out=video.mp4 --workers=${WORKERS:-3}
ffmpeg -loglevel error -y -i $B/video.mp4 -ss 60.05 -t 5.2 -i build/affaire-05/audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k \
  -af "afade=t=in:d=0.15,afade=t=out:st=4.85:d=0.35" -shortest -movflags +faststart prototypes/$N/proto-$N.mp4
echo "→ prototypes/$N/proto-$N.mp4"
