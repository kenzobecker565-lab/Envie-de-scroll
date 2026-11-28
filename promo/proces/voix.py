"""
Voix du procès : une narration par personnage → une réplique par fichier → timeline.json.

Chaque personnage (narrateur, juge, procureur, avocate) est lu d'une traite par
sa voix ElevenLabs (media/<personnage>.mp3, généré avec vidIQ) : l'intonation
reste naturelle. Ce script :
  1. resserre le rythme de chaque fichier (pauses de plus de 0,35 s raccourcies,
     tempo +4 % sans changer la hauteur de la voix) ;
  2. le fait transcrire par Whisper (instant de chaque mot) et y retrouve les
     répliques de script.json ;
  3. découpe chaque réplique dans le silence qui la sépare de la suivante
     (voice/<id>.wav, silences du bord retirés) ;
  4. enchaîne les répliques dans l'ordre du script, avec le silence « gap »
     avant chacune, et écrit timeline.json (départ et durée de chaque réplique,
     instant de chaque mot pour les sous-titres).

    pip install faster-whisper            # et ffmpeg dans le PATH
    python voix.py
"""

import json
import pathlib
import sys

import numpy as np

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "micro-ondes"))
from narration import tighten  # noqa: E402
from voix import align, for_asr, read, tokens, write  # noqa: E402

START = 0.6  # première réplique (après l'apparition du titre)
TAIL = 7.5  # fin : coup de marteau, écran de vote
DEFAULT_GAP = 0.25


def trim(x: np.ndarray, sr: int) -> tuple[np.ndarray, float]:
    """Retire les silences du bord (marges de 40 et 120 ms) ; renvoie aussi le décalage du début."""
    hop = sr // 100
    env = np.array([np.abs(x[i : i + hop]).max() for i in range(0, len(x), hop)])
    loud = np.nonzero(env > 0.02)[0]
    if len(loud) == 0:
        return x, 0.0
    a = max(0, loud[0] * hop - sr * 40 // 1000)
    b = min(len(x), (loud[-1] + 1) * hop + sr * 120 // 1000)
    y = x[a:b].copy()
    fade = sr // 200
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    return y, a / sr


def main() -> None:
    script = json.loads((HERE / "script.json").read_text(encoding="utf-8"))
    from faster_whisper import WhisperModel

    asr = WhisperModel("small", device="cpu", compute_type="int8")
    clips = {}
    for who, voice in script["voices"].items():
        mine = [l for l in script["lines"] if l["who"] == who]
        full = HERE / "voice" / f"{who}.wav"
        tighten(str(HERE / voice["file"]), full, 0.35, 1.04)
        x, sr = read(full)
        segs, _ = asr.transcribe(for_asr(full), language="fr", beam_size=5, word_timestamps=True)
        heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
        words = align(" ".join(l["text"] for l in mine), heard, len(x) / sr)
        ends = [e for _, _, e in heard]
        # Bornes de chaque réplique : au milieu du silence avant la suivante.
        starts = []
        k = 0
        for line in mine:
            n = len(tokens(line["text"]))
            starts.append((k, n))
            k += n
        bounds = []
        for i, (k, n) in enumerate(starts):
            t0 = words[k]["t"]
            if i + 1 < len(starts):
                nxt = words[starts[i + 1][0]]["t"]
                last = max([e for e in ends if e <= nxt + 0.02] or [nxt])
                t1 = (last + nxt) / 2
            else:
                t1 = len(x) / sr
            bounds.append((t0, t1))
        for i, (line, (t0, t1)) in enumerate(zip(mine, bounds)):
            a = max(0, int((t0 - 0.12) * sr)) if i == 0 else int((bounds[i - 1][1]) * sr)
            seg = x[a : int(t1 * sr)]
            clip, lead = trim(seg, sr)
            k, n = starts[i]
            rel = [{"w": w["w"], "t": w["t"] - a / sr - lead} for w in words[k : k + n]]
            write(HERE / "voice" / f"{line['id']}.wav", clip, sr)
            clips[line["id"]] = {"dur": len(clip) / sr, "words": rel}
        full.unlink()

    t = START
    out = []
    for line in script["lines"]:
        t += 0 if not out else line.get("gap", DEFAULT_GAP)
        c = clips[line["id"]]
        out.append({
            "id": line["id"],
            "who": line["who"],
            "text": line["text"],
            "start": round(t, 3),
            "dur": round(c["dur"], 3),
            "words": [{"w": w["w"], "t": round(t + max(0.0, min(c["dur"], w["t"])), 3)} for w in c["words"]],
        })
        t += c["dur"]
    timeline = {"_doc": "Généré par voix.py : ne pas modifier à la main.", "duration": round(t + TAIL, 2), "lines": out}
    (HERE / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=1), encoding="utf-8")
    for l in out:
        print(f"{l['id']:15} {l['who']:10} {l['start']:6.2f} s  +{l['dur']:5.2f} s")
    print(f"Durée totale : {timeline['duration']} s")


if __name__ == "__main__":
    main()
