# Voix libres : des voix naturelles, gratuites, pour les affaires

Quand il n'y a plus de crédits ElevenLabs (vidIQ), les affaires peuvent être doublées gratuitement, sur la machine, avec **[Chatterbox](https://github.com/resemble-ai/chatterbox)** (Resemble AI, licence MIT), son modèle multilingue qui parle français. Il imite le timbre d'une courte voix de référence et joue le texte de façon bien plus naturelle que Piper.

## Les trois voix de référence (`references/`)

Ce sont des extraits de livres audio lus par des bénévoles de LibriVox, tirés du corpus [Multilingual LibriSpeech](https://huggingface.co/datasets/facebook/multilingual_librispeech) (licence CC-BY 4.0 ; les enregistrements LibriVox sont dans le domaine public). Ils ont été choisis parmi les 18 lecteurs du corpus français de test, selon la hauteur de la voix, son expressivité et la propreté de l'enregistrement.

| Personnage | Lecteur | Extrait d'origine |
| --- | --- | --- |
| Narrateur (voix grave, posée) | n°2216 | *Le Comte de Monte-Cristo*, Alexandre Dumas |
| Procureur (voix d'homme plus claire) | n°296 | *Le Tour du monde en 80 jours*, Jules Verne |
| Avocate (voix de femme) | n°5476 | *Vingt mille lieues sous les mers*, Jules Verne |

## Utilisation

```bash
# Une seule fois : un environnement Python séparé pour Chatterbox (PyTorch version processeur)
python -m venv cbenv
cbenv/bin/pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
cbenv/bin/pip install chatterbox-tts==0.1.7

# Pour une affaire (dossier promo/affaire-XX, avec son script.json) :
cbenv/bin/python voix-libres/generer.py affaire-03 --takes 3   # 3 prises par réplique (≈ 20 s de calcul par prise)
python voix-libres/choisir.py affaire-03                       # Whisper garde la meilleure → affaire-03/media/<personnage>.wav
cd affaire-03 && python voix.py                                # découpe et timeline.json
```

- `generer.py` génère les prises dans `prises/` (non versionné). Pour refaire seulement certaines répliques : `--only 04-dos,07-onze`.
- `choisir.py` note chaque prise : les mots du texte entendus dans l'ordre, une pénalité pour les mots en trop (une synthèse qui bafouille) et la confiance de Whisper.
- Les réglages de jeu par personnage (intensité, rythme) sont dans `ROLES`, en haut de `generer.py`.

Chatterbox ajoute un filigrane audio inaudible (Perth) qui permet de reconnaître une voix de synthèse. Pense à cocher « contenu généré par IA » à la publication.
