"""
Voix off de « Pourquoi ça chauffe ? Le micro-ondes », synthétisée avec Piper
(hors ligne, une réplique par fichier ; la vidéo utilise plutôt narration.py).

Pour chaque réplique de voix.json : N prises, transcrites par Whisper ; la
mieux comprise est gardée (silences retirés) dans voice/<id>.wav. Le script
écrit ensuite timeline.json : l'instant de départ de chaque réplique, enchaînées
les unes après les autres, et l'instant de chaque mot (sous-titres mot à mot),
partagé par l'image (main.js) et le son (audio.mjs).

    pip install piper-tts faster-whisper
    python -m piper.download_voices fr_FR-tom-medium
    python voix.py --voices-dir <dossier des voix> --takes 4
    python voix.py --timeline-only        # recalcule seulement timeline.json
"""

import argparse
import json
import pathlib
import re
import tempfile
import unicodedata
import wave

import numpy as np

HERE = pathlib.Path(__file__).parent
START = 0.7  # la première réplique démarre après l'apparition du titre
GAP = 0.18  # respiration entre deux répliques


def norm(word: str) -> str:
    word = unicodedata.normalize("NFKD", word.lower())
    word = "".join(c for c in word if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", word)


def tokens(text: str) -> list[str]:
    """Mots affichés en sous-titres (la ponctuation reste collée au mot)."""
    out: list[str] = []
    for w in text.split():
        if out and not norm(w):  # « : », « ? » : collés au mot précédent
            out[-1] += "\u00a0" + w
        else:
            out.append(w)
    return out


def read(path: pathlib.Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return x, sr


def write(path: pathlib.Path, x: np.ndarray, sr: int) -> None:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def trim(x: np.ndarray, sr: int) -> np.ndarray:
    """Retire les silences du début et de la fin (avec 40 ms de marge)."""
    hop = sr // 100
    env = np.array([np.abs(x[i : i + hop]).max() for i in range(0, len(x), hop)])
    loud = np.nonzero(env > 0.02)[0]
    if len(loud) == 0:
        return x
    a = max(0, loud[0] * hop - sr * 40 // 1000)
    b = min(len(x), (loud[-1] + 1) * hop + sr * 60 // 1000)
    return x[a:b]


def for_asr(path: pathlib.Path) -> np.ndarray:
    """Le son à 16 kHz, comme Whisper l'attend."""
    x, sr = read(path)
    n = int(len(x) * 16000 / sr)
    return np.interp(np.arange(n) * sr / 16000, np.arange(len(x)), x).astype(np.float32)


def align(text: str, heard: list[tuple[str, float, float]], dur: float) -> list[dict]:
    """Associe chaque mot du texte à un mot entendu (plus longue sous-suite commune)."""
    shown = tokens(text)
    a = [norm(w) for w in shown]
    b = [norm(w) for w, _, _ in heard]
    n, m = len(a), len(b)
    table = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            table[i][j] = table[i + 1][j + 1] + 1 if a[i] == b[j] else max(table[i + 1][j], table[i][j + 1])
    times: list[float | None] = [None] * n
    i = j = 0
    while i < n and j < m:
        if a[i] == b[j]:
            times[i] = heard[j][1]
            i += 1
            j += 1
        elif table[i + 1][j] >= table[i][j + 1]:
            i += 1
        else:
            j += 1
    # Mots non reconnus (nombres écrits en chiffres…) : interpolés entre leurs voisins.
    known = [(k, t) for k, t in enumerate(times) if t is not None]
    if not known:
        known = [(0, 0.0)]
    known = [(-1, 0.0)] + known + [(n, dur)]
    for (k0, t0), (k1, t1) in zip(known, known[1:]):
        for k in range(k0 + 1, k1):
            times[k] = t0 + (t1 - t0) * (k - k0) / (k1 - k0)
    return [{"w": w, "t": round(max(0.0, t), 3)} for w, t in zip(shown, times)]


def main() -> None:
    script = json.loads((HERE / "voix.json").read_text(encoding="utf-8"))
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--voice", default=script["voice"])
    parser.add_argument("--voices-dir", default=".")
    parser.add_argument("--takes", type=int, default=4)
    parser.add_argument("--only", default=None, help="ne refaire que ces répliques (ids séparés par des virgules)")
    parser.add_argument("--timeline-only", action="store_true")
    args = parser.parse_args()

    out = HERE / "voice"
    out.mkdir(exist_ok=True)
    from faster_whisper import WhisperModel

    asr = WhisperModel("small", device="cpu", compute_type="int8")
    only = set(args.only.split(",")) if args.only else None

    if not args.timeline_only:
        from piper import PiperVoice, SynthesisConfig

        voice = PiperVoice.load(str(pathlib.Path(args.voices_dir) / f"{args.voice}.onnx"))
        with tempfile.TemporaryDirectory() as tmp:
            for line in script["lines"]:
                if only and line["id"] not in only:
                    continue
                config = SynthesisConfig(
                    length_scale=line.get("lengthScale", script["lengthScale"]),
                    noise_scale=line.get("noiseScale", script["noiseScale"]),
                    noise_w_scale=line.get("noiseW", script["noiseW"]),
                )
                best = None
                for take in range(args.takes):
                    path = pathlib.Path(tmp) / f"{line['id']}-{take}.wav"
                    with wave.open(str(path), "wb") as w:
                        voice.synthesize_wav(line.get("say", line["text"]), w, syn_config=config)
                    x, sr = read(path)
                    write(path, trim(x, sr), sr)
                    segs, _ = asr.transcribe(for_asr(path), language="fr", beam_size=5)
                    segs = list(segs)
                    heard = " ".join(s.text.strip() for s in segs)
                    expected = [norm(w) for w in tokens(line.get("say", line["text"]))]
                    got = [norm(w) for w in heard.split()]
                    hits = sum(1 for w in expected if w in got)
                    score = hits / len(expected) + 0.2 * sum(s.avg_logprob for s in segs) / max(1, len(segs))
                    if best is None or score > best[0]:
                        best = (score, path, heard)
                _, path, heard = best
                x, sr = read(path)
                write(out / f"{line['id']}.wav", x, sr)
                print(f"{line['id']:14} {len(x) / sr:5.2f} s  → {heard}")

    # ------------------------------------------------ timeline (départs + mots)
    t = START
    lines = []
    for line in script["lines"]:
        path = out / f"{line['id']}.wav"
        x, sr = read(path)
        dur = len(x) / sr
        segs, _ = asr.transcribe(for_asr(path), language="fr", beam_size=5, word_timestamps=True)
        heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
        words = align(line["text"], heard, dur)
        lines.append({"id": line["id"], "text": line["text"], "start": round(t, 3), "dur": round(dur, 3),
                      "words": [{"w": w["w"], "t": round(t + w["t"], 3)} for w in words]})
        t += dur + GAP + line.get("pause", 0)
    timeline = {"_doc": "Généré par voix.py : ne pas modifier à la main.", "duration": round(t + 2.4, 2), "lines": lines}
    (HERE / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Durée totale : {timeline['duration']} s")


if __name__ == "__main__":
    main()
