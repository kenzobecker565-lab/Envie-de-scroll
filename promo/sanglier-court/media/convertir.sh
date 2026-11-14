#!/bin/bash
# media/elevenlabs/<id>.mp3 → media/lignes/<id>.wav (mono 44,1 kHz), lu par voix.py.
# Le narrateur a la même voix que la défense (« Ilan ») : on l'abaisse d'environ un ton
# et on lui donne un timbre plus « voix off » pour qu'on ne les confonde pas.
cd "$(dirname "$0")"
for f in elevenlabs/*.mp3; do
  id=$(basename "${f%.mp3}")
  case $id in
    01-*|02-*|09-*|16-*|17-*) af="rubberband=pitch=0.89,equalizer=f=140:t=q:w=1:g=3,equalizer=f=3500:t=q:w=1:g=-2" ;;
    *) af="anull" ;;
  esac
  ffmpeg -nostdin -loglevel error -y -i "$f" -af "$af" -ac 1 -ar 44100 "lignes/$id.wav"
done
