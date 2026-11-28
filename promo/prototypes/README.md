# Prototypes de style (5 s chacun)

Le même passage de l'affaire n°5 (60,05 → 65,25 s, voix ElevenLabs), dans quatre styles. Le détail des styles, les durées de rendu et la recommandation sont dans **[RAPPORT.md](RAPPORT.md)**.

▶️ **[Comparatif des 4 styles côte à côte](comparatif.mp4)**

| | Style | Vidéo | Code |
| --- | --- | --- | --- |
| A | Motion design 2D vectoriel | [proto-flat.mp4](flat/proto-flat.mp4) | `flat/` |
| B | BD animée façon webtoon (Open Peeps, CC0) | [proto-bd.mp4](bd/proto-bd.mp4) | `bd/` |
| C | Noir cinématique | [proto-noir.mp4](noir/proto-noir.mp4) | `noir/` |
| D | 3D cartoon soigné (profondeur de champ) | [proto-cartoon.mp4](cartoon/proto-cartoon.mp4) | `cartoon/` |

- **Socle commun** : `commun.js` (instants des mots, synchronisation des lèvres, sous-titres, grain, secousses, branchement sur `render.mjs`).
- **Rendu** : `bash prototypes/rendre.sh <flat|bd|noir|cartoon>`.
- **Personnages des prototypes B et C** : `bd/peeps.json`, une conversion en SVG des illustrations Open Peeps de Pablo Stanley (CC0), assemblées par `bd/peeps.js`.

## Prototype E : « La Reconstitution » (diorama 3D miniature)

▶️ **[proto-diorama.mp4](diorama/proto-diorama.mp4)** (6,8 s). La scène est une maquette vue de dessus, posée sur un socle en bois : rue de nuit, bijouterie avec son alarme, maison du voisin, voiture de fuite, figurines. Un effet « tilt-shift » floute le haut et le bas de l'image, comme quand on photographie un modèle réduit. Des repères d'enquêteur sont posés sur le décor : chronomètre 23:16, étiquettes qui suivent les figurines, trajectoires en pointillés.

- Voix du narrateur générée avec Chatterbox (`diorama/script.json`, `diorama/voix.py`), son de l'extrait composé par `diorama/son.py`.
- Rendu : `node render.mjs --ad=proto-diorama --from=0 --to=6.77 --out=video.mp4`, puis assemblage avec `son.wav`.
