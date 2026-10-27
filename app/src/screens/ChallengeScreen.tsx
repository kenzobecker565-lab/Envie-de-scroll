import { ArrowLeft, CalendarDays, Check, ChevronRight, Clock3 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { challengeId, CHALLENGE_DURATION, dailyWord, monthDaysUntil, type ChallengePassion } from '@scroll-up/shared'
import { track } from '../api/client.ts'
import { todayKey, wordDone } from '../components/Challenge.tsx'
import { PassionArtwork } from '../components/PassionArtwork.tsx'
import { AppHeader } from '../components/AppHeader.tsx'
import { Screen } from '../components/Screen.tsx'
import { plural } from '../lib/format.ts'
import { useStartChallenge } from '../lib/useStartChallenge.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/** Today's word and the existing catch-up calendar share the same activity flow. */
export function ChallengeScreen() {
  const { state } = useAppState()
  const { back, push } = useNavigation()
  const start = useStartChallenge()
  const today = todayKey()
  const [day, setDay] = useState(today)
  const [monthOpen, setMonthOpen] = useState(false)
  const monthRef = useRef<HTMLElement>(null)
  const done = state.me.stats.challenge ?? []
  const { word } = dailyWord(day)
  const days = monthDaysUntil(today)
  const count = days.filter(entry => wordDone(entry, done)).length
  useEffect(() => track('challenge_open'), [])
  useEffect(() => { if (monthOpen) monthRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [monthOpen])

  return <Screen tabs className="studio-challenge">
    <div className="studio-challenge-header"><button type="button" className="studio-icon-button" aria-label="Retour" onClick={back}><ArrowLeft size={22}/></button><AppHeader/></div>
    <h1 className="studio-page-title">Le mot du jour</h1>
    <section className="studio-word-panel" aria-label={`Le mot du ${day} : ${word}`}>
      <span className="studio-word-date">{day === today ? 'Aujourd’hui' : `Le ${Number(day.slice(8))}`}</span>
      <strong>{word}</strong><p>À toi de lui donner vie.</p>
      {wordDone(day, done) && <span className="studio-word-completed"><Check size={15}/> {day === today ? 'Déjà créé aujourd’hui' : 'Déjà créé'}</span>}
    </section>
    <div className="studio-word-activities">
      {(['dessin', 'ecriture'] as ChallengePassion[]).map(passion => {
        const already = done.includes(challengeId(passion, day))
        const available = state.me.user.passions.includes(passion)
        return <article key={passion} className="studio-word-activity" data-passion={passion}>
          <PassionArtwork passion={passion}/>
          <div><h2>{passion === 'dessin' ? 'Dessiner' : 'Écrire'}</h2><span className="studio-word-duration"><Clock3 size={15}/>{CHALLENGE_DURATION} min{already && <Check size={15}/>}</span>
            {!available && <p>Ajoute cette passion pour participer.</p>}
            <button type="button" onClick={() => available ? start(passion, day) : push({ name: 'passions', mode: 'edit' })} aria-label={available ? `${already ? 'Recommencer' : 'Commencer'} le mot du jour en ${passion === 'dessin' ? 'dessin' : 'écriture'}` : `Ajouter ${passion === 'dessin' ? 'Dessin' : 'Écriture'} à mes passions`}>{available ? already ? 'Recommencer' : 'C’est parti' : 'Ajouter la passion'}<ChevronRight size={16}/></button>
          </div>
        </article>
      })}
    </div>
    <button type="button" className="studio-month-toggle" aria-expanded={monthOpen} aria-controls="month-words" onClick={() => setMonthOpen(value => !value)}><CalendarDays size={26}/><span>Les mots du mois</span><ChevronRight size={20}/></button>
    {monthOpen && <section id="month-words" ref={monthRef} className="studio-month-words" aria-labelledby="month-title">
      <div className="studio-section-heading"><h2 id="month-title">Les mots du mois</h2><span>{plural(count, 'mot fait', 'mots faits')}</span></div>
      <ul>{days.map(entry => <li key={entry}><button type="button" aria-pressed={entry === day} className={wordDone(entry, done) ? 'is-done' : ''} aria-label={`${dailyWord(entry).word}, le ${Number(entry.slice(8))}${wordDone(entry, done) ? ', fait' : ''}`} onClick={() => { haptics.selection(); setDay(entry); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>{wordDone(entry, done) && <Check size={14}/>}<small>{Number(entry.slice(8))}</small>{dailyWord(entry).word}</button></li>)}</ul>
      <p>Les mots verts sont faits. Les autres t’attendent.</p>
    </section>}
  </Screen>
}
