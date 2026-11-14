"""
Voix du tir (LBD), épisode 2 : un fichier par personnage → une réplique par fichier → timeline.json.

Les trois voix (narrateur, procureur, avocate) sont générées gratuitement avec
Chatterbox (voir ../voix-libres) : media/<personnage>.wav.

Ce script, comme celui des affaires n°1 et n°2 :
  1. resserre le rythme de chaque fichier (pauses de plus de 0,3 s raccourcies,
     tempo +12 % sans changer la hauteur de la voix) ;
  2. le fait transcrire par Whisper et y retrouve les répliques de script.json ;
  3. découpe chaque réplique (voice/<id>.wav) ;
  4. enchaîne le dialogue et écrit timeline.json.

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

START = 0.25  # la voix part presque tout de suite : le hook
TAIL = 3.2  # fin : vote et abonnement
MAX_PAUSE = 0.18  # silences très courts dans une réplique
TEMPO = 1.2  # rythme nerveux, sans changer la hauteur des voix
TEMPO_NARRATEUR = 1.15
TEMPO_TEMOIN = 1.05  # Théo et le policier : émotion, on ne presse pas
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
        tempo = {"narrateur": TEMPO_NARRATEUR, "theo": TEMPO_TEMOIN, "policier": TEMPO_TEMOIN}.get(who, TEMPO)
        # Voix enregistrées une réplique par fichier (media/lignes/<id>.wav, voir choisir.py) :
        # pas de découpage à deviner, on resserre et on aligne chaque réplique séparément.
        if all((HERE / "media" / "lignes" / f"{l['id']}.wav").exists() for l in mine):
            for line in mine:
                tmp = HERE / "voice" / f"_{line['id']}.wav"
                tighten(str(HERE / "media" / "lignes" / f"{line['id']}.wav"), tmp, 0.45 if who in ("theo", "policier") else MAX_PAUSE, tempo)
                x, sr = read(tmp)
                segs, _ = asr.transcribe(for_asr(tmp), language="fr", beam_size=5, word_timestamps=True)
                heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
                words = align(line["text"], heard, len(x) / sr)
                clip, lead = trim(x, sr)
                write(HERE / "voice" / f"{line['id']}.wav", clip, sr)
                clips[line["id"]] = {"dur": len(clip) / sr, "words": [{"w": w["w"], "t": w["t"] - lead} for w in words]}
                tmp.unlink()
            continue
        full = HERE / "voice" / f"{who}.wav"
        tighten(str(HERE / voice["file"]), full, MAX_PAUSE, TEMPO_NARRATEUR if who == "narrateur" else TEMPO)
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
