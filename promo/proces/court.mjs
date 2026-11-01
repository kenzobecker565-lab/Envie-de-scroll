/**
 * Version courte (≈ 1 min) du procès, montée à partir de la vidéo complète.
 *
 *   node proces/court.mjs [entrée.mp4] [sortie.mp4]
 *   (par défaut : proces/proces.mp4 → build/proces/proces-court.mp4)
 *
 * Pas de nouvelle voix ni de nouveau rendu 3D : on garde les passages les plus
 * forts (bornes calées sur les mots de timeline.json) et on les enchaîne avec
 * un flash blanc très court (image) et un fondu croisé (son). Les sous-titres,
 * étiquettes et la marque sont déjà dans la vidéo, donc restent synchronisés.
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeCues } from './cues.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const C = makeCues(JSON.parse(fs.readFileSync(path.join(here, 'timeline.json'), 'utf8')))
const { S, E, W } = C
const src = process.argv[2] ?? path.join(here, 'proces.mp4')
const dst = process.argv[3] ?? path.join(here, '..', 'build', 'proces', 'proces-court.mp4')
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const XF = 0.12 // durée des transitions

// [début, fin] en secondes de la vidéo complète, et ce qu'on y entend.
const SEGMENTS = [
  [0, E('02') + 0.12], //                      Cet homme a volé… toute sa ville le défend.
  [S('05') - 0.15, E('05') + 0.1], //          La maternité, 70 km.
  [S('06') - 0.1, E('06') + 0.12], //          Six ans de fausses factures.
  [W('07', 'peine') - 0.12, E('07') + 0.1], // Peine encourue : dix ans de prison.
  [W('09', 'quand') - 0.12, E('09') + 0.08], // Quand un élu décide seul… c'est un roi.
  [S('10') - 0.12, E('10') + 0.08], //         312 bébés… demandez à leurs mères.
  [W('11', 'sur') - 0.12, W('11', 'sauveur') - 0.2], // 300 000 € pour sa campagne.
  [W('12', 'pendant') - 0.12, W('12', 'faites') - 0.1], // 380 000 € de sa poche.
  [W('12', 'dans') - 0.12, E('12') + 0.08], // Le seul qui a perdu de l'argent, c'est lui.
  [S('15') - 0.12, E('16') + 0.15], //         Un voleur généreux… / Un État qui ferme…
  [S('18') - 0.3, E('18') + 1.4], //           Tu es le juré. Coupable ou non coupable ?
]

const parts = []
const filters = []
SEGMENTS.forEach(([a, b], i) => {
  filters.push(`[0:v]trim=${a.toFixed(3)}:${b.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`)
  filters.push(`[0:a]atrim=${a.toFixed(3)}:${b.toFixed(3)},asetpts=PTS-STARTPTS[a${i}]`)
  parts.push(b - a)
})
// Enchaînement : flash blanc (xfade) pour l'image, fondu croisé pour le son.
let v = 'v0'
let a = 'a0'
let length = parts[0]
for (let i = 1; i < parts.length; i++) {
  const offset = length - XF
  filters.push(`[${v}][v${i}]xfade=transition=fadewhite:duration=${XF}:offset=${offset.toFixed(3)}[vx${i}]`)
  filters.push(`[${a}][a${i}]acrossfade=d=${XF}:c1=tri:c2=tri[ax${i}]`)
  v = `vx${i}`
  a = `ax${i}`
  length = offset + parts[i]
}
filters.push(`[${v}]format=yuv420p[v]`)

fs.mkdirSync(path.dirname(dst), { recursive: true })
const r = spawnSync(
  FFMPEG,
  [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', src,
    '-filter_complex', filters.join(';'),
    '-map', '[v]', '-map', `[${a}]`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-tune', 'animation',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', dst,
  ],
  { stdio: 'inherit' },
)
if (r.status !== 0) throw new Error('ffmpeg a échoué')
console.log(`${dst} (${length.toFixed(1)} s)`)
