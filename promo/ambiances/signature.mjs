/** Former Scroll-up signature: « Un petit élan » (the app now plays grand-defile.mjs;
 * this one stays as the source of the promo envol music).
 * 84 BPM, D major, 32 bars (~91 s), soft electric piano / felt keys,
 * warm pad and quiet brushed pulse. Four-note ascending identity, varied
 * over Dmaj9–Bm7–Gmaj9–Aadd9. No third-party recording or melody.
 * node promo/ambiances/signature.mjs (ffmpeg required).
 * Render three cycles and export the middle one: reverb wraps naturally.
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { SR, TAU, mtof, reverb, writeWav } from '../dsp.mjs'
const beat=60/84, bar=beat*4, length=32*bar, count=Math.round(length*SR)
const channels=[new Float32Array(count*3),new Float32Array(count*3)]
function note(at,midi,level,duration=2.8,pan=0,kind='keys'){
 const f=mtof(midi),start=Math.round(at*SR),n=Math.round(duration*SR)
 for(let i=0;i<n&&start+i<channels[0].length;i++){
  const t=i/SR,phase=TAU*f*t
  const envelope=kind==='pad'?Math.min(1,t/.7)*Math.min(1,(duration-t)/.9):Math.min(1,t/.015)*Math.exp(-t/(kind==='bass'?.8:1.05))*Math.min(1,(duration-t)/.12)
  const wave=kind==='pad'?Math.sin(phase)*.72+Math.sin(phase*1.0018)*.2:Math.sin(phase)+.21*Math.sin(2*phase)*Math.exp(-t*2)+.065*Math.sin(3*phase)*Math.exp(-t*4)
  const v=wave*envelope*level
  channels[0][start+i]+=v*Math.sqrt((1-pan)/2);channels[1][start+i]+=v*Math.sqrt((1+pan)/2)
 }
}
let seed=419;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
function brush(at,level){const start=Math.round(at*SR);let filtered=0;for(let i=0;i<SR*.08;i++){filtered=.65*filtered+.35*(random()*2-1);const v=filtered*Math.exp(-i/SR*70)*level;channels[0][start+i]+=v;channels[1][start+i]+=v*.85}}
const chords=[[50,57,61,64,66],[47,54,57,61,62],[43,50,54,57,59],[45,52,57,59,61]]
const motif=[[0,74],[.75,78],[1.5,81],[2.5,78],[4.5,76],[5.5,74],[6.5,73]]
for(let cycle=0;cycle<3;cycle++)for(let b=0;b<32;b++){
 const at=cycle*length+b*bar,c=chords[Math.floor(b/2)%4]
 c.slice(1).forEach((m,i)=>note(at,m,.023,bar+.95,(i-1.5)*.22,'pad'))
 note(at,c[0]-12,.071,1.8,-.05,'bass');if(b%4!==3)note(at+beat*2.5,c[0]-12,.036,1.5,.05,'bass')
 const arpeggio=[c[1],c[3],c[2],c[4]]
 arpeggio.forEach((m,i)=>note(at+beat*(.25+i*.85),m,.043+(i===0?.006:0),2.4,i%2?.26:-.26))
 if(b%2===0){const section=Math.floor(b/8);for(const [position,m] of motif){const variation=section===1?(m===81?83:m):section===2?m-12:m;note(at+position*beat,variation,.07,2.5,.12,'keys')}}
 if(b>=8&&b<24){brush(at+beat,.024);brush(at+beat*3,.019)}
}
const wet=reverb(channels,{room:.72,damp:.5})
const middle=channels.map((channel,c)=>{const out=new Float32Array(count);for(let i=0;i<count;i++)out[i]=channel[count+i]+wet[c][count+i]*.2;return out})
const temp=mkdtempSync(join(tmpdir(),'scrollup-signature-'))
try{
 const wav=join(temp,'signature.wav');writeWav(wav,middle[0],middle[1],random)
 const target=process.argv[2]??'un-petit-elan.mp3'
 const r=spawnSync('ffmpeg',['-y','-loglevel','error','-i',wav,'-af','loudnorm=I=-19:TP=-2:LRA=7','-ar','44100','-codec:a','libmp3lame','-b:a','96k','-metadata','title=Un petit élan — Scroll-up',target],{stdio:'inherit'})
 if(r.status!==0)throw Error('ffmpeg failed')
 console.log(target)
}finally{rmSync(temp,{recursive:true,force:true})}
