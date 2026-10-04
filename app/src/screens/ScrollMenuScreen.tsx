import { useRef, useState } from 'react'
import { Check, Shuffle, Sparkles } from 'lucide-react'
import { ACTIVE_PASSION_IDS, DURATIONS, getPassion, type Duration, type PassionId } from '@scroll-up/shared'
import { Button } from '../components/ui/button.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { PassionArtwork } from '../components/PassionArtwork.tsx'
import { Screen } from '../components/Screen.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { api, track } from '../api/client.ts'
import { haptics } from '../telegram/webApp.ts'

/** One deliberate choice of time and passion. Surprise only uses this user's passions. */
export function ScrollMenuScreen() {
  const { state, dispatch } = useAppState()
  const { push } = useNavigation()
  const passions = state.flow.fixedPassion ? [state.flow.fixedPassion] : ACTIVE_PASSION_IDS
  const [duration, setDuration] = useState<Duration>(state.flow.duration ?? 15)
  const [selected, setSelected] = useState<PassionId | 'surprise'>(state.flow.fixedPassion ?? state.flow.passion ?? 'surprise')
  const submitting = useRef(false)
  const [error,setError]=useState<string>()
  const start = async () => {
    if (submitting.current || !passions.length) return
    submitting.current = true
    const pool=state.me.user.passions.length?state.me.user.passions:passions
    const passion = selected === 'surprise' ? pool[Math.floor(Math.random() * pool.length)]! : selected
    try {
     if(!state.me.user.passions.includes(passion)){const response=await api.updatePassions([...state.me.user.passions,passion]);dispatch({type:'user',user:response.user})}
    }catch(e){setError((e as Error).message);submitting.current=false;return}
    haptics.selection()
    track('time', { duration }); track('passion', { passion })
    dispatch({ type: 'flow', flow: { duration, passion } })
    push({ name: 'activity' })
  }
  return <Screen className="scroll-menu">
    <section className="flow-welcome"><div><h1>J’ai envie de scroll</h1><p>On en fait un moment pour toi ?</p></div><Mascot pose="think" size={108}/></section>
    <h2>Combien de temps ?</h2>
    <div className="scroll-times" role="group" aria-label="Ton temps disponible">{DURATIONS.map(value => <button type="button" key={value} aria-pressed={duration === value} onClick={() => { setDuration(value); haptics.selection() }}>{value} min</button>)}</div>
    <h2>Quelle passion ?</h2>
    {!state.flow.fixedPassion && <button type="button" className="scroll-surprise" aria-pressed={selected === 'surprise'} onClick={() => setSelected('surprise')}><Shuffle size={23}/><span><strong>Surprends-moi</strong><small>Une idée parmi mes passions</small></span>{selected === 'surprise' && <Check size={19}/>}</button>}
    <div className="scroll-passions">{passions.map(passion => <button type="button" key={passion} data-passion={passion} aria-pressed={selected === passion} onClick={() => { setSelected(passion); haptics.selection() }}><PassionArtwork passion={passion}/><strong>{passion==='cinema'?'Cinéma':getPassion(passion).label}</strong>{selected === passion && <span className="scroll-selected"><Check size={15}/></span>}</button>)}</div>
    {!passions.length && <p>Choisis tes passions dans tes réglages pour commencer.</p>}
    {error&&<p role="alert">{error}</p>}
    <Button className="scroll-start" disabled={!passions.length} onClick={()=>void start()}><Sparkles size={18}/>Propose-moi une activité</Button>
  </Screen>
}
