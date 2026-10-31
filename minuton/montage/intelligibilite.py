"""Note l'intelligibilité de fichiers WAV avec Whisper (transcription comparée au texte attendu)."""
import difflib, re, sys, wave
import numpy as np
from scipy.signal import resample_poly
from faster_whisper import WhisperModel

m = WhisperModel('small', device='cpu', compute_type='int8')
norm = lambda s: re.sub(r"[^a-zàâçéèêëîïôûùüÿœ' ]", ' ', s.lower().replace('’', "'")).split()


def load16k(p):
    with wave.open(p) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        sr, ch = w.getframerate(), w.getnchannels()
    if ch == 2: a = a.reshape(-1, 2).mean(1)
    from math import gcd
    g = gcd(sr, 16000)
    return resample_poly(a, 16000 // g, sr // g).astype(np.float32)


def score(path, ref):
    segs, _ = m.transcribe(load16k(path), language='fr', beam_size=5)
    txt = ' '.join(x.text for x in segs).strip()
    return difflib.SequenceMatcher(None, norm(ref), norm(txt)).ratio(), txt


if __name__ == '__main__':
    ref = sys.argv[1]
    for p in sys.argv[2:]:
        r, t = score(p, ref)
        print(f'{p}: {r:.2f} | {t}')
