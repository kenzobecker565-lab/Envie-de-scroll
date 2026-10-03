import { useRef, useState } from 'react'
import { Check, Shuffle, Sparkles } from 'lucide-react'
import { DURATIONS, getPassion, type Duration, type PassionId } from '@scroll-up/shared'
import { Button } from '../components/ui/button.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { PassionArtwork } from '../components/PassionArtwork.tsx'
import { Screen } from '../components/Screen.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { track } from '../api/client.ts'
import { haptics } from '../telegram/webApp.ts'

/** One deliberate choice of time and passion. Surprise only uses this user's passions. */
export function ScrollMenuScreen() {
  const { state, dispatch } = useAppState()
  const { push } = useNavigation()
  const passions = state.flow.fixedPassion ? [state.flow.fixedPassion] : state.me.user.passions
  const [duration, setDuration] = useState<Duration>(state.flow.duration ?? 15)
  const [selected, setSelected] = useState<PassionId | 'surprise'>(state.flow.fixedPassion ?? state.flow.passion ?? 'surprise')
  const submitting = useRef(false)
  const start = () => {
    if (submitting.current || !passions.length) return
    submitting.current = true
    const passion = selected === 'surprise' ? passions[Math.floor(Math.random() * passions.length)]! : selected
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
    <Button className="scroll-start" disabled={!passions.length} onClick={start}><Sparkles size={18}/>Propose-moi une activité</Button>
  </Screen>
}
