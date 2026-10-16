import type { Beat } from '@scroll-up/shared'
import { suppressAmbient } from './ambient.ts'
/** Audio clock schedules sound; timers only refill the queue and paint the playhead. */
export async function playBeat(beat: Beat, onStep: (step:number,section:number)=>void):Promise<()=>void> {
 const Context=window.AudioContext ?? (window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext
 if(!Context)throw new Error('Le son n’est pas disponible dans ce navigateur.')
 const context=new Context(),master=context.createGain();master.gain.value=.32;master.connect(context.destination)
 try{await context.resume()}catch{await context.close();throw new Error('Appuie à nouveau sur Lecture pour activer le son.')}
 const timbre=beat.palette==='hip-hop'?{decay:1,kick:140,hat:6500,wave:'sine' as OscillatorType}:beat.palette==='électro'?{decay:.7,kick:180,hat:8500,wave:'sine' as OscillatorType}:beat.palette==='acoustique'?{decay:1.4,kick:110,hat:5000,wave:'triangle' as OscillatorType}:{decay:1.2,kick:95,hat:3200,wave:'triangle' as OscillatorType}
 const restore=suppressAmbient('rhythm-studio');let stopped=false,nextTime=context.currentTime+.06,index=0
 const active=new Set<AudioScheduledSourceNode>(),visuals=new Set<number>()
 function hit(track:number,time:number){
  const gain=context.createGain();gain.connect(master);const length=(track===0?.22:track===1?.13:track===2?.045:.1)*timbre.decay
  gain.gain.setValueAtTime(.001,time);gain.gain.linearRampToValueAtTime(track===2?.24:.65,time+.003);gain.gain.exponentialRampToValueAtTime(.001,time+length)
  let source:AudioScheduledSourceNode
  if(track===1||track===2){const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*length),context.sampleRate);const values=buffer.getChannelData(0);for(let i=0;i<values.length;i++)values[i]=Math.random()*2-1
   const noise=context.createBufferSource();noise.buffer=buffer;const filter=context.createBiquadFilter();filter.type='highpass';filter.frequency.value=track===2?timbre.hat:900;noise.connect(filter);filter.connect(gain);source=noise
  }else{const oscillator=context.createOscillator();oscillator.type=timbre.wave;oscillator.frequency.setValueAtTime(track===0?timbre.kick:beat.palette==='acoustique'?520:340,time);oscillator.frequency.exponentialRampToValueAtTime(track===0?45:180,time+length);oscillator.connect(gain);source=oscillator}
  active.add(source);source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect()};source.start(time);source.stop(time+length)
 }
 function schedule(){if(stopped)return;while(nextTime<context.currentTime+.12){const section=Math.floor(index/16)%beat.patterns.length,step=index%16;beat.patterns[section]!.forEach((row,track)=>{if(row[step])hit(track,nextTime)})
   const timeout=window.setTimeout(()=>{visuals.delete(timeout);if(!stopped)onStep(step,section)},Math.max(0,(nextTime-context.currentTime)*1000));visuals.add(timeout);index++;nextTime+=60/beat.tempo/4
  }}
 const timer=window.setInterval(schedule,25);schedule()
 const stop=()=>{if(stopped)return;stopped=true;window.clearInterval(timer);visuals.forEach(window.clearTimeout);active.forEach(s=>{try{s.stop()}catch{/* already stopped */}});master.disconnect();void context.close();restore();document.removeEventListener('visibilitychange',hidden);onStep(-1,0)}
 const hidden=()=>{if(document.visibilityState==='hidden')stop()};document.addEventListener('visibilitychange',hidden)
 return stop
}
