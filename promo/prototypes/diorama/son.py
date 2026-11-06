"""
Bande-son de l'extrait « La Reconstitution » : nappe grave, tic-tac du
chronomètre, alarme à deux tons sur « l'alarme », voix du narrateur.
    python son.py → son.wav
"""

import json
import pathlib
import wave

import numpy as np

HERE = pathlib.Path(__file__).parent
SR = 44100
tl = json.loads((HERE / "timeline.json").read_text())
line = tl["lines"][0]
N = int(tl["duration"] * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(4)

mix = np.zeros(N)
# Nappe grave qui monte doucement.
mix += 0.06 * np.sin(2 * np.pi * 55 * t) * np.minimum(1, t / 1.5)
mix += 0.03 * np.sin(2 * np.pi * 82.4 * t + 0.4 * np.sin(2 * np.pi * 0.3 * t)) * np.minimum(1, t / 2)
# Tic-tac (trois par seconde, comme le chronomètre).
for k in np.arange(line["start"], tl["duration"] - 0.3, 1 / 3):
    i = int(k * SR)
    n = int(0.03 * SR)
    mix[i : i + n] += 0.05 * rng.standard_normal(n) * np.exp(-np.arange(n) / (0.004 * SR))
# Alarme à deux tons, à partir de « l'alarme ».
alarm = next(w["t"] for w in line["words"] if "alarme" in w["w"].lower())
m = t >= alarm
tone = np.where(((t - alarm) // 0.25) % 2 == 0, 880, 660)
sq = np.sign(np.sin(2 * np.pi * np.cumsum(tone / SR)))
mix += m * 0.035 * sq * np.minimum(1, np.maximum(0, t - alarm) / 0.05)
# Voix.
with wave.open(str(HERE / "voice" / f"{line['id']}.wav")) as w:
    v = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    vsr = w.getframerate()
v = np.interp(np.arange(int(len(v) * SR / vsr)) * vsr / SR, np.arange(len(v)), v)
i0 = int(line["start"] * SR)
mix[i0 : i0 + len(v)] += 0.9 * v[: N - i0]
# Fondu de fin, normalisation.
mix *= np.minimum(1, (tl["duration"] - t) / 0.4)
mix = mix / np.abs(mix).max() * 0.89
with wave.open(str(HERE / "son.wav"), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("son.wav", round(tl["duration"], 2), "s")
