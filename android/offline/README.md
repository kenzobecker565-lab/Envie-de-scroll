# APK hors ligne de Scroll-up (présentation)

Application Android autonome : toute l'app develop est rangée dans l'APK et
fonctionne **sans Internet, sans Telegram et sans serveur**. Rien ne dépend de
Railway : on peut la montrer et la partager pendant une présentation.

## Comment ça marche

- `offline/` construit l'app habituelle (`app/src`) sans le SDK Telegram, avec
  un **serveur local** (`offline/src/localApi.ts`) qui remplace `/api`.
- Ce serveur local exécute **les vrais services du serveur**
  (`server/src/services/*`) sur une base en mémoire compatible Prisma
  (`offline/src/memoryPrisma.ts`), sauvegardée sur le téléphone (IndexedDB) :
  passions, minutons, galerie, photos des dessins, boutique, projets, carnets.
- L'activité Android (`src/main/java/.../MainActivity.java`) sert ces fichiers
  depuis `assets/www` à une WebView, sous l'adresse réservée
  `https://appassets.androidplatform.net/` (aucune requête réseau).
- Le bouton « Retour » d'Android ferme la fenêtre ouverte puis revient à l'écran
  précédent (`scrollup-android-back`, voir `app/src/telegram/buttons.ts`).

Les données restent propres à chaque téléphone ; désinstaller l'app les efface.
Les fonctions qui demandent Telegram (relances du bot, invitations) n'ont pas
d'effet dans cette version.

## Construire

Outils : Node 22, Java 17+, et un SDK Android minimal (android.jar 34+, aapt2,
d8, apksigner ; ecj conseillé). Puis, depuis la racine :

```sh
npm ci
ANDROID_JAR=… AAPT2=… D8_JAR=… APKSIGNER_JAR=… ECJ_JAR=… \
SCROLLUP_KEYSTORE=… SCROLLUP_KEYSTORE_PASSWORD=… \
python3 android/offline/build_apk.py
```

Résultat : `android/offline/build/scroll-up-hors-ligne.apk`. Pour une mise à
jour, garder la **même clé** (alias `scrollup-offline`) et augmenter
`SCROLLUP_VERSION_CODE`. La clé privée ne va jamais dans le dépôt.

Paquet `fr.scrollup.demo`, Android 8 minimum, cible Android 14, aucune permission.
