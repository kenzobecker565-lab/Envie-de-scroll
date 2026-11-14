/**
 * Prépare les médias de la pub à partir des fichiers sources :
 *   - build/pub/broll/<clip>.mp4 → build/pub/frames/<clip>/0001.jpg… (cadrés 1080 × 1920)
 *   - pub/media/voix-off.mp3      → build/pub/voix.wav (48 kHz)
 *   - pub/media/musique.mp3       → build/pub/musique.wav (48 kHz)
 *
 * Les clips viennent de Pexels (à télécharger : voir credits.json et le
 * README) ; la voix et la musique ont été générées avec vidIQ.
 * ffmpeg doit être dans le PATH (ou désigné par FFMPEG=…).
 *
 *   node pub/prepare.mjs
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CLIPS } from './clips.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const build = path.join(here, '..', 'build', 'pub')
const FFMPEG = process.env.FFMPEG || 'ffmpeg'

function ffmpeg(args) {
  const r = spawnSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' })
  if (r.status !== 0) throw new Error(`ffmpeg a échoué : ${args.join(' ')}`)
}

const missing = Object.keys(CLIPS).filter((name) => !fs.existsSync(path.join(build, 'broll', `${name}.mp4`)))
if (missing.length) {
  throw new Error(`Clips manquants dans build/pub/broll/ : ${missing.map((n) => `${n}.mp4`).join(', ')} (liens dans pub/credits.json)`)
}

for (const [name, clip] of Object.entries(CLIPS)) {
  const dir = path.join(build, 'frames', name)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  ffmpeg([
    '-ss', String(clip.in), '-t', String(clip.length), '-i', path.join(build, 'broll', `${name}.mp4`),
    '-vf', `fps=${clip.fps},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920`,
    '-q:v', '3', path.join(dir, '%04d.jpg'),
  ])
  console.log(`${name} : ${fs.readdirSync(dir).length} images`)
}

ffmpeg(['-i', path.join(here, 'media', 'voix-off.mp3'), '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', path.join(build, 'voix.wav')])
ffmpeg(['-i', path.join(here, 'media', 'musique.mp3'), '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', path.join(build, 'musique.wav')])
console.log('voix.wav et musique.wav prêts')
