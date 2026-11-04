"""
Enveloppe de la voix pour la synchronisation des lèvres : pour chaque réplique
de l'affaire n°5 (../affaire-05/voice/<id>.wav), l'ouverture de la bouche
(0 → 1) 60 fois par seconde → levres.json.

    python demo-v2/levres.py
"""

import json
import pathlib
import wave

import numpy as np

HERE = pathlib.Path(__file__).parent
RATE = 60

out = {}
for p in sorted((HERE.parent / "affaire-05" / "voice").glob("*.wav")):
    with wave.open(str(p)) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        if w.getnchannels() > 1:
            x = x.reshape(-1, w.getnchannels()).mean(1)
    hop = sr // RATE
    rms = np.array([np.sqrt(np.mean(x[i : i + hop * 2] ** 2)) for i in range(0, len(x), hop)])
    db = 20 * np.log10(rms + 1e-6)
    # Relatif au plus fort de la réplique : la bouche s'ouvre sur les syllabes accentuées.
    v = np.clip((db - (db.max() - 22)) / 22, 0, 1) ** 1.4
    # Lissage court, puis petites variations pour que la bouche ne reste pas figée.
    v = np.convolve(v, np.ones(3) / 3, mode="same")
    out[p.stem] = [round(float(a), 2) for a in v]
(HERE / "levres.json").write_text(json.dumps(out))
print(len(out), "répliques")
