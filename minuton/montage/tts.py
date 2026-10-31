"""Synthèse vocale française avec Kokoro-82M (poids Apache 2.0), voix ff_siwis (données SIWIS, CC BY 4.0).

Installation (Python 3.13) : pip install --no-deps kokoro misaki ; pip install torch espeakng-loader
phonemizer num2words loguru huggingface_hub transformers soundfile

Usage : python3 tts.py <sortie.wav> "<texte>" [vitesse]
"""
import os
import sys
import types

import espeakng_loader

# misaki importe spaCy pour l'anglais seulement : un module vide suffit pour le français
sys.modules.setdefault('spacy', types.ModuleType('spacy'))
# espeak-ng embarqué dans espeakng-loader, pour la phonétisation
os.environ.setdefault('PHONEMIZER_ESPEAK_LIBRARY', espeakng_loader.get_library_path())
os.environ.setdefault('ESPEAK_DATA_PATH', espeakng_loader.get_data_path())

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
from kokoro import KPipeline  # noqa: E402

_p = None


def say(text, out, speed=1.0, voice='ff_siwis', ps=None):
    """ps : phonèmes imposés (alphabet phonétique international), pour un mot mal lu (« beurk »)."""
    global _p
    if _p is None:
        _p = KPipeline(lang_code='f')
    gen = _p.generate_from_tokens(ps, voice=voice, speed=speed) if ps else _p(text, voice=voice, speed=speed)
    audio = np.concatenate([np.asarray(r.audio) for r in gen])
    sf.write(out, audio, 24000, subtype='PCM_16')
    return out


if __name__ == '__main__':
    say(sys.argv[2], sys.argv[1], float(sys.argv[3]) if len(sys.argv) > 3 else 1.0)
