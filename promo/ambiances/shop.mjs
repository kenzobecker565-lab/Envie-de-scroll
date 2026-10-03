/** Compositions originales Scroll-up : ambiances et aperçus de piano.
 * node promo/ambiances/shop.mjs (ffmpeg doit être installé).
 * Aucun enregistrement ou arrangement d’un morceau tiers n’est utilisé.
 */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const out = resolve(fileURLToPath(new URL('../../app/public/music/', import.meta.url)))
const temp = mkdtempSync(join(tmpdir(), 'scroll-up-shop-'))
const rate = 22050
const tracks = [
  { name: 'aube', notes: [60,64,67,72,69,67,64,62,57,60,64,69,67,64,62,60], length: 48, count: 48, spacing: 1, decay: .6, noteLength: 1.8, level: .16 },
  { name: 'orbite', notes: [45,52,57,64,48,55,60,67,41,48,53,60,43,50,55,62], length: 48, count: 48, spacing: 1, decay: 1.3, noteLength: 3, level: .16 },
  { name: 'lanterne', notes: [60,64,67,64,62,65,69,65,64,67,72,71,69,67,64,60], length: 14, count: 16, spacing: .65, decay: 1/3, noteLength: 2, level: .25 },
  { name: 'constellation', notes: [57,64,69,71,72,71,69,64,65,69,72,69,67,71,74,71], length: 14, count: 16, spacing: .65, decay: 1/3, noteLength: 2, level: .25 },
]
try {
  for (const track of tracks) {
    const samples = new Float64Array(rate * track.length)
    const piano = track.length === 14
    for (let k = 0; k < track.count; k++) {
      const freq = 440 * 2 ** ((track.notes[k % track.notes.length] - 69) / 12)
      const start = Math.floor(k * track.spacing * rate)
      for (let i = 0; i < Math.floor(rate * track.noteLength) && start+i < samples.length; i++) {
        const t = i / rate
        const envelope = (piano ? Math.min(t*100, 1) : 1-Math.exp(-t*16)) * Math.exp(-t/track.decay)
        samples[start+i] += (Math.sin(2*Math.PI*freq*t) + (piano ? .3 : .22)*Math.sin(4*Math.PI*freq*t) + (piano ? .12 : .1)*Math.sin(6*Math.PI*freq*t)) * envelope * track.level
      }
    }
    const wav = Buffer.alloc(44 + samples.length * 2)
    wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40)
    for(let i=0;i<samples.length;i++) {
      const fade = piano ? 1 : Math.max(0,Math.min(1,i/rate/2,(samples.length-i)/rate/3))
      wav.writeInt16LE(Math.trunc(Math.max(-1,Math.min(1,samples[i]*fade))*32767),44+i*2)
    }
    const source = join(temp,track.name+'.wav');writeFileSync(source,wav)
    const result = spawnSync('ffmpeg',['-y','-loglevel','error','-i',source,'-codec:a','libmp3lame','-b:a','32k',join(out,'shop-'+track.name+'.mp3')],{stdio:'inherit'})
    if(result.error || result.status !== 0)throw result.error ?? Error('ffmpeg a échoué')
  }
} finally { rmSync(temp,{recursive:true,force:true}) }
