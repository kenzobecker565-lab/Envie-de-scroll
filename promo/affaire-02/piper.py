"""
Voix gratuites du procureur et de l'avocate (Piper, hors ligne).

Pour chaque réplique de script.json dite par le procureur ou l'avocate : cinq
prises, transcrites par Whisper ; la mieux comprise est gardée. Les répliques
d'un même personnage sont mises bout à bout (0,8 s de silence entre elles)
dans media/<personnage>.wav, que voix.py découpe ensuite comme les voix
ElevenLabs.

Voix choisies après un essai (clarté mesurée par Whisper, variation de la
hauteur de la voix pour l'expressivité) :
  - procureur : fr_FR-upmc-medium, locuteur « pierre » ;
  - avocate   : fr_FR-siwis-medium.

    pip install piper-tts faster-whisper
    python -m piper.download_voices fr_FR-upmc-medium fr_FR-siwis-medium
    python piper.py --voices-dir <dossier des voix>
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
VOICES = {"procureur": ("fr_FR-upmc-medium", 1), "avocate": ("fr_FR-siwis-medium", None)}


def norm(word: str) -> str:
    word = unicodedata.normalize("NFKD", word.lower())
    word = "".join(c for c in word if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", word)


def to16k(x: np.ndarray, sr: int) -> np.ndarray:
    n = int(len(x) * 16000 / sr)
    return np.interp(np.arange(n) * sr / 16000, np.arange(len(x)), x).astype(np.float32)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--voices-dir", default=".")
    parser.add_argument("--takes", type=int, default=5)
    args = parser.parse_args()

    from faster_whisper import WhisperModel
    from piper import PiperVoice, SynthesisConfig

    asr = WhisperModel("small", device="cpu", compute_type="int8")
    script = json.loads((HERE / "script.json").read_text(encoding="utf-8"))
    with tempfile.TemporaryDirectory() as tmp:
        for who, (name, speaker) in VOICES.items():
            voice = PiperVoice.load(str(pathlib.Path(args.voices_dir) / f"{name}.onnx"))
            sr = voice.config.sample_rate
            parts = []
            for line in [l for l in script["lines"] if l["who"] == who]:
                text = line.get("say", line["text"])
                best = None
                for take in range(args.takes):
                    path = pathlib.Path(tmp) / f"{line['id']}-{take}.wav"
                    with wave.open(str(path), "wb") as w:
                        voice.synthesize_wav(text, w, syn_config=SynthesisConfig(speaker_id=speaker, length_scale=1.0, noise_scale=0.7, noise_w_scale=0.85))
                    with wave.open(str(path)) as w:
                        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
                    segs = list(asr.transcribe(to16k(x, sr), language="fr", beam_size=5)[0])
                    heard = " ".join(s.text for s in segs)
                    expected = [norm(t) for t in text.split()]
                    got = {norm(t) for t in heard.split()}
                    score = sum(t in got for t in expected) / len(expected) + 0.2 * sum(s.avg_logprob for s in segs) / max(1, len(segs))
                    if best is None or score > best[0]:
                        best = (score, x, heard)
                print(f"{line['id']:12} {best[0]:.2f}  → {best[2].strip()}")
                parts += [best[1], np.zeros(int(sr * 0.8), np.float32)]
            y = np.concatenate(parts)
            with wave.open(str(HERE / "media" / f"{who}.wav"), "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(sr)
                w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
            print(f"{who} : {len(y) / sr:.1f} s → media/{who}.wav")


if __name__ == "__main__":
    main()
