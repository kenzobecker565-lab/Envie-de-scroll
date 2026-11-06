"""
Choisit la meilleure prise de chaque réplique (générées par generer.py) et
assemble un fichier par personnage, que voix.py découpe ensuite.

Pour chaque prise : Whisper la transcrit ; la note récompense les mots du texte
entendus dans l'ordre, et pénalise les mots en trop (une synthèse qui
« bafouille » ou ajoute des sons) et une confiance faible. Les silences du
début et de la fin sont retirés. Les répliques d'un même personnage sont mises
bout à bout, séparées de 0,8 s, dans <affaire>/media/<personnage>.wav.

    pip install faster-whisper
    python voix-libres/choisir.py affaire-03
"""

import argparse
import json
import pathlib
import re
import unicodedata
import wave

import numpy as np

HERE = pathlib.Path(__file__).parent


def norm(word: str) -> str:
    word = unicodedata.normalize("NFKD", word.lower())
    word = "".join(c for c in word if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", word)


def words(text: str) -> list[str]:
    return [w for w in (norm(t) for t in text.replace("-", " ").replace("'", " ").replace("’", " ").split()) if w]


def matched(expected: list[str], heard: list[str]) -> float:
    """Part des mots attendus entendus dans l'ordre, moins une pénalité pour les mots en trop."""
    table = [[0] * (len(heard) + 1) for _ in range(len(expected) + 1)]
    for i, e in enumerate(expected):
        for j, h in enumerate(heard):
            table[i + 1][j + 1] = table[i][j] + 1 if e == h else max(table[i][j + 1], table[i + 1][j])
    return table[-1][-1] / len(expected) - 0.15 * max(0, len(heard) - len(expected))


def read(path: pathlib.Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path)) as w:
        sr = w.getframerate()
        width = w.getsampwidth()
        raw = w.readframes(w.getnframes())
    if width == 2:
        x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    else:
        x = np.frombuffer(raw, np.int32).astype(np.float32) / 2**31
    return x, sr


def trim(x: np.ndarray, sr: int) -> np.ndarray:
    hop = sr // 100
    env = np.array([np.abs(x[i : i + hop]).max() for i in range(0, len(x), hop)])
    loud = np.nonzero(env > 0.03 * env.max())[0]
    if len(loud) == 0:
        return x
    a = max(0, loud[0] * hop - sr * 30 // 1000)
    b = min(len(x), (loud[-1] + 1) * hop + sr * 120 // 1000)
    return x[a:b]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("affaire")
    args = parser.parse_args()
    from faster_whisper import WhisperModel

    asr = WhisperModel("small", device="cpu", compute_type="int8")
    folder = HERE.parent / args.affaire
    script = json.loads((folder / "script.json").read_text(encoding="utf-8"))
    takes_dir = HERE / "prises" / args.affaire
    parts: dict[str, list[np.ndarray]] = {}
    rate = None
    for line in script["lines"]:
        text = line.get("say", line["text"])
        best = None
        for path in sorted(takes_dir.glob(f"{line['id']}-*.wav")):
            x, sr = read(path)
            x = trim(x, sr)
            n = int(len(x) * 16000 / sr)
            x16 = np.interp(np.arange(n) * sr / 16000, np.arange(len(x)), x).astype(np.float32)
            segs = list(asr.transcribe(x16, language="fr", beam_size=5)[0])
            heard = " ".join(s.text for s in segs)
            confidence = sum(s.avg_logprob for s in segs) / max(1, len(segs))
            score = matched(words(text), words(heard)) + 0.25 * confidence
            if best is None or score > best[0]:
                best = (score, x, heard, path.name)
            rate = sr
        if best is None:
            raise SystemExit(f"Aucune prise pour {line['id']} (lance d'abord generer.py)")
        print(f"{line['id']:16} {best[0]:5.2f}  {best[3]:22} → {best[2].strip()}")
        parts.setdefault(line["who"], []).extend([best[1], np.zeros(int(rate * 0.8), np.float32)])
    for who, chunks in parts.items():
        y = np.concatenate(chunks)
        y = y / (np.abs(y).max() + 1e-9) * 0.9
        with wave.open(str(folder / "media" / f"{who}.wav"), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
        print(f"{who} : {len(y) / rate:.1f} s → {args.affaire}/media/{who}.wav")


if __name__ == "__main__":
    main()
