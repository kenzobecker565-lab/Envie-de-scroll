# Le tir (LBD) — épisode 2/2 « Le verdict »

Affaire fictive. Suite de `../lbd-01`.

- Voix ElevenLabs du créateur du compte, une prise par réplique (`media/elevenlabs/<id>.mp3`) :
  narrateur « Nicolas », procureur « Paul K », défense « Peter », Théo « Anthony Sirius »,
  le policier « Thierry ».
- Les avocats sont en costume (veste, chemise, cravate) : `personnage.js` vient de
  `../prototypes/costume`.

Fabrication :

```
bash lbd-02/media/convertir.sh      # mp3 → media/lignes/<id>.wav
python3 lbd-02/voix.py              # timeline.json
python3 demo-v2/levres.py lbd-02    # levres.json
CHROMIUM=/opt/pw-browsers/chromium node render.mjs --ad=lbd-02 --workers=3
node proces/marque.mjs --video=lbd-02
```

Scènes : caméra-piéton du policier (« image jamais vue », le pavé retombe à 2 m,
replay de l'autre pierre), procès (défense, procureur), carton « abonne-toi »,
Théo, le policier dans le box, verdict (coupable, 18 mois avec sursis, 5 ans
d'interdiction d'exercer), vote et abonnement.
