"""
Voix off d'un seul tenant (par exemple ElevenLabs via vidIQ) → timeline.json.

La narration est lue d'une traite, ce qui donne une intonation naturelle d'une
phrase à l'autre. Ce script la convertit en voice/narration.wav en resserrant
le rythme (pauses de plus de 0,4 s raccourcies, tempo +5 % sans changer la
hauteur de la voix : plus fluide, rythme de vidéo courte), la fait
transcrire par Whisper (instant de chaque mot), retrouve les mots de chaque
réplique de voix.json dans la transcription, puis écrit timeline.json :
départ de chaque réplique et instant de chaque mot (sous-titres).

    pip install faster-whisper            # et ffmpeg dans le PATH
    python narration.py voix-off.mp3
    python narration.py voix-off.mp3 --max-pause 0.5 --tempo 1.0   # rythme d'origine

(voix.py reste disponible pour une voix Piper, synthétisée hors ligne.)
"""

import argparse
import json
import pathlib
import subprocess
import wave

import numpy as np

from voix import HERE, START, align, for_asr, read, tokens

TAIL = 2.4  # temps laissé après la dernière réplique (« ding », confettis)


def tighten(source: str, dst: pathlib.Path, max_pause: float, tempo: float) -> None:
    """Raccourcit les pauses trop longues (fondus de 10 ms) puis accélère légèrement."""
    sr = 44100
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", source, "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    hop = sr // 100
    rms = np.array([np.sqrt(np.mean(x[i : i + hop] ** 2) + 1e-12) for i in range(0, len(x), hop)])
    quiet = 20 * np.log10(rms) < -40
    keep = int(max_pause / 2 * sr)
    cuts = []
    i = 0
    while i < len(quiet):
        if not quiet[i]:
            i += 1
            continue
        j = i
        while j < len(quiet) and quiet[j]:
            j += 1
        if (j - i) / 100 > max_pause and i > 0 and j < len(quiet):
            cuts.append((i * hop + keep, j * hop - keep))
        i = j
    pieces, last = [], 0
    for a, b in cuts:
        pieces.append(x[last:a])
        last = b
    pieces.append(x[last:])
    fade = int(0.01 * sr)
    ramp = np.linspace(0, 1, fade)
    y = pieces[0]
    for p in pieces[1:]:
        y = np.concatenate([y[:-fade], y[-fade:] * (1 - ramp) + p[:fade] * ramp, p[fade:]])
    tmp = dst.with_suffix(".tmp.wav")
    with wave.open(str(tmp), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp), "-af", f"atempo={tempo}", "-ar", str(sr), "-c:a", "pcm_s16le", str(dst)], check=True)
    tmp.unlink()
    print(f"{len(x) / sr:.1f} s → {len(y) / sr / tempo:.1f} s ({len(cuts)} pauses raccourcies)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", nargs="?", help="fichier audio de la narration (mp3, wav…) ; sans lui, réutilise voice/narration.wav")
    parser.add_argument("--max-pause", type=float, default=0.4, help="pause maximale entre deux phrases (secondes)")
    parser.add_argument("--tempo", type=float, default=1.05, help="accélération (1 = vitesse d'origine)")
    args = parser.parse_args()

    wav = HERE / "voice" / "narration.wav"
    if args.source:
        wav.parent.mkdir(exist_ok=True)
        tighten(args.source, wav, args.max_pause, args.tempo)

    from faster_whisper import WhisperModel

    asr = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = asr.transcribe(for_asr(wav), language="fr", beam_size=5, word_timestamps=True)
    heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
    x, sr = read(wav)
    total = len(x) / sr

    script = json.loads((HERE / "voix.json").read_text(encoding="utf-8"))
    lines = script["lines"]
    words = align(" ".join(l["text"] for l in lines), heard, total)
    # La narration démarre de façon à ce que le premier mot tombe à START.
    offset = START - words[0]["t"]
    out = []
    k = 0
    for line in lines:
        n = len(tokens(line["text"]))
        mine = words[k : k + n]
        k += n
        out.append({"id": line["id"], "text": line["text"], "start": round(mine[0]["t"] + offset, 3),
                    "words": [{"w": w["w"], "t": round(w["t"] + offset, 3)} for w in mine]})
    # Fin de chaque réplique : fin du dernier mot entendu avant la réplique suivante.
    ends = [e for _, _, e in heard]
    for i, line in enumerate(out):
        nxt = out[i + 1]["start"] - offset if i + 1 < len(out) else total
        last = max([e for e in ends if e <= nxt + 0.05] or [nxt])
        line["dur"] = round(max(0.3, last + offset - line["start"]), 3)
    end = out[-1]["start"] + out[-1]["dur"]
    timeline = {
        "_doc": "Généré par narration.py : ne pas modifier à la main.",
        "narration": {"file": "voice/narration.wav", "offset": round(offset, 3)},
        "duration": round(end + TAIL, 2),
        "lines": out,
    }
    (HERE / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=1), encoding="utf-8")
    for line in out:
        print(f"{line['id']:14} {line['start']:6.2f} s  +{line['dur']:5.2f} s")
    print(f"Durée totale : {timeline['duration']} s (décalage {offset:+.2f} s)")


if __name__ == "__main__":
    main()
