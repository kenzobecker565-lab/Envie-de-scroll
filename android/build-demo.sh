#!/usr/bin/env bash
set -euo pipefail
# Reproducible SDK-only build, no third-party Android dependencies.
# Prerequisites: JDK 17, Android SDK platform 35 and build-tools 35.0.0.
ROOT="$(cd "$(dirname "$0")" && pwd)"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
: "${SDK:?Set ANDROID_HOME to the Android SDK directory}"
TOOLS="$SDK/build-tools/35.0.0"
PLATFORM="$SDK/platforms/android-35/android.jar"
BUILD="$ROOT/app/build/demo"
mkdir -p "$BUILD/classes" "$BUILD/dex"
"$TOOLS/aapt2" compile --dir "$ROOT/app/src/main/res" -o "$BUILD/resources.zip"
sed 's/<manifest /<manifest package="fr.scrollup.presentation.dev" /' "$ROOT/app/src/main/AndroidManifest.xml" > "$BUILD/AndroidManifest.xml"
"$TOOLS/aapt2" link -I "$PLATFORM" --manifest "$BUILD/AndroidManifest.xml" --version-code 1 --version-name 0.1-presentation -o "$BUILD/unsigned.apk" "$BUILD/resources.zip"
find "$ROOT/app/src/main/java" -name '*.java' > "$BUILD/sources.txt"
javac -encoding UTF-8 -source 8 -target 8 -bootclasspath "$PLATFORM:$TOOLS/core-lambda-stubs.jar" -d "$BUILD/classes" @"$BUILD/sources.txt"
jar cf "$BUILD/classes.jar" -C "$BUILD/classes" .
"$TOOLS/d8" --lib "$PLATFORM" --min-api 26 --output "$BUILD/dex" "$BUILD/classes.jar"
(cd "$BUILD/dex" && zip -q -u "$BUILD/unsigned.apk" classes.dex)
"$TOOLS/zipalign" -f 4 "$BUILD/unsigned.apk" "$BUILD/aligned.apk"
: "${SCROLLUP_KEYSTORE:?Set SCROLLUP_KEYSTORE to the private demo keystore path}"
: "${SCROLLUP_KEYSTORE_PASSWORD:?Set SCROLLUP_KEYSTORE_PASSWORD}"
"$TOOLS/apksigner" sign --ks "$SCROLLUP_KEYSTORE" --ks-key-alias scrollup-demo --ks-pass env:SCROLLUP_KEYSTORE_PASSWORD --key-pass env:SCROLLUP_KEYSTORE_PASSWORD --out "$BUILD/scroll-up-develop.apk" "$BUILD/aligned.apk"
"$TOOLS/apksigner" verify --verbose "$BUILD/scroll-up-develop.apk"
echo "$BUILD/scroll-up-develop.apk"
