"""
Voix off de la pub, synthétisée avec Piper (voix neuronales, hors ligne).

Chaque réplique de voiceover.json devient un fichier voice/<id>.wav, que
audio.mjs place ensuite au bon temps musical. Les fichiers générés sont
versionnés : il n'est utile de relancer ce script que pour changer le texte
ou la voix.

La synthèse varie un peu d'une fois à l'autre. Avec --takes N, le script
enregistre N prises par réplique, les fait transcrire par Whisper et garde
celle qui est la mieux comprise (c'est ainsi qu'ont été choisies les prises
versionnées, avec --takes 6).

    pip install piper-tts                    # et faster-whisper pour --takes
    python -m piper.download_voices fr_FR-siwis-medium
    python voiceover.py --takes 6
    python voiceover.py --voice fr_FR-tom-medium --out build/essai-tom
"""

import argparse
import json
import pathlib
import re
import shutil
import tempfile
import unicodedata
import wave

from piper import PiperVoice, SynthesisConfig

HERE = pathlib.Path(__file__).parent


def words(text: str) -> list[str]:
    """Mots normalisés, sans accents ni terminaisons muettes (« filmes » = « filme »)."""
    text = unicodedata.normalize("NFKD", text.lower().replace("plusse", "plus"))
    text = "".join(c for c in text if not unicodedata.combining(c))
    return [re.sub(r"(es|e|s|t|x)$", "", w) or w for w in re.sub(r"[^a-z ]", " ", text).split()]


def matched(expected: list[str], heard: list[str]) -> float:
    """Part des mots attendus entendus dans l'ordre (plus longue sous-suite commune)."""
    table = [[0] * (len(heard) + 1) for _ in range(len(expected) + 1)]
    for i, e in enumerate(expected):
        for j, h in enumerate(heard):
            table[i + 1][j + 1] = table[i][j] + 1 if e == h else max(table[i][j + 1], table[i + 1][j])
    return table[-1][-1] / len(expected) - 0.1 * max(0, len(heard) - len(expected))


def main() -> None:
    script = json.loads((HERE / "voiceover.json").read_text(encoding="utf-8"))
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--voice", default=script["voice"], help="nom de la voix Piper (ex. fr_FR-siwis-medium)")
    parser.add_argument("--speaker", type=int, default=script.get("speaker"), help="locuteur, pour les voix qui en ont plusieurs")
    parser.add_argument("--voices-dir", default=".", help="dossier contenant les fichiers <voix>.onnx et .onnx.json")
    parser.add_argument("--out", default=str(HERE / "voice"), help="dossier de sortie")
    parser.add_argument("--takes", type=int, default=1, help="prises par réplique ; la mieux comprise par Whisper est gardée")
    args = parser.parse_args()

    voice = PiperVoice.load(str(pathlib.Path(args.voices_dir) / f"{args.voice}.onnx"))
    asr = None
    if args.takes > 1:
        from faster_whisper import WhisperModel

        asr = WhisperModel("small", device="cpu", compute_type="int8")
    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        for line in script["lines"]:
            config = SynthesisConfig(
                speaker_id=args.speaker,
                length_scale=line.get("lengthScale", script.get("lengthScale")),
                noise_scale=line.get("noiseScale", script.get("noiseScale")),
                noise_w_scale=line.get("noiseW", script.get("noiseW")),
            )
            best = None
            for take in range(args.takes):
                path = pathlib.Path(tmp) / f"{line['id']}-{take}.wav"
                with wave.open(str(path), "wb") as wav:
                    voice.synthesize_wav(line.get("say", line["text"]), wav, syn_config=config)
                if asr is None:
                    best = (0.0, path, "")
                    break
                segments = list(asr.transcribe(str(path), language="fr", beam_size=5)[0])
                heard = " ".join(s.text.strip() for s in segments)
                confidence = sum(s.avg_logprob for s in segments) / max(1, len(segments))
                score = matched(words(line["text"]), words(heard)) + 0.25 * confidence
                if best is None or score > best[0]:
                    best = (score, path, heard)
            _, path, heard = best
            shutil.copy(path, out / f"{line['id']}.wav")
            with wave.open(str(out / f"{line['id']}.wav"), "rb") as wav:
                seconds = wav.getnframes() / wav.getframerate()
            print(f"{line['id']:28} {seconds:5.2f} s  « {line['text']} »" + (f"  → entendu : {heard}" if heard else ""))


if __name__ == "__main__":
    main()
