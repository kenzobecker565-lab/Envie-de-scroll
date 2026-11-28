"""
Voix ElevenLabs de l'le tir (LBD), épisode 1 : une prise par réplique (media/elevenlabs/<id>.mp3,
générées sur le site d'ElevenLabs par le créateur du compte), assemblées en un
fichier par personnage (media/<personnage>.wav) que voix.py découpe ensuite.

Voix : narrateur « Nicolas », procureur « Paul K », défense « Peter »
(modèle Eleven v4).

    python elevenlabs.py && python voix.py
"""

import json
import pathlib
import subprocess
import sys
import wave

import numpy as np

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "voix-libres"))
from choisir import trim  # noqa: E402

SR = 44100


def decode(path: pathlib.Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def main() -> None:
    script = json.loads((HERE / "script.json").read_text(encoding="utf-8"))
    parts: dict[str, list[np.ndarray]] = {}
    for line in script["lines"]:
        x = trim(decode(HERE / "media" / "elevenlabs" / f"{line['id']}.mp3"), SR)
        parts.setdefault(line["who"], []).extend([x, np.zeros(int(SR * 0.8), np.float32)])
    for who, chunks in parts.items():
        y = np.concatenate(chunks)
        y = y / (np.abs(y).max() + 1e-9) * 0.9
        with wave.open(str(HERE / "media" / f"{who}.wav"), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
        print(f"{who} : {len(y) / SR:.1f} s → media/{who}.wav")


if __name__ == "__main__":
    main()
