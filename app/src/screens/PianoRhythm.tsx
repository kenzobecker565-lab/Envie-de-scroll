import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Music2, Pause, Play, X } from 'lucide-react'
import { RHYTHM_SONGS, rhythmSong, rhythmTarget, rhythmTiles, RHYTHM_TRAVEL_MS, rhythmHoldComplete, type RhythmTile } from '@scroll-up/shared'
import { api } from '../api/client.ts'
import { Mascot } from '../components/Mascot.tsx'
import { suppressAmbient } from '../lib/ambient.ts'
import { playNote, unlockPianoAudio, type NoteHandle } from '../lib/pianoSound.ts'
import { enterFullscreen, exitFullscreen, telegram } from '../telegram/webApp.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import './PianoRhythm.css'

const format = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2,'0')}`

export function RhythmLibrary() {
  const { push } = useNavigation()
  return <>
    <div className="rhythm-list-intro"><Mascot pose="rhythm-sway" size={80}/><div><h2>Une pause en musique</h2><p>Des airs que tu connais, un rythme vif et des notes à toucher ou à maintenir.</p></div></div>
    <div className="rhythm-choices">{RHYTHM_SONGS.map(song => <button type="button" className="rhythm-choice" key={song.id} onClick={() => push({ name:'pianoRhythm', songId:song.id })}><span className="rhythm-song-icon"><Music2 size={26}/></span><span><strong>{song.title}</strong><small>{song.composer}</small><small>{song.description} · {format(song.durationMs)}</small></span><Play size={20}/></button>)}</div>
  </>
}

export function PianoRhythm({ songId }: { songId: string }) {
  const song = rhythmSong(songId) ?? RHYTHM_SONGS[0]!
  const tiles = useRef(rhythmTiles(song)).current
  const { back, reset } = useNavigation(), { dispatch } = useAppState()
  const [phase,setPhase] = useState<'ready'|'starting'|'playing'|'paused'|'done'>('ready')
  const [time,setTime] = useState(0), [hits,setHits] = useState(0), [feedback,setFeedback] = useState('Touche les notes près de la ligne menthe')
  const [reward,setReward] = useState<number>(), [error,setError] = useState(''), [saving,setSaving] = useState(false)
  const elapsed = useRef(0), used = useRef(new Set<number>()), played = useRef(new Set<number>()), handles = useRef(new Set<NoteHandle>())
  const session = useRef<string | undefined>(undefined), mounted = useRef(true), active = useRef(false), score = useRef(0), feedbackUntil = useRef(0)
  const fullOwned = useRef(false), browserOwned = useRef(false)
  const holds = useRef(new Map<number, { tile: RhythmTile; startedAt: number; input: string }>())
  const completed = useRef(new Set<number>())
  const [pressed,setPressed] = useState<number[]>([])
  const clearHolds = () => { holds.current.clear();setPressed([]) }
  const stopAudio = () => { handles.current.forEach(note => note.release()); handles.current.clear() }
  const sound = (tile: RhythmTile) => { const h=playNote(tile.note);handles.current.add(h);window.setTimeout(()=>{h.release();handles.current.delete(h)},Math.max(100,Math.min(2600,tile.lengthMs*.9))) }
  const leave = () => { active.current=false;stopAudio();back() }

  useEffect(() => {
    mounted.current=true
    const restore=suppressAmbient('piano-rhythm')
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden'
    return () => { mounted.current=false;active.current=false;stopAudio();restore();document.body.style.overflow=overflow
      if(fullOwned.current)exitFullscreen()
      if(browserOwned.current&&document.fullscreenElement)void document.exitFullscreen().catch(()=>{})
    }
  }, [])
  const requestFull = () => {
    if(telegram) { fullOwned.current=!telegram.isFullscreen;enterFullscreen() }
    else if(!document.fullscreenElement&&document.documentElement.requestFullscreen) void document.documentElement.requestFullscreen().then(()=>{browserOwned.current=true;if(!mounted.current)void document.exitFullscreen().catch(()=>{})}).catch(()=>{})
  }
  const start = async () => {
    if(phase!=='ready')return
    requestFull(); unlockPianoAudio();setPhase('starting');setError('')
    try { const value=await api.startRhythm(song.id);if(!mounted.current)return;session.current=value.sessionId;active.current=true;setPhase('playing') }
    catch(e) { if(mounted.current){setError((e as Error).message);setPhase('ready')} }
  }
  const pause = () => { active.current=false;stopAudio();clearHolds();setPhase('paused') }
  useEffect(() => {
    const visibility=()=>{if(document.hidden&&active.current)pause()}
    document.addEventListener('visibilitychange',visibility)
    return()=>document.removeEventListener('visibilitychange',visibility)
  }, [])
  const save = async () => {
    if(!session.current||saving||reward!==undefined)return
    setSaving(true);setError('')
    try { const value=await api.finishRhythm(session.current,score.current);if(!mounted.current)return;setReward(value.coins);dispatch({type:'stats',stats:value.stats}) }
    catch(e){if(mounted.current)setError((e as Error).message)}finally{if(mounted.current)setSaving(false)}
  }
  useEffect(() => {
    if(phase!=='playing')return
    let id=0,last=performance.now()
    const tick=(at:number)=>{
      if(!active.current)return
      elapsed.current=Math.min(song.durationMs,elapsed.current+Math.min(100,at-last));last=at
      const ms=elapsed.current
      for(const tile of tiles)if(!played.current.has(tile.id)&&ms>=tile.at){played.current.add(tile.id);sound(tile)}
      for(const [lane,hold] of holds.current)if(rhythmHoldComplete(hold.tile,hold.startedAt,ms)){
        completed.current.add(hold.tile.id);score.current++;setHits(score.current);holds.current.delete(lane);setPressed([...holds.current.keys()]);feedbackUntil.current=ms+700;setFeedback('Tenue réussie !')
      }
      setTime(ms)
      if(ms>=song.durationMs){active.current=false;stopAudio();setPhase('done');void save();return}
      id=requestAnimationFrame(tick)
    }
    id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id)
  }, [phase])
  const tap = (lane: number, input: string) => {
    if(!active.current || holds.current.has(lane))return
    const tile=rhythmTarget(tiles,used.current,lane,elapsed.current)
    if(tile){
      used.current.add(tile.id)
      if(tile.holdMs){holds.current.set(lane,{tile,startedAt:elapsed.current,input});setPressed([...holds.current.keys()]);setFeedback('Maintiens…')}
      else {completed.current.add(tile.id);score.current++;setHits(score.current);setFeedback('Bien joué !')}
      feedbackUntil.current=elapsed.current+700
    }else {feedbackUntil.current=elapsed.current+700;setFeedback('Garde le rythme')}
  }
  const release = (input: string) => {
    for(const [lane,hold] of holds.current)if(hold.input===input){
      if(rhythmHoldComplete(hold.tile,hold.startedAt,elapsed.current)){completed.current.add(hold.tile.id);score.current++;setHits(score.current);setFeedback('Tenue réussie !')}
      else {setFeedback('Tiens jusqu’au bout');feedbackUntil.current=elapsed.current+700}
      holds.current.delete(lane);setPressed([...holds.current.keys()])
    }
  }
  useEffect(() => {
    if(phase!=='playing')return
    const down=(e:KeyboardEvent)=>{const lane=['d','f','j','k'].indexOf(e.key.toLowerCase());if(lane>=0&&!e.repeat){e.preventDefault();tap(lane,`key-${lane}`)}if(e.key==='Escape')leave()}
    const up=(e:KeyboardEvent)=>{const lane=['d','f','j','k'].indexOf(e.key.toLowerCase());if(lane>=0)release(`key-${lane}`)}
    const pointer=(e:PointerEvent)=>release(`pointer-${e.pointerId}`)
    const blur=()=>{if(active.current)pause()}
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('pointerup',pointer);window.addEventListener('pointercancel',pointer);window.addEventListener('blur',blur)
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('pointerup',pointer);window.removeEventListener('pointercancel',pointer);window.removeEventListener('blur',blur)}
  }, [phase])
  const pose = feedback.includes('Garde') && time<feedbackUntil.current ? 'rhythm-encourage' : (['rhythm-sway','rhythm-nod','rhythm-tap','rhythm-dance','rhythm-enjoy'] as const)[Math.floor(time/12000)%5]
  return createPortal(<section className="rhythm-fullscreen" data-phase={phase} aria-label="Piano en rythme">
    <header className="rhythm-top"><button type="button" className="rhythm-icon" aria-label="Quitter En rythme" onClick={leave}><X/></button><div><h1>En rythme</h1><p className="rhythm-time">{song.title}</p></div>{phase==='playing'?<button type="button" className="rhythm-icon" aria-label="Mettre en pause" onClick={pause}><Pause/></button>:<span className="rhythm-live-mascot"><Mascot pose={phase==='done'?'rhythm-celebrate':'rhythm-wave'} size={48}/></span>}</header>
    {phase==='ready'||phase==='starting'?<div className="rhythm-ready"><Mascot pose="rhythm-enjoy" size={170}/><h2>{song.title}</h2><p className="rhythm-composer">{song.composer} · Extrait adapté · {format(song.durationMs)}</p><div className="rhythm-instructions"><span><i/>Touche les notes courtes sur la ligne menthe.</span><span><i className="long"/>Maintiens les notes longues jusqu’au bout.</span></div><p>Les erreurs ne coupent pas la musique.</p><p>Au clavier : D, F, J et K.</p>{song.source&&<details className="rhythm-credits"><summary>À propos du morceau</summary><p>Adaptation d’une composition du domaine public, jouée par le synthétiseur de Scroll-up. Aucun enregistrement tiers.</p><a href={song.source} target="_blank" rel="noreferrer">Consulter la partition de référence</a></details>}{error&&<p role="alert">{error}</p>}<button className="rhythm-primary" disabled={phase==='starting'} onClick={()=>void start()}>{phase==='starting'?'Préparation…':'Commencer le morceau'}</button><button className="rhythm-secondary" onClick={leave}>Revenir aux morceaux</button></div>:phase==='done'?<div className="rhythm-end"><Mascot pose="rhythm-celebrate" size={180}/><h2>Mélodie terminée !</h2><p>Tu t’es offert une pause musicale.</p><div className="rhythm-summary"><strong>{song.title}</strong><span>{format(song.durationMs)} de musique</span><span>{hits} touches réussies sur {tiles.length}</span>{reward!==undefined&&<span>+{reward} minuton{reward>1?'s':''}</span>}</div>{saving&&<p role="status">Enregistrement de ta pause…</p>}{error&&<><p role="alert">{error}</p><button className="rhythm-secondary" onClick={()=>void save()}>Réessayer l’enregistrement</button></>}<p>Tu peux t’arrêter ici.</p><button className="rhythm-primary" onClick={leave}>Choisir un autre morceau</button><button className="rhythm-secondary" onClick={()=>{active.current=false;stopAudio();reset([{name:'home'}])}}>Terminer ma pause</button></div>:<>
      <div className="rhythm-progress" role="progressbar" aria-label="Progression du morceau" aria-valuenow={Math.round(time/song.durationMs*100)} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${time/song.durationMs*100}%`}}/></div>
      <div className="rhythm-top"><span className="rhythm-time">{format(time)} / {format(song.durationMs)}</span><Mascot pose={pose} size={48}/></div>
      <p className="rhythm-feedback" aria-live="polite">{time<feedbackUntil.current?feedback:`${hits} notes réussies`}</p>
      <div className="rhythm-board">{[0,1,2,3].map(lane=><div className="rhythm-lane" data-pressed={pressed.includes(lane)} key={lane} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);tap(lane,`pointer-${e.pointerId}`)}}>{tiles.filter(tile=>tile.lane===lane&&!completed.current.has(tile.id)&&tile.at-time<RHYTHM_TRAVEL_MS+tile.holdMs&&tile.at+tile.holdMs-time> -250).map(tile=>{
        const held=holds.current.get(lane)?.tile.id===tile.id
        const remaining=held?Math.max(0,tile.at+tile.holdMs-time):tile.holdMs
        const head=held?80:80-(tile.at-time)/RHYTHM_TRAVEL_MS*85
        const height=tile.holdMs?remaining/RHYTHM_TRAVEL_MS*85:Math.max(5,Math.min(9,tile.lengthMs/70))
        return <span className="rhythm-note" key={tile.id} data-long={tile.holdMs>0} data-held={held} data-missed={used.current.has(tile.id)&&!held} style={{top:`${head-height}%`,height:`${height}%`}}><i/></span>
      })}</div>)}<div className="rhythm-hitline"/><div className="rhythm-targets">{['D','F','J','K'].map((key,lane)=><button type="button" key={key} data-pressed={pressed.includes(lane)} aria-label={`Jouer la colonne ${lane+1}`} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);tap(lane,`pointer-${e.pointerId}`)}} onClick={e=>{if(e.detail===0){tap(lane,`key-${lane}`);release(`key-${lane}`)}}}>{key}</button>)}</div>{phase==='paused'&&<div className="rhythm-pause"><h2>Une petite pause</h2><button className="rhythm-primary" onClick={()=>{unlockPianoAudio();active.current=true;setPhase('playing')}}>Reprendre</button><button className="rhythm-secondary" style={{color:'white'}} onClick={leave}>Quitter le morceau</button></div>}</div>
      <p className="rhythm-info">Les erreurs ne coupent pas la musique.</p>
    </>}
  </section>,document.body)
}
