/** Aperçus synthétisés de nos adaptations du domaine public : node promo/ambiances/classics.mjs. */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { PIANO_CLASSICS, CLASSIC_MELODIES } from '../../shared/src/pianoClassics.ts'
import { noteFrequency } from '../../shared/src/keyboard.ts'
const out = resolve(fileURLToPath(new URL('../../app/public/music/', import.meta.url)))
const temp = mkdtempSync(join(tmpdir(), 'scroll-up-classics-'))
const rate = 22050
try {
  for (const piece of PIANO_CLASSICS) {
    const tune = CLASSIC_MELODIES[piece.id]
    const notes = tune.notes.slice(0, Math.min(tune.notes.length, 48))
    const durations = notes.map((_,i) => piece.spacing * (piece.rhythm?.[i % piece.rhythm.length] ?? 1))
    const samples = new Float64Array(Math.ceil((durations.reduce((a,b)=>a+b,0)+1.2)*rate))
    let offset = 0
    for (let k = 0; k < notes.length; k++) {
      const freq = noteFrequency(notes[k]), start = Math.floor(offset*rate)
      const decay = Math.max(.22, Math.min(.8,durations[k]*1.1))
      for (let i=0;i<rate*1.5 && start+i<samples.length;i++) {
        const t=i/rate, env=Math.min(t*120,1)*Math.exp(-t/decay)
        samples[start+i] += (Math.sin(2*Math.PI*freq*t)+.25*Math.sin(4*Math.PI*freq*t)+.1*Math.sin(6*Math.PI*freq*t))*env*.25
      }
      offset += durations[k]
    }
    const wav=Buffer.alloc(44+samples.length*2)
    wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40)
    for(let i=0;i<samples.length;i++)wav.writeInt16LE(Math.trunc(Math.max(-1,Math.min(1,samples[i]))*32767),44+i*2)
    const source=join(temp,piece.id+'.wav');writeFileSync(source,wav)
    const result=spawnSync('ffmpeg',['-y','-loglevel','error','-i',source,'-codec:a','libmp3lame','-b:a','48k',join(out,'shop-'+piece.id.replace('piano-','')+'.mp3')],{stdio:'inherit'})
    if(result.error || result.status!==0)throw result.error ?? Error('ffmpeg a échoué')
  }
} finally {rmSync(temp,{recursive:true,force:true})}
