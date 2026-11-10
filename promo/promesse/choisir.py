"""
Voix du procureur et de l'avocate de « La promesse » : Chatterbox (voir
../voix-libres), plusieurs prises par réplique. Ce script garde la meilleure
prise de chaque réplique (transcrite par Whisper, comme ../voix-libres/choisir.py)
et assemble un fichier par personnage, que voix.py découpe ensuite.

Le narrateur n'est pas concerné : sa voix vient d'ElevenLabs
(media/elevenlabs/narrateur.mp3 → media/narrateur.wav).

    python choisir.py && python voix.py
"""

import json
import pathlib
import sys
import wave

import numpy as np

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "voix-libres"))
from choisir import matched, read, trim, words  # noqa: E402

TAKES = HERE.parent / "voix-libres" / "prises" / "promesse"
# Prises imposées à l'écoute : Whisper écrit « 1095 » en chiffres, ce qui fausse la note de cette réplique
# (la prise 0 dit « 885 jours », la prise 2 rate « onze fois »).
FORCE = {"07-reflexe": "07-reflexe-1.wav"}


def main() -> None:
    from faster_whisper import WhisperModel

    asr = WhisperModel("small", device="cpu", compute_type="int8")
    script = json.loads((HERE / "script.json").read_text(encoding="utf-8"))
    parts: dict[str, list[np.ndarray]] = {}
    rate = None
    for line in script["lines"]:
        if line["who"] == "narrateur":
            continue
        text = line.get("say", line["text"])
        best = None
        for path in sorted(TAKES.glob(f"{line['id']}-*.wav")):
            if line["id"] in FORCE and path.name != FORCE[line["id"]]:
                continue
            x, sr = read(path)
            x = trim(x, sr)
            n = int(len(x) * 16000 / sr)
            x16 = np.interp(np.arange(n) * sr / 16000, np.arange(len(x)), x).astype(np.float32)
            segs = list(asr.transcribe(x16, language="fr", beam_size=5)[0])
            heard = " ".join(s.text for s in segs)
            confidence = sum(s.avg_logprob for s in segs) / max(1, len(segs))
            # À texte égal, on préfère la prise la plus vive (la plus courte).
            score = matched(words(text), words(heard)) + 0.25 * confidence - 0.01 * len(x) / sr
            if best is None or score > best[0]:
                best = (score, x, heard, path.name)
            rate = sr
        if best is None:
            raise SystemExit(f"Aucune prise pour {line['id']}")
        print(f"{line['id']:16} {best[0]:5.2f}  {best[3]:22} → {best[2].strip()}")
        parts.setdefault(line["who"], []).extend([best[1] / (np.abs(best[1]).max() + 1e-9) * 0.9, np.zeros(int(rate * 0.8), np.float32)])
    for who, chunks in parts.items():
        y = np.concatenate(chunks)
        with wave.open(str(HERE / "media" / f"{who}.wav"), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
        print(f"{who} : {len(y) / rate:.1f} s → media/{who}.wav")


if __name__ == "__main__":
    main()
