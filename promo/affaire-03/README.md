# Affaire Classée ? · affaire n°3 : le boulanger (≈ 45 s)

▶️ **[Voir la vidéo](affaire-03.mp4)** (MP4, 1080 × 1920, 30 images/s, avec la marque @affaireclassee0)

**L'affaire est inventée.** À 3 h du matin, un cambrioleur force la porte d'une boulangerie. Le boulanger, qui vit à l'étage, descend avec son rouleau à pâtisserie et le frappe quatre fois : deux côtes cassées. Le cambrioleur, déjà condamné onze fois, porte plainte. C'est le boulanger qui risque cinq ans de prison.

Le débat repose sur des règles réelles :
- **la présomption de légitime défense** : la loi présume qu'on se défend légitimement quand on repousse, de nuit, une entrée par effraction dans un lieu habité (article 122-6 du Code pénal). Mais cette présomption peut tomber, par exemple si l'intrus s'enfuyait ;
- **la peine encourue** : des violences avec arme (ici, le rouleau) ayant entraîné plus de huit jours d'incapacité de travail sont punies de cinq ans de prison (article 222-12).

On ne montre aucun coup.

## Le déroulé

| Moment | Ce qu'on entend | Ce qu'on voit |
| --- | --- | --- |
| L'accroche | « Trois heures du matin. Un cambrioleur entre dans sa boulangerie. » | La boulangerie la nuit, le store rayé, le lampadaire ; le cambrioleur et sa lampe torche se glissent vers la porte ; la fenêtre de l'étage s'allume. « 3 H 00 ». |
| Les faits | « Le boulanger descend… avec son rouleau à pâtisserie. Deux côtes cassées. Le voleur porte plainte. Et c'est le boulanger qui risque cinq ans de prison. » | Le boulanger (toque, rouleau levé) descend l'escalier de la boutique ; secousse, « 2 CÔTES CASSÉES ». Le dépôt de plainte tamponné « REÇUE ». Le boulanger dans le box : « 5 ANS DE PRISON ». |
| Le procès | Procureur et avocate se répondent. | « DE DOS », « IL S'ENFUYAIT », l'horloge à 3 h, « LÉGITIME DÉFENSE », « 4 COUPS », les onze dossiers « 11 CONDAMNATIONS », « LE BOULANGER : 0 », puis les deux phrases-chocs. La jauge bascule après chaque argument. |
| Le vote | « Tu es le juré. Coupable… ou non coupable ? Et toi, à trois heures du matin, tu aurais fait quoi ? » | Le boulanger dans le noir, « COUPABLE » / « NON COUPABLE », la signature @affaireclassee0. |

## Les voix

Les trois voix sont gratuites, générées sur la machine avec Chatterbox à partir de voix de livres audio libres de droits : voir [`../voix-libres`](../voix-libres/README.md).

## Refaire la vidéo

```bash
cd promo
cbenv/bin/python voix-libres/generer.py affaire-03 && python voix-libres/choisir.py affaire-03
npm run a3:voice           # découpe → timeline.json
npm run a3:render          # → build/affaire-03/affaire-03.mp4
npm run a3:marque-video    # → build/affaire-03/affaire-03-marque.mp4
```
