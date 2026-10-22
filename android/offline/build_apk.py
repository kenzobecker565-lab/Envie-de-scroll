#!/usr/bin/env python3
"""
APK hors ligne de Scroll-up (présentation), sans Gradle :
  1. build web de offline/ (l'app + son serveur local) ;
  2. ressources Android (aapt2), code Java (javac + d8) ;
  3. assemblage avec les fichiers de l'app dans assets/www, alignement, signature.

Outils (chemins dans l'environnement) :
  ANDROID_JAR    android.jar (plateforme 34 ou plus)
  AAPT2          binaire aapt2
  D8_JAR         d8 / r8 (com.android.tools.r8.D8)
  APKSIGNER_JAR  apksigner.jar
  ECJ_JAR        (facultatif) compilateur Java d'Eclipse, à défaut javac
  SCROLLUP_KEYSTORE, SCROLLUP_KEYSTORE_PASSWORD, SCROLLUP_KEY_ALIAS (défaut : scrollup-offline)

Usage, depuis la racine du dépôt :  python3 android/offline/build_apk.py [--skip-web]
Résultat : android/offline/build/scroll-up-hors-ligne.apk
"""
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
BUILD = HERE / 'build'
OUT = BUILD / 'scroll-up-hors-ligne.apk'
VERSION_CODE = os.environ.get('SCROLLUP_VERSION_CODE', '1')
VERSION_NAME = os.environ.get('SCROLLUP_VERSION_NAME', '1.0-presentation')
# Fichiers de l'app web inutiles dans l'APK (page de téléchargement de l'APK…).
EXCLUDED = ('downloads/', 'presentation.html')
COMPRESSED = ('.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.xml', '.dex')


def env(name, default=None):
    value = os.environ.get(name, default)
    if not value:
        sys.exit(f'Variable manquante : {name}')
    return value


def run(*args, cwd=None):
    print('$', ' '.join(str(arg) for arg in args), flush=True)
    subprocess.run([str(arg) for arg in args], check=True, cwd=cwd)


def aligned_write(zf, name, data, compress):
    info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
    info.external_attr = 0o644 << 16
    if compress:
        info.compress_type = zipfile.ZIP_DEFLATED
        zf.writestr(info, data, compresslevel=9)
        return
    info.compress_type = zipfile.ZIP_STORED
    # Données non compressées alignées sur 4 octets (exigé pour resources.arsc).
    offset = zf.fp.tell() + 30 + len(name.encode('utf-8'))
    info.extra = b'\x00' * ((4 - offset % 4) % 4)
    zf.writestr(info, data)


def main():
    android_jar = env('ANDROID_JAR')
    aapt2 = env('AAPT2')
    d8 = env('D8_JAR')
    apksigner = env('APKSIGNER_JAR')
    keystore = env('SCROLLUP_KEYSTORE')
    password = env('SCROLLUP_KEYSTORE_PASSWORD')
    alias = os.environ.get('SCROLLUP_KEY_ALIAS', 'scrollup-offline')

    web = REPO / 'offline' / 'dist'
    if '--skip-web' not in sys.argv:
        run('npx', 'vite', 'build', '--config', 'offline/vite.config.ts', cwd=REPO)
    if not (web / 'index.html').exists():
        sys.exit('Build web absent : offline/dist/index.html')

    shutil.rmtree(BUILD, ignore_errors=True)
    (BUILD / 'classes').mkdir(parents=True)
    (BUILD / 'dex').mkdir()

    # Ressources et manifeste.
    run(aapt2, 'compile', '--dir', HERE / 'src/main/res', '-o', BUILD / 'res.zip')
    run(aapt2, 'link', '-I', android_jar, '--manifest', HERE / 'src/main/AndroidManifest.xml',
        '--min-sdk-version', '26', '--target-sdk-version', '34',
        '--version-code', VERSION_CODE, '--version-name', VERSION_NAME,
        '-o', BUILD / 'base.apk', BUILD / 'res.zip')

    # Code Java → dex.
    sources = sorted(str(path) for path in (HERE / 'src/main/java').rglob('*.java'))
    ecj = os.environ.get('ECJ_JAR')
    if ecj:
        # Compilateur Eclipse : bytecode Java 8 que d8 accepte sans détour.
        run('java', '-jar', ecj, '-8', '-nowarn', '-encoding', 'UTF-8', '-bootclasspath', android_jar, '-d', BUILD / 'classes', *sources)
    else:
        run('javac', '-encoding', 'UTF-8', '-source', '8', '-target', '8', '-Xlint:-options',
            '-bootclasspath', android_jar, '-d', BUILD / 'classes', *sources)
    classes = sorted(str(path) for path in (BUILD / 'classes').rglob('*.class'))
    run('java', '-cp', d8, 'com.android.tools.r8.D8', '--release', '--min-api', '26',
        '--lib', android_jar, '--output', BUILD / 'dex', *classes)

    # Assemblage.
    unsigned = BUILD / 'unsigned.apk'
    with zipfile.ZipFile(BUILD / 'base.apk') as base, zipfile.ZipFile(unsigned, 'w') as apk:
        for item in base.infolist():
            data = base.read(item.filename)
            aligned_write(apk, item.filename, data, compress=item.filename.endswith('.xml') and item.filename != 'resources.arsc')
        aligned_write(apk, 'classes.dex', (BUILD / 'dex' / 'classes.dex').read_bytes(), compress=True)
        count = 0
        for path in sorted(web.rglob('*')):
            if not path.is_file():
                continue
            relative = path.relative_to(web).as_posix()
            if relative.startswith(EXCLUDED):
                continue
            aligned_write(apk, f'assets/www/{relative}', path.read_bytes(), compress=relative.endswith(COMPRESSED))
            count += 1
    print(f'{count} fichiers de l’app dans assets/www')

    run('java', '-jar', apksigner, 'sign', '--ks', keystore, '--ks-key-alias', alias,
        '--ks-pass', 'env:SCROLLUP_KEYSTORE_PASSWORD', '--key-pass', 'env:SCROLLUP_KEYSTORE_PASSWORD',
        '--min-sdk-version', '26', '--out', OUT, unsigned)
    run('java', '-jar', apksigner, 'verify', '--min-sdk-version', '26', '--print-certs', OUT)
    print(f'APK : {OUT} ({OUT.stat().st_size / 1e6:.1f} Mo)')
    _ = password


if __name__ == '__main__':
    main()
