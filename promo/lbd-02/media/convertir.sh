#!/bin/bash
# media/elevenlabs/<id>.mp3 → media/lignes/<id>.wav (mono 44,1 kHz), lu par voix.py.
cd "$(dirname "$0")"
for f in elevenlabs/*.mp3; do ffmpeg -nostdin -loglevel error -y -i "$f" -ac 1 -ar 44100 "lignes/$(basename "${f%.mp3}").wav"; done
