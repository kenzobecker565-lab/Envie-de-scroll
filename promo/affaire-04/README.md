# Affaire Classée ? · affaire n°4 : mamie cannabis (≈ 45 s)

▶️ **[Voir la vidéo](affaire-04.mp4)** (MP4, 1080 × 1920, 30 images/s, avec la marque @affaireclassee0)

**L'affaire est inventée.** Une femme de 78 ans cultive douze plants de cannabis dans son jardin pour calmer les douleurs de son mari, atteint de la maladie de Parkinson. Elle en a aussi vendu à trois voisins malades, à prix coûtant.

Le cadre juridique est réel : en France, la production de stupéfiants, culture comprise, est punie jusqu'à vingt ans de réclusion criminelle (article 222-35 du Code pénal). La vidéo dit bien « jusqu'à » : c'est le maximum prévu par la loi, pas la peine attendue. Il n'y a aucune indication de culture ni de préparation.

## Le déroulé

| Moment | Ce qu'on entend | Ce qu'on voit |
| --- | --- | --- |
| L'accroche | « Elle a 78 ans. Les gendarmes ont trouvé 12 plants de cannabis dans son jardin. Elle risque jusqu'à 20 ans de prison. » | Le jardin au soleil, la mamie et son arrosoir, les douze plants qui apparaissent un à un (« 12 PLANTS DE CANNABIS »). Puis la mamie dans le box : tampon « 20 ANS DE PRISON ». |
| Les faits | « Son mari a la maladie de Parkinson. Elle dit que c'était pour calmer ses douleurs. » | Le salon : le mari dans son fauteuil, sa main qui tremble, une tisane qui fume. « MALADIE DE PARKINSON ». |
| Le procès | Procureur et avocate se répondent. | « LA LOI EST LA MÊME POUR TOUS » (un plant en preuve), la tisane et « IL A RETROUVÉ LE SOMMEIL », le tampon « VENDUES » et « 3 VOISINS · 2 000 € » (une liasse de billets), « À PRIX COÛTANT », « 0 € DE BÉNÉFICE », « UNE LISTE D'ATTENTE », puis les deux phrases-chocs. La jauge bascule après chaque argument. |
| Le vote | « Tu es le juré. Coupable… ou non coupable ? Et toi, tu l'aurais dénoncée ? » | La mamie dans le noir, « COUPABLE » / « NON COUPABLE », la signature @affaireclassee0. |

## Les voix

Les trois voix sont gratuites, générées sur la machine avec Chatterbox à partir de voix de livres audio libres de droits : voir [`../voix-libres`](../voix-libres/README.md).

## Refaire la vidéo

```bash
cd promo
cbenv/bin/python voix-libres/generer.py affaire-04 && python voix-libres/choisir.py affaire-04
npm run a4:voice           # découpe → timeline.json
npm run a4:render          # → build/affaire-04/affaire-04.mp4
npm run a4:marque-video    # → build/affaire-04/affaire-04-marque.mp4
```
