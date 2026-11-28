# Petite bande-son du prototype : nappe grave, coups de tampon, souffles aux transitions.
import numpy as np, wave, sys
SR = 48000; D = 5.6; n = int(SR * D); t = np.arange(n) / SR
rng = np.random.default_rng(3)
out = 0.08 * np.sin(2*np.pi*55*t) * (0.6 + 0.4*np.sin(2*np.pi*0.3*t)) + 0.05*np.sin(2*np.pi*82.4*t)
out *= np.minimum(1, t/0.4)
def add(t0, sig):
    i = int(t0*SR); out[i:i+len(sig)] += sig[:n-i]
def thump(f=60, dur=0.5, amp=0.9):
    u = np.arange(int(dur*SR))/SR
    body = np.sin(2*np.pi*f*u*(1+2*np.exp(-u*30))) * np.exp(-u*9)
    click = rng.standard_normal(len(u)) * np.exp(-u*80) * 0.6
    return amp*(body+click)
def whoosh(dur=0.45, amp=0.35):
    u = np.arange(int(dur*SR))/SR; w = rng.standard_normal(len(u))
    w = np.convolve(w, np.ones(12)/12, 'same')
    return amp * w * np.sin(np.pi*u/dur)**2
def tick(amp=0.25):
    u = np.arange(int(0.03*SR))/SR
    return amp*rng.standard_normal(len(u))*np.exp(-u*200)
for t0 in (1.05, 1.55, 3.15, 3.55, 4.6, 4.95): add(t0, thump(55 if t0 in (1.05, 4.95) else 70))
for t0 in (1.83, 3.98): add(t0, whoosh())
for t0 in np.arange(0.9, 1.3, 0.045): add(t0, tick())
for t0 in np.arange(2.25, 2.8, 0.045): add(t0, tick())
add(2.9, tick(0.6)); add(3.0, tick(0.5))
for t0 in np.arange(4.4, 4.9, 0.045): add(t0, tick())
out = np.tanh(out*1.2) * 0.8
fade = np.minimum(1, (D - t)/0.3); out *= fade
pcm = (np.stack([out, out], 1) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
