"""Mots (Whisper) et enveloppe d'amplitude (bouche) de chaque réplique des hooks prototypes → data.json."""
import json, pathlib, wave
import numpy as np
from faster_whisper import WhisperModel

HERE = pathlib.Path(__file__).parent
asr = WhisperModel("small", device="cpu", compute_type="int8")
out = {}
for f in sorted((HERE / "media").glob("*.wav")):
    with wave.open(str(f)) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    hop = sr // 30
    env = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x), hop)])
    env = np.clip(env / (np.percentile(env, 95) + 1e-6), 0, 1)
    a16 = np.interp(np.arange(0, len(x) / sr, 1 / 16000), np.arange(len(x)) / sr, x).astype(np.float32)
    segs, _ = asr.transcribe(a16, language="fr", word_timestamps=True)
    words = [{"w": w.word.strip(), "t": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
    out[f.stem] = {"dur": round(len(x) / sr, 3), "env": [round(float(v), 3) for v in env], "words": words}
    print(f.stem, out[f.stem]["dur"], [(w["w"], w["t"]) for w in words])
(HERE / "data.json").write_text(json.dumps(out, ensure_ascii=False))
