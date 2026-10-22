# APK de présentation Scroll-up (develop)

Cette application Android dédiée ouvre exclusivement le service develop en HTTPS :
https://envie-de-scroll-scroll-up-devellopment.up.railway.app/

Ce n’est pas une copie hors ligne. Elle nécessite Internet et suit les mises à jour de develop.
Le package `fr.scrollup.presentation.dev` permet de la distinguer d’une future app de production.
Android 8 minimum, cible Android 15, aucune permission caméra, micro ou stockage étendu.
Les photos passent par le sélecteur de fichiers Android.

## Profils invités

Le serveur délivre une identité négative aléatoire signée, dans un cookie HttpOnly,
Secure en HTTPS, SameSite=Strict, conservé 30 jours. Les identités Telegram restent
positives. Aucune clé de bot ni identité de développeur n’est intégrée à l’APK.
Chaque installation/navigateur a son profil. Pas de synchronisation Telegram.
La désinstallation ou l’effacement du stockage fait perdre l’accès au profil invité.

`GUEST_AUTH=true` active l’accès invité. `false` le désactive explicitement.
Par défaut il est actif seulement pour `RAILWAY_GIT_BRANCH=develop` ou le domaine
Railway exact de develop ci-dessus. La production conserve son authentification Telegram.
En auto-hébergement, conserver un `SIGNING_SECRET` stable et définir `WEBAPP_URL`.

## Compiler

Installer JDK 17, SDK platform 35 et build-tools 35.0.0, puis définir :
- `ANDROID_HOME` : dossier SDK Android
- `SCROLLUP_KEYSTORE` : chemin privé du keystore
- `SCROLLUP_KEYSTORE_PASSWORD` : mot de passe privé du keystore

Le keystore doit avoir un alias `scrollup-demo`. Conserver la clé privée et le mot
 de passe hors du dépôt. Toute mise à jour de l’APK doit utiliser cette même clé.

Exécuter `./android/build-demo.sh` depuis la racine. Le script utilise uniquement
les outils officiels Android et le JDK, sans bibliothèque Android supplémentaire.
Il vérifie la signature et écrit `android/app/build/demo/scroll-up-develop.apk`.
Copier l’APK validée vers `app/public/downloads/scroll-up-develop.apk` puis déployer.
L’URL publique de téléchargement est `/presentation.html`.

Un projet Gradle est également fourni pour Android Studio. Ses builds debug
standards utilisent une autre clé, donc ne remplacent pas l’APK distribuée.

## Vérifications avant présentation

Installer sur un téléphone Android réel, terminer le tutoriel, créer un dessin,
importer une photo, ouvrir la galerie et relancer l’application. Vérifier qu’un
second téléphone a un autre profil. Scanner le QR sur Android et iPhone.
La vérification de compilation et de signature ne remplace pas cet essai matériel.
