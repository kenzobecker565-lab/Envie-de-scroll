"""
Voix gratuites et naturelles pour les affaires : Chatterbox (Resemble AI, licence
MIT), modèle multilingue, en imitant le timbre de trois lecteurs de livres audio.

À lancer avec l'environnement Python où Chatterbox est installé :

    python -m venv cbenv
    cbenv/bin/pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
    cbenv/bin/pip install chatterbox-tts==0.1.7
    cbenv/bin/python voix-libres/generer.py affaire-03 --takes 3

Pour chaque réplique de <affaire>/script.json, le script génère N prises dans
voix-libres/prises/<affaire>/<id>-<n>.wav, avec la voix de référence du
personnage (references/<personnage>.wav). choisir.py garde ensuite la meilleure.
"""

import argparse
import json
import pathlib
import time
import zlib

import torch
import torchaudio

HERE = pathlib.Path(__file__).parent

# Réglages par personnage : « exaggeration » = intensité du jeu, « cfg » = fidélité
# au rythme de la référence (plus bas : débit plus libre).
ROLES = {
    "narrateur": {"exaggeration": 0.6, "cfg": 0.5},
    "procureur": {"exaggeration": 0.7, "cfg": 0.45},
    "avocate": {"exaggeration": 0.7, "cfg": 0.45},
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("affaire", help="dossier de l'affaire (ex. affaire-03)")
    parser.add_argument("--takes", type=int, default=3)
    parser.add_argument("--only", default=None, help="ids de répliques à refaire, séparés par des virgules")
    parser.add_argument("--first", type=int, default=0, help="numéro de la première prise (pour en ajouter de nouvelles sans refaire les anciennes)")
    args = parser.parse_args()

    # Les poids du modèle ont été enregistrés sur GPU : on force le chargement sur le processeur.
    load = torch.load
    torch.load = lambda *a, **k: load(*a, **{**k, "map_location": "cpu"})
    torch.set_num_threads(4)
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS

    model = ChatterboxMultilingualTTS.from_pretrained(device=torch.device("cpu"))
    script = json.loads((HERE.parent / args.affaire / "script.json").read_text(encoding="utf-8"))
    out = HERE / "prises" / args.affaire
    out.mkdir(parents=True, exist_ok=True)
    only = set(args.only.split(",")) if args.only else None
    for line in script["lines"]:
        if only and line["id"] not in only:
            continue
        role = ROLES[line["who"]]
        for take in range(args.first, args.first + args.takes):
            started = time.time()
            torch.manual_seed(1000 * take + zlib.crc32(line["id"].encode()) % 1000)
            wav = model.generate(
                line.get("say", line["text"]),
                language_id="fr",
                audio_prompt_path=str(HERE / "references" / f"{line['who']}.wav"),
                exaggeration=role["exaggeration"],
                cfg_weight=role["cfg"],
            )
            torchaudio.save(str(out / f"{line['id']}-{take}.wav"), wav, model.sr, encoding="PCM_S", bits_per_sample=16)
            print(f"{line['id']:16} prise {take + 1}/{args.first + args.takes}  {wav.shape[-1] / model.sr:4.1f} s  ({time.time() - started:.0f} s de calcul)", flush=True)


if __name__ == "__main__":
    main()
