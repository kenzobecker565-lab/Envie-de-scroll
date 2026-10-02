import { Check, Ear, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { keyboardKeys, midiNumber, noteLabel, type Melody } from '@scroll-up/shared'
import { cn } from '@/lib/utils'
import { track } from '../api/client.ts'
import { playNote } from '../lib/pianoSound.ts'
import { haptics } from '../telegram/webApp.ts'

/**
 * Le clavier de l'appli, pour jouer sans piano : une octave à l'écran (les
 * graves ou le médium, autour du do central), des touches qui sonnent dès
 * qu'on les touche, plusieurs doigts à la fois.
 *
 * Avec une mélodie (« Au clair de la lune »…), c'est un professeur patient :
 * la touche à jouer s'allume, les notes défilent au-dessus, on avance note
 * après note, et « Écouter » joue l'air en entier pour l'avoir dans l'oreille.
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

/** Une mélodie tient-elle dans une seule partie du clavier ? (Sans mélodie, on garde le choix.) */
function wholeRange(melody: Melody | undefined): Range | null {
  if (!melody) return null
  for (const range of ['mid', 'low'] as const) {
    const from = midiNumber(RANGES[range].from)
    const to = midiNumber(RANGES[range].to)
    if (melody.notes.every((note) => midiNumber(note) >= from && midiNumber(note) <= to)) return range
  }
  return null
}

export function PianoKeyboard({ melody }: { melody?: Melody }) {
  const fixed = useMemo(() => wholeRange(melody), [melody])
  const [step, setStep] = useState(0)
  const [range, setRange] = useState<Range>(fixed ?? (melody?.notes[0] ? rangeFor(melody.notes[0], 'mid') : 'mid'))
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set())
  const [miss, setMiss] = useState<string>()
  const [demo, setDemo] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const chips = useRef<HTMLOListElement>(null)

  const target = melody && step < melody.notes.length ? melody.notes[step] : undefined
  const finished = Boolean(melody && step >= melody.notes.length)
  const lit = demo !== null && melody ? melody.notes[demo] : target

  // La touche à jouer doit être à l'écran : on passe aux graves ou au médium si besoin.
  useEffect(() => {
    if (!lit || fixed) return
    setRange((current) => rangeFor(lit, current))
  }, [lit, fixed])

  // La note en cours reste visible dans la frise.
  useEffect(() => {
    chips.current?.querySelector('[data-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [step, demo])

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])

  const keys = keyboardKeys(RANGES[range].from, RANGES[range].to)
  const whites = keys.filter((key) => !key.black)

  const press = (note: string) => {
    playNote(note)
    setPressed((current) => new Set(current).add(note))
    if (!melody || finished || demo !== null) return
    if (note === target) {
      setMiss(undefined)
      const next = step + 1
      setStep(next)
      if (next >= melody.notes.length) {
        haptics.success()
        track('melody_done', { melody: melody.title })
      } else haptics.selection()
    } else if (target) {
      haptics.impact('light')
      setMiss(`Presque ! Cherche le ${noteLabel(target)}.`)
    }
  }

  const release = (note: string) => {
    setPressed((current) => {
      if (!current.has(note)) return current
      const next = new Set(current)
      next.delete(note)
      return next
    })
  }

  const listen = () => {
    if (!melody) return
    haptics.impact('light')
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = melody.notes.map((note, index) =>
      window.setTimeout(() => {
        setDemo(index)
        playNote(note)
      }, index * 480),
    )
    timers.current.push(window.setTimeout(() => setDemo(null), melody.notes.length * 480 + 200))
  }

  const restart = () => {
    haptics.selection()
    setStep(0)
    setMiss(undefined)
  }

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

  return (
    <div className="flex flex-col gap-3">
      {melody && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate font-display text-17 font-extrabold tracking-tight text-ink">{melody.title}</span>
            <button
              type="button"
              onClick={listen}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill border-2 border-outline bg-card px-3 text-13 font-bold text-ink shadow-chip active:shadow-press"
            >
              <Ear size={15} strokeWidth={2.4} aria-hidden="true" />
              Écouter
            </button>
          </div>
          {/* La frise des notes : faites, à jouer, à venir. */}
          <ol ref={chips} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label={`Les notes de ${melody.title}`}>
            {melody.notes.map((note, index) => {
              const current = demo !== null ? index === demo : index === step
              const done = demo === null && index < step
              return (
                <li
                  key={index}
                  data-current={current}
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'flex h-8 min-w-11 shrink-0 items-center justify-center rounded-pill border-2 px-2 text-13 font-extrabold transition-colors duration-150',
                    current ? 'border-outline bg-accent text-on-color' : done ? 'border-transparent bg-good-soft text-good-ink' : 'border-outline/30 bg-card text-ink-soft',
                  )}
                >
                  {noteLabel(note)}
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {/* Graves ou médium : une octave à l'écran, assez large pour les doigts. */}
      {!fixed && (
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
                    'relative flex flex-col items-center justify-end rounded-b-[9px] rounded-t-[3px] pb-2 text-12 font-extrabold text-[#1d1a17] transition-[transform,background-color] duration-75',
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
        {finished && melody ? (
          <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-between gap-3" role="status">
            <span className="inline-flex items-center gap-2 text-14 font-extrabold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-pill border-2 border-outline bg-good text-on-color">
                <Check size={15} strokeWidth={3} aria-hidden="true" />
              </span>
              C’est joué, note pour note&nbsp;!
            </span>
            <button type="button" onClick={restart} className="inline-flex items-center gap-1 text-14 font-extrabold text-ink underline decoration-2 underline-offset-4">
              <RotateCcw size={14} strokeWidth={2.6} aria-hidden="true" />
              Rejouer
            </button>
          </motion.div>
        ) : melody ? (
          <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-13 font-semibold text-ink-soft" aria-live="polite">
            {miss ?? (target ? `Joue la touche qui s’allume : ${noteLabel(target)} (${step + 1}/${melody.notes.length}).` : '')}
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
