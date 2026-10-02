import { ArrowRight, Check, Ear, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { keyboardKeys, keyboardWindow, melodyParts, midiNumber, noteLabel, type Melody } from '@scroll-up/shared'
import { cn } from '@/lib/utils'
import { track } from '../api/client.ts'
import { playNote } from '../lib/pianoSound.ts'
import { haptics } from '../telegram/webApp.ts'

/**
 * Le clavier de l'appli : des touches qui sonnent dès qu'on les touche,
 * plusieurs doigts à la fois.
 *
 * Avec une mélodie, c'est un tuto patient :
 * - la partition en entier sous les yeux : toutes les notes de la partie, une
 *   ligne par phrase, pour lire le morceau tranquillement ;
 * - un morceau long s'apprend en plusieurs parties, l'une après l'autre ;
 * - la touche à jouer s'allume, on avance note après note, « Écouter » joue
 *   la partie en entier, une fausse note donne un indice ;
 * - le clavier montre juste ce qu'il faut de touches pour la partie.
 * `onComplete` prévient quand toutes les parties sont jouées (l'activité ou la
 * leçon se valide ainsi).
 */

type Range = 'low' | 'mid'
const RANGES: Record<Range, { from: string; to: string; label: string }> = {
  low: { from: 'C3', to: 'C4', label: 'Graves' },
  mid: { from: 'C4', to: 'C5', label: 'Médium' },
}

/** La partie du clavier où se joue une note (le do central est dans les deux). */
function rangeFor(note: string, preferred: Range): Range {
  const midi = midiNumber(note)
  if (midi < midiNumber('C4')) return 'low'
  if (midi > midiNumber('C4')) return 'mid'
  return preferred
}

export function PianoKeyboard({ melody, onComplete }: { melody?: Melody; onComplete?: () => void }) {
  const parts = useMemo(() => (melody ? melodyParts(melody) : []), [melody])
  const [part, setPart] = useState(0)
  const [step, setStep] = useState(0)
  const [cleared, setCleared] = useState<ReadonlySet<number>>(new Set())
  const [range, setRange] = useState<Range>(melody?.notes[0] ? rangeFor(melody.notes[0], 'mid') : 'mid')
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set())
  const [miss, setMiss] = useState<string>()
  const [demo, setDemo] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const completed = useRef(false)

  const current = parts[part]
  const notes = current?.notes ?? []
  const partDone = Boolean(current && step >= notes.length)
  const allDone = parts.length > 0 && cleared.size === parts.length
  const target = current && !partDone ? notes[step] : undefined
  const lit = demo !== null ? notes[demo] : target
  // Juste les touches qu'il faut pour la partie ; sinon une octave, graves ou médium.
  const portion = useMemo(() => (current ? keyboardWindow(current.notes) : null), [current])

  // Sans portion fixe, la touche à jouer doit être à l'écran : on passe aux graves ou au médium.
  useEffect(() => {
    if (!lit || portion) return
    setRange((previous) => rangeFor(lit, previous))
  }, [lit, portion])

  const stopDemo = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
    setDemo(null)
  }
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])

  const keys = portion ? keyboardKeys(portion.from, portion.to) : keyboardKeys(RANGES[range].from, RANGES[range].to)
  const whites = keys.filter((key) => !key.black)

  const press = (note: string) => {
    playNote(note)
    setPressed((previous) => new Set(previous).add(note))
    if (!melody || !current || partDone || demo !== null) return
    if (note !== target) {
      if (target) {
        haptics.impact('light')
        setMiss(`Presque ! Cherche le ${noteLabel(target)}.`)
      }
      return
    }
    setMiss(undefined)
    const next = step + 1
    setStep(next)
    if (next < notes.length) return haptics.selection()
    // Une partie de plus dans la poche.
    haptics.success()
    const nowCleared = new Set(cleared).add(part)
    setCleared(nowCleared)
    if (parts.length > 1) track('melody_part', { melody: melody.title, part: part + 1 })
    if (nowCleared.size === parts.length && !completed.current) {
      completed.current = true
      track('melody_done', { melody: melody.title })
      onComplete?.()
    }
  }

  const release = (note: string) => {
    setPressed((previous) => {
      if (!previous.has(note)) return previous
      const next = new Set(previous)
      next.delete(note)
      return next
    })
  }

  const listen = () => {
    if (!current) return
    haptics.impact('light')
    stopDemo()
    timers.current = current.notes.map((note, index) =>
      window.setTimeout(() => {
        setDemo(index)
        playNote(note)
      }, index * 480),
    )
    timers.current.push(window.setTimeout(() => setDemo(null), current.notes.length * 480 + 200))
  }

  const goTo = (index: number) => {
    haptics.selection()
    stopDemo()
    setPart(index)
    setStep(0)
    setMiss(undefined)
  }

  // La partie suivante à apprendre : la première pas encore jouée.
  const nextPart = parts.findIndex((_, index) => !cleared.has(index) && index !== part)

  const keyProps = (note: string) => ({
    onPointerDown: (event: React.PointerEvent) => {
      event.preventDefault()
      ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
      press(note)
    },
    onPointerUp: () => release(note),
    onPointerCancel: () => release(note),
    onPointerLeave: () => release(note),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      press(note)
      window.setTimeout(() => release(note), 150)
    },
  })

  let offset = 0
  return (
    <div className="flex flex-col gap-3">
      {melody && current && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 font-display text-17 leading-tight font-extrabold tracking-tight text-ink">{melody.title}</span>
            <button
              type="button"
              onClick={listen}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill border-2 border-outline bg-card px-3 text-13 font-bold text-ink shadow-chip active:shadow-press"
            >
              <Ear size={15} strokeWidth={2.4} aria-hidden="true" />
              Écouter
            </button>
          </div>

          {/* Les parties d'apprentissage : une à la fois, dans l'ordre qu'on veut. */}
          {parts.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Les parties du morceau">
              <span className="mr-1 text-12 font-extrabold tracking-wider text-ink-soft uppercase">Partie</span>
              {parts.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={index === part}
                  aria-label={`Partie ${index + 1}${cleared.has(index) ? ', réussie' : ''}`}
                  onClick={() => goTo(index)}
                  className={cn(
                    'relative flex h-9 min-w-9 items-center justify-center rounded-pill border-2 px-2 font-numbers text-14 font-extrabold transition-colors duration-150',
                    index === part ? 'border-outline bg-ink text-canvas' : cleared.has(index) ? 'border-outline bg-good text-on-color' : 'border-outline/40 bg-card text-ink-soft',
                  )}
                >
                  {cleared.has(index) && index !== part ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : index + 1}
                </button>
              ))}
              <span className="ml-auto text-12 font-bold text-ink-soft">{parts.length} parties</span>
            </div>
          )}

          {/* La partition : toutes les notes de la partie d'un coup, une ligne par phrase. */}
          <div className="flex flex-col gap-2 rounded-md border-2 border-outline/25 bg-canvas p-2.5" aria-label={`Les notes de ${melody.title}${parts.length > 1 ? `, partie ${part + 1}` : ''}`} role="group">
            {current.phrases.map((phrase, phraseIndex) => {
              const start = offset
              offset += phrase.length
              return (
                <ol key={`${part}-${phraseIndex}`} className="flex flex-wrap gap-1.5">
                  {phrase.map((note, noteIndex) => {
                    const index = start + noteIndex
                    const now = demo !== null ? index === demo : index === step
                    const done = demo === null && index < step
                    return (
                      <li
                        key={index}
                        aria-current={now ? 'step' : undefined}
                        className={cn(
                          'flex h-9 min-w-10 items-center justify-center rounded-pill border-2 px-1.5 text-13 font-extrabold transition-colors duration-150',
                          now ? 'border-outline bg-accent text-on-color' : done ? 'border-transparent bg-good-soft text-good-ink' : 'border-outline/30 bg-card text-ink',
                        )}
                      >
                        {noteLabel(note)}
                      </li>
                    )
                  })}
                </ol>
              )
            })}
          </div>
        </div>
      )}

      {/* Graves ou médium, quand les notes ne tiennent pas d'un bloc (ou pour jouer librement). */}
      {!portion && (
        <div className="flex gap-1.5 self-start rounded-pill border-2 border-outline bg-card p-1" role="group" aria-label="Partie du clavier">
          {(['low', 'mid'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setRange(id)}
              aria-pressed={range === id}
              className={cn('h-8 rounded-pill px-3 text-13 font-bold', range === id ? 'bg-ink text-canvas' : 'text-ink-soft')}
            >
              {RANGES[id].label}
            </button>
          ))}
        </div>
      )}

      <div className="relative h-44 rounded-md border-[2.5px] border-outline bg-[#1d1a17] p-1.5 shadow-card select-none" style={{ touchAction: 'none' }}>
        <div className="relative h-full">
          <div className="grid h-full gap-1" style={{ gridTemplateColumns: `repeat(${whites.length}, minmax(0, 1fr))` }}>
            {whites.map((key) => {
              const isTarget = key.note === lit
              const down = pressed.has(key.note)
              return (
                <button
                  key={key.note}
                  type="button"
                  aria-label={`${noteLabel(key.note)}${key.note === 'C4' ? ', do central' : ''}`}
                  {...keyProps(key.note)}
                  className={cn(
                    'relative flex flex-col items-center justify-end rounded-b-[9px] rounded-t-[3px] pb-2 font-extrabold text-[#1d1a17] transition-[transform,background-color] duration-75',
                    whites.length > 10 ? 'text-11' : 'text-12',
                    isTarget ? 'bg-accent' : 'bg-[#fffdf7]',
                    down && 'translate-y-[2px] bg-[#e9e2cf]',
                  )}
                >
                  {isTarget && <span aria-hidden="true" className="motion-loop anim-pulse-soft absolute inset-x-1 top-2 h-2 rounded-pill bg-[#fffdf7]/80" />}
                  {key.note === 'C4' && <span aria-hidden="true" className="mb-1 h-1.5 w-1.5 rounded-pill bg-[#1d1a17]/50" />}
                  {noteLabel(key.note)}
                </button>
              )
            })}
          </div>
          {keys.map((key, index) => {
            if (!key.black) return null
            // La touche noire se pose à cheval sur la touche blanche qui la précède et la suivante.
            const whitesBefore = keys.slice(0, index).filter((entry) => !entry.black).length
            const isTarget = key.note === lit
            const down = pressed.has(key.note)
            return (
              <button
                key={key.note}
                type="button"
                aria-label={noteLabel(key.note).replace('♯', ' dièse')}
                {...keyProps(key.note)}
                className={cn(
                  'absolute top-0 z-10 h-[58%] rounded-b-[6px] border-2 border-[#1d1a17] transition-[transform,background-color] duration-75',
                  isTarget ? 'bg-accent' : 'bg-[#2e2a25]',
                  down && 'translate-y-[2px] bg-[#4a443c]',
                )}
                style={{ left: `calc(${(whitesBefore / whites.length) * 100}% - ${(0.62 / whites.length) * 50}%)`, width: `${(0.62 / whites.length) * 100}%` }}
              />
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {melody && partDone && allDone ? (
          <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-between gap-3" role="status">
            <span className="inline-flex items-center gap-2 text-14 font-extrabold text-ink">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border-2 border-outline bg-good text-on-color">
                <Check size={15} strokeWidth={3} aria-hidden="true" />
              </span>
              {parts.length > 1 ? 'Tout le morceau est joué !' : 'C’est joué, note pour note !'}
            </span>
            <button type="button" onClick={() => goTo(0)} className="inline-flex shrink-0 items-center gap-1 text-14 font-extrabold text-ink underline decoration-2 underline-offset-4">
              <RotateCcw size={14} strokeWidth={2.6} aria-hidden="true" />
              Rejouer
            </button>
          </motion.div>
        ) : melody && partDone ? (
          <motion.div key={`part-${part}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-between gap-3" role="status">
            <span className="inline-flex items-center gap-2 text-14 font-extrabold text-ink">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border-2 border-outline bg-good text-on-color">
                <Check size={15} strokeWidth={3} aria-hidden="true" />
              </span>
              Partie {part + 1} réussie&nbsp;!
            </span>
            <button
              type="button"
              onClick={() => goTo(Math.max(nextPart, 0))}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-pill border-2 border-outline bg-accent px-3 text-14 font-extrabold text-on-color shadow-chip active:shadow-press"
            >
              Partie {Math.max(nextPart, 0) + 1}
              <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </motion.div>
        ) : melody ? (
          <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-13 font-semibold text-ink-soft" aria-live="polite">
            {miss ?? (target ? `Joue la touche qui s’allume : ${noteLabel(target)} (${step + 1}/${notes.length}).` : '')}
          </motion.p>
        ) : (
          <motion.p key="free" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-13 font-semibold text-ink-soft">
            Joue librement. Le point marque le do central, le repère des deux mains.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
