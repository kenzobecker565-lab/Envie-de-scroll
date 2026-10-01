import { CalendarHeart, Check, Clock3, Play } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { challengeId, CHALLENGE_DURATION, dailyWord, getPassion, monthDaysUntil, type ChallengePassion } from '@scroll-up/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { track } from '../api/client.ts'
import { challengePassions, todayKey, wordDone, WordSticker } from '../components/Challenge.tsx'
import { Screen } from '../components/Screen.tsx'
import { plural } from '../lib/format.ts'
import { PASSION_ICONS } from '../lib/icons.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * Le mot du jour, en grand, à dessiner ou à écrire. En dessous, les mots
 * passés du mois : ceux qu'on a faits se colorent, les autres se rattrapent
 * d'un tap. Jamais de jour « raté » : on compte seulement ce qu'on a fait.
 */
export function ChallengeScreen() {
  const { state, dispatch } = useAppState()
  const { reset } = useNavigation()
  const today = todayKey()
  const [day, setDay] = useState(today)
  const done = state.me.stats.challenge ?? []
  const passions = challengePassions(state.me.user.passions)
  const { word, theme } = dailyWord(day)
  const days = monthDaysUntil(today)
  const count = days.filter((entry) => wordDone(entry, done)).length

  useEffect(() => track('challenge_open'), [])

  const start = (passion: ChallengePassion) => {
    haptics.impact('heavy')
    track('cta', { from: 'mot-du-jour', passion })
    dispatch({ type: 'newFlow', flow: { fixedPassion: passion, fixedStep: challengeId(passion, day) } })
    reset([{ name: 'home' }, { name: 'signal' }])
  }

  return (
    <Screen>
      <header className="flex flex-col gap-3">
        <Badge variant="warm" tilt="left">
          <CalendarHeart aria-hidden="true" />
          Le mot du jour
        </Badge>
        <h1 className="font-display text-40 leading-none font-extrabold tracking-tight text-ink">{theme}</h1>
        <p className="text-16 text-ink-soft">Un mot par jour, à dessiner ou à écrire en {CHALLENGE_DURATION}&nbsp;minutes. Les mots passés se rattrapent quand tu veux.</p>
      </header>

      <AnimatePresence mode="wait">
        <Card
          key={day}
          className="mt-6 items-center gap-4 py-6 text-center shadow-pop"
          initial={{ opacity: 0, rotateY: -90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: 90 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-13 font-bold tracking-wider text-ink-soft uppercase">{day === today ? 'Aujourd’hui' : `Le ${Number(day.slice(8))}`}</span>
          <WordSticker word={word} size="lg" className="-rotate-2" />
          <div className="flex w-full flex-col gap-2">
            {passions.map((passion) => {
              const Icon = PASSION_ICONS[passion]
              const already = done.includes(challengeId(passion, day))
              return (
                <Button key={passion} variant={already ? 'secondary' : 'default'} className="w-full" onClick={() => start(passion)}>
                  {already ? <Check aria-hidden="true" /> : <Play aria-hidden="true" />}
                  {passion === 'dessin' ? (already ? 'Dessiné ! Le redessiner' : 'Le dessiner') : already ? 'Écrit ! Le réécrire' : 'L’écrire'}
                  <Icon aria-hidden="true" className="opacity-70" />
                </Button>
              )
            })}
            {passions.length === 0 && (
              <p className="text-14 text-ink-soft">Le mot du jour se dessine ou s’écrit&nbsp;: ajoute Dessin ou Écriture à tes passions (réglages) pour y jouer.</p>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-13 font-semibold text-ink-soft">
            <Clock3 size={14} aria-hidden="true" />
            {CHALLENGE_DURATION}&nbsp;min · {getPassion('dessin').label} ou {getPassion('ecriture').label.toLowerCase()}
          </span>
        </Card>
      </AnimatePresence>

      <section className="mt-8 flex flex-col gap-3" aria-labelledby="month-words">
        <h2 id="month-words" className="flex items-center justify-between text-12 font-bold tracking-wider text-ink-soft uppercase">
          <span>Les mots du mois</span>
          <span className="font-numbers text-13 tracking-normal text-ink normal-case">{plural(count, 'mot fait', 'mots faits')}</span>
        </h2>
        <ul className="flex flex-wrap gap-2">
          {days.map((entry, index) => {
            const isDone = wordDone(entry, done)
            const selected = entry === day
            const doneIn = passions.filter((passion) => done.includes(challengeId(passion, entry)))
            return (
              <motion.li key={entry} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, rotate: index % 3 === 0 ? -2 : index % 3 === 1 ? 1.5 : 0 }} transition={{ delay: Math.min(index, 12) * 0.03 }}>
                <button
                  type="button"
                  onClick={() => {
                    haptics.selection()
                    setDay(entry)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  aria-pressed={selected}
                  aria-label={`${dailyWord(entry).word}, le ${Number(entry.slice(8))}${isDone ? ', fait' : ''}`}
                  className={cn(
                    'inline-flex min-h-10 items-center gap-1.5 rounded-pill border-2 px-3 text-14 font-bold',
                    isDone ? 'border-outline bg-good text-on-color shadow-chip' : 'border-dashed border-outline bg-card text-ink',
                    selected && 'ring-[3px] ring-accent',
                  )}
                >
                  {doneIn.map((passion) => {
                    const Icon = PASSION_ICONS[passion]
                    return <Icon key={passion} size={14} strokeWidth={2.4} aria-hidden="true" />
                  })}
                  {dailyWord(entry).word}
                </button>
              </motion.li>
            )
          })}
        </ul>
        <p className="text-13 text-ink-soft">
          Les mots verts sont faits. Les autres t’attendent, sans compte à rebours.
        </p>
      </section>
    </Screen>
  )
}
