/** Original Scroll-up bossa signature, « Une pause au soleil ».
 * 96 BPM, 32 bars, Cmaj9–Am9–Dm9–G13, nylon-string plucks,
 * soft bass, restrained shaker and rim. No third-party melody or recording.
 * Render three identical cycles and retain the middle for wrapped tails.
 * node promo/ambiances/signature-bossa.mjs (ffmpeg required).
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { SR, TAU, mtof, reverb, writeWav } from '../dsp.mjs'
const beat=60/96, bar=beat*4, length=32*bar, count=Math.round(length*SR)
const channels=[new Float32Array(count*3),new Float32Array(count*3)]
let seed=221;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
function add(at,midi,level,duration=1.4,pan=0,bass=false){
 const start=Math.round(at*SR),f=mtof(midi),n=Math.round(duration*SR)
 if(bass){for(let i=0;i<n;i++){if(start+i>=channels[0].length)break;const t=i/SR;const v=(Math.sin(TAU*f*t)+.14*Math.sin(TAU*f*t*2))*Math.min(1,t/.012)*Math.exp(-t/ .42)*Math.min(1,(duration-t)/.08)*level;channels[0][start+i]+=v*.7;channels[1][start+i]+=v*.7}return}
 // Karplus–Strong string with a softened pluck and gentle decay.
 const period=Math.round(SR/f),line=new Float32Array(period);let filtered=0
 for(let i=0;i<period;i++){filtered=.4*filtered+.6*(random()*2-1);line[i]=filtered}
 const l=Math.sqrt((1-pan)/2),r=Math.sqrt((1+pan)/2)
 for(let i=0;i<n&&start+i<channels[0].length;i++){
  const index=i%period,y=line[index];line[index]=.4988*(y+line[(index+1)%period])
  const v=y*level*Math.min(1,i/(SR*.004))*Math.min(1,(n-i)/(SR*.05))
  channels[0][start+i]+=v*l;channels[1][start+i]+=v*r
 }
}
function percussion(at,level,rim=false){
 const start=Math.round(at*SR),duration=rim?.035:.065;let previous=0
 for(let i=0;i<duration*SR&&start+i<channels[0].length;i++){const t=i/SR,x=random()*2-1;const v=(rim?Math.sin(TAU*920*t)*.5+(x-previous)*.08:(x-previous)*.35)*Math.exp(-t*(rim?150:75))*level;previous=x;channels[0][start+i]+=v*.7;channels[1][start+i]+=v*.6}
}
const chords=[[48,55,59,62,64],[45,55,59,60,64],[50,57,60,64,65],[43,53,57,59,64]]
const motif=[[.5,76],[1.25,74],[2.5,71],[3.5,72],[4.75,74],[6,71],[7,67]]
for(let cycle=0;cycle<3;cycle++){
 seed=221
 for(let b=0;b<32;b++){
  const at=cycle*length+b*bar,c=chords[Math.floor(b/2)%4]
  add(at,c[0]-12,.15,1.1,0,true);add(at+beat*2,c[0]-5,.105,1,0,true)
  for(const [position,level] of [[0,.15],[1.5,.11],[2.5,.13],[3.5,.09]])c.slice(1).forEach((m,i)=>add(at+beat*position+i*.008,m,level,.95,(i-1.5)*.12))
  if(b%8===0||b%8===4)for(const [position,m] of motif)add(at+position*beat,m+(b>=16&&b<24?-12:0),.21,1.8,.18)
  for(let step=0;step<8;step++)percussion(at+step*beat/2,.018*(step%2?.8:1))
  percussion(at+beat,.021,true);percussion(at+beat*3,.016,true)
 }
}
const wet=reverb(channels,{room:.58,damp:.68})
const middle=channels.map((ch,c)=>{const out=new Float32Array(count);for(let i=0;i<count;i++)out[i]=ch[count+i]+wet[c][count+i]*.12;return out})
const temp=mkdtempSync(join(tmpdir(),'scrollup-bossa-'))
try{
 const wav=join(temp,'bossa.wav');writeWav(wav,middle[0],middle[1],random)
 const target=new URL('../../app/public/music/scroll-up-signature-bossa-v1.mp3',import.meta.url).pathname
 const result=spawnSync('ffmpeg',['-y','-loglevel','error','-i',wav,'-af','loudnorm=I=-19:TP=-2:LRA=7','-ar','44100','-codec:a','libmp3lame','-b:a','96k','-metadata','title=Une pause au soleil — Scroll-up',target],{stdio:'inherit'})
 if(result.status!==0)throw Error('ffmpeg failed')
 console.log(target)
}finally{rmSync(temp,{recursive:true,force:true})}
