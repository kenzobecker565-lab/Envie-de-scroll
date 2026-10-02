import { ArrowRight, AudioWaveform, Check, Ear, Maximize2, RotateCcw, Smartphone, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { keyboardKeys, keyboardWindow, melodyParts, midiNumber, noteLabel, type Melody, type MelodyPart } from '@scroll-up/shared'
import { cn } from '@/lib/utils'
import { track } from '../api/client.ts'
import { playNote, type NoteHandle } from '../lib/pianoSound.ts'
import { useBackButtonOverlay } from '../telegram/buttons.ts'
import { enterFullscreen, exitFullscreen, haptics } from '../telegram/webApp.ts'

/**
 * Le clavier de l'appli : des touches qui sonnent dès qu'on les touche,
 * plusieurs doigts à la fois. Une touche tenue sonne tant qu'on la tient ;
 * la « Pédale » laisse résonner les notes même lâchées.
 *
 * Avec une mélodie, c'est un tuto patient :
 * - la partition en entier sous les yeux : toutes les notes de la partie, une
 *   ligne par phrase, pour lire le morceau tranquillement ;
 * - un morceau long s'apprend en plusieurs parties, l'une après l'autre ;
 * - la touche à jouer s'allume, on avance note après note, « Écouter » joue
 *   la partie en entier, une fausse note donne un indice ;
 * - le clavier montre juste ce qu'il faut de touches pour la partie.
 *
 * « Grand écran » ouvre le piano en plein écran, en paysage : un grand
 * clavier, la partition toujours au-dessus. Même morceau, même progression.
 * `onComplete` prévient quand toutes les parties sont jouées (l'activité ou
 * la leçon se valide ainsi).
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

const PEDAL_KEY = 'scroll-up:piano-pedal'

function readPedal(): boolean {
  try {
    return localStorage.getItem(PEDAL_KEY) === '1'
  } catch {
    return false
  }
}

/* ------------------------------ Le jeu en cours ----------------------------- */

/** Tout l'état d'un morceau au clavier, partagé entre le clavier de l'activité et le grand écran. */
function usePianoPlay(melody: Melody | undefined, onComplete: (() => void) | undefined) {
  const parts = useMemo(() => (melody ? melodyParts(melody) : []), [melody])
  const [part, setPart] = useState(0)
  const [step, setStep] = useState(0)
  const [cleared, setCleared] = useState<ReadonlySet<number>>(new Set())
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set())
  const [miss, setMiss] = useState<string>()
  const [demo, setDemo] = useState<number | null>(null)
  const [pedal, setPedalState] = useState(readPedal)
  const timers = useRef<number[]>([])
  const completed = useRef(false)
  // Les notes qui sonnent : tenues (par touche), ou lâchées mais gardées par la pédale.
  const held = useRef(new Map<string, NoteHandle>())
  const ringing = useRef(new Set<NoteHandle>())

  const current: MelodyPart | undefined = parts[part]
  const notes = current?.notes ?? []
  const partDone = Boolean(current && step >= notes.length)
  const allDone = parts.length > 0 && cleared.size === parts.length
  const target = current && !partDone ? notes[step] : undefined
  const lit = demo !== null ? notes[demo] : target
  // La partie suivante à apprendre : la première pas encore jouée.
  const nextPart = parts.findIndex((_, index) => !cleared.has(index) && index !== part)

  const stopDemo = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
    setDemo(null)
  }
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])

  /** Une note lâchée : elle s'étouffe, sauf avec la pédale (elle résonne alors jusqu'au bout). */
  const letGo = (handle: NoteHandle) => {
    if (pedal) ringing.current.add(handle)
    else handle.release()
  }

  const setPedal = (on: boolean) => {
    haptics.selection()
    setPedalState(on)
    try {
      localStorage.setItem(PEDAL_KEY, on ? '1' : '0')
    } catch {
      // Préférence non gardée : tant pis.
    }
    // On relève la pédale : les notes déjà lâchées s'étouffent, comme sur un vrai piano.
    if (!on) {
      ringing.current.forEach((handle) => handle.release())
      ringing.current.clear()
    }
  }

  const press = (note: string) => {
    const previous = held.current.get(note)
    if (previous) letGo(previous)
    held.current.set(note, playNote(note))
    setPressed((keys) => new Set(keys).add(note))
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
    const handle = held.current.get(note)
    if (handle) {
      held.current.delete(note)
      letGo(handle)
    }
    setPressed((keys) => {
      if (!keys.has(note)) return keys
      const next = new Set(keys)
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
        const handle = playNote(note)
        // Chaque note tient jusqu'à la suivante (et résonne avec la pédale).
        timers.current.push(window.setTimeout(() => letGo(handle), 450))
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
      if (!event.repeat) press(note)
    },
    onKeyUp: (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') release(note)
    },
  })

  return { melody, parts, part, current, notes, step, partDone, allDone, target, lit, demo, miss, cleared, nextPart, pressed, pedal, setPedal, listen, goTo, keyProps }
}

type PianoPlay = ReturnType<typeof usePianoPlay>

/* -------------------------------- Le clavier -------------------------------- */

export function PianoKeyboard({ melody, onComplete }: { melody?: Melody; onComplete?: () => void }) {
  const play = usePianoPlay(melody, onComplete)
  const [stage, setStage] = useState(false)
  const [range, setRange] = useState<Range>(melody?.notes[0] ? rangeFor(melody.notes[0], 'mid') : 'mid')
  // Juste les touches qu'il faut pour la partie ; sinon une octave, graves ou médium.
  const portion = useMemo(() => (play.current ? keyboardWindow(play.current.notes) : null), [play.current])

  // Sans portion fixe, la touche à jouer doit être à l'écran : on passe aux graves ou au médium.
  useEffect(() => {
    if (!play.lit || portion) return
    setRange((previous) => rangeFor(play.lit as string, previous))
  }, [play.lit, portion])

  const openStage = () => {
    haptics.impact('medium')
    track('piano_stage', { melody: melody?.title ?? 'libre' })
    setStage(true)
  }

  return (
    <div className="flex flex-col gap-3">
      {melody && play.current && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 font-display text-17 leading-tight font-extrabold tracking-tight text-ink">{melody.title}</span>
            <ListenButton onClick={play.listen} />
          </div>
          {play.parts.length > 1 && <PartPills play={play} />}
          <NotesSheet play={play} />
        </div>
      )}

      {/* Les réglages du clavier : graves ou médium (si besoin), la pédale, le grand écran. */}
      <div className="flex flex-wrap items-center gap-2">
        {!portion && (
          <div className="flex gap-1 rounded-pill border-2 border-outline bg-card p-1" role="group" aria-label="Partie du clavier">
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
        <PedalButton play={play} />
        <button
          type="button"
          onClick={openStage}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-pill border-2 border-outline bg-ink px-3 text-13 font-extrabold text-canvas shadow-chip active:shadow-press"
        >
          <Maximize2 size={15} strokeWidth={2.6} aria-hidden="true" />
          Grand écran
        </button>
      </div>

      <div className="h-44">
        <Keys play={play} from={portion?.from ?? RANGES[range].from} to={portion?.to ?? RANGES[range].to} />
      </div>

      <Status play={play} />

      {stage && createPortal(<PianoStage play={play} onClose={() => setStage(false)} />, document.body)}
    </div>
  )
}

/* ----------------------------- Le grand écran ------------------------------ */

/** La taille de l'écran, à jour quand on tourne le téléphone. */
function useViewport(): { width: number; height: number } {
  const read = () => ({ width: window.innerWidth, height: window.innerHeight })
  const [size, setSize] = useState(read)
  useEffect(() => {
    const update = () => setSize(read())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])
  return size
}

/** Une marge sûre (encoche, boutons de Telegram en plein écran) sur un bord de l'écran. */
const inset = (side: 'top' | 'right' | 'bottom' | 'left') =>
  `calc(max(env(safe-area-inset-${side}, 0px), var(--tg-safe-area-inset-${side}, 0px)) + var(--tg-content-safe-area-inset-${side}, 0px) + 10px)`

/**
 * Le piano en plein écran, en paysage. Téléphone tenu en hauteur (ou rotation
 * bloquée) : l'écran s'affiche déjà tourné, il suffit de pivoter le téléphone.
 * Le retour de Telegram, la croix ou Échap le referment.
 */
function PianoStage({ play, onClose }: { play: PianoPlay; onClose: () => void }) {
  const { width, height } = useViewport()
  const landscape = width >= height
  useBackButtonOverlay(onClose)
  const close = useRef(onClose)
  close.current = onClose

  // Une seule fois à l'ouverture : plein écran Telegram, page figée derrière, Échap pour sortir.
  useEffect(() => {
    enterFullscreen()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close.current()
    window.addEventListener('keydown', onKey)
    return () => {
      exitFullscreen()
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // En hauteur, on tourne l'écran d'un quart de tour : le haut du piano est à droite du téléphone.
  const frame: React.CSSProperties = landscape
    ? { inset: 0, paddingTop: inset('top'), paddingRight: inset('right'), paddingBottom: inset('bottom'), paddingLeft: inset('left') }
    : {
        top: 0,
        left: 0,
        width: height,
        height: width,
        transform: `translateX(${width}px) rotate(90deg)`,
        transformOrigin: 'top left',
        paddingTop: inset('right'),
        paddingRight: inset('bottom'),
        paddingBottom: inset('left'),
        paddingLeft: inset('top'),
      }
  // Plus large qu'en hauteur : au moins une octave et demie, jusqu'à deux octaves.
  const portion = (play.current ? keyboardWindow(play.current.notes, 12, 15) : null) ?? { from: 'C3', to: 'C5' }

  return (
    <div className="fixed z-[60] flex flex-col gap-2 bg-canvas" style={frame} role="dialog" aria-modal="true" aria-label="Le piano en grand écran">
      <motion.div className="flex min-h-0 flex-1 flex-col gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le grand écran"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border-2 border-outline bg-card text-ink shadow-chip active:shadow-press"
          >
            <X size={18} strokeWidth={2.6} aria-hidden="true" />
          </button>
          <span className="min-w-0 truncate font-display text-17 font-extrabold tracking-tight text-ink">{play.melody?.title ?? 'Joue librement'}</span>
          {play.parts.length > 1 && <PartPills play={play} compact />}
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {!landscape && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-surface-200 px-2 py-1 text-12 font-bold text-ink-soft">
                <Smartphone size={14} strokeWidth={2.4} className="-rotate-90" aria-hidden="true" />
                Tourne ton téléphone
              </span>
            )}
            <PedalButton play={play} />
            {play.melody && <ListenButton onClick={play.listen} />}
          </span>
        </div>
        {play.melody && play.current && <NotesSheet play={play} strip />}
        <Status play={play} onDone={onClose} />
        <div className="min-h-0 flex-1">
          <Keys play={play} from={portion.from} to={portion.to} large />
        </div>
      </motion.div>
    </div>
  )
}

/* ------------------------------ Les morceaux ------------------------------- */

function ListenButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill border-2 border-outline bg-card px-3 text-13 font-bold text-ink shadow-chip active:shadow-press"
    >
      <Ear size={15} strokeWidth={2.4} aria-hidden="true" />
      Écouter
    </button>
  )
}

/** La pédale de droite : les notes lâchées résonnent jusqu'au bout. */
function PedalButton({ play }: { play: PianoPlay }) {
  return (
    <button
      type="button"
      onClick={() => play.setPedal(!play.pedal)}
      aria-pressed={play.pedal}
      title="Laisser résonner les notes"
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill border-2 border-outline px-3 text-13 font-bold shadow-chip transition-colors duration-150 active:shadow-press',
        play.pedal ? 'bg-good text-on-color' : 'bg-card text-ink',
      )}
    >
      <AudioWaveform size={15} strokeWidth={2.4} aria-hidden="true" />
      {play.pedal ? 'Pédale ✓' : 'Pédale'}
    </button>
  )
}

/** Les parties d'apprentissage : une à la fois, dans l'ordre qu'on veut. */
function PartPills({ play, compact = false }: { play: PianoPlay; compact?: boolean }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', compact && 'shrink-0 flex-nowrap')} role="tablist" aria-label="Les parties du morceau">
      {!compact && <span className="mr-1 text-12 font-extrabold tracking-wider text-ink-soft uppercase">Partie</span>}
      {play.parts.map((_, index) => (
        <button
          key={index}
          type="button"
          role="tab"
          aria-selected={index === play.part}
          aria-label={`Partie ${index + 1}${play.cleared.has(index) ? ', réussie' : ''}`}
          onClick={() => play.goTo(index)}
          className={cn(
            'relative flex h-9 min-w-9 items-center justify-center rounded-pill border-2 px-2 font-numbers text-14 font-extrabold transition-colors duration-150',
            index === play.part ? 'border-outline bg-ink text-canvas' : play.cleared.has(index) ? 'border-outline bg-good text-on-color' : 'border-outline/40 bg-card text-ink-soft',
          )}
        >
          {play.cleared.has(index) && index !== play.part ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : index + 1}
        </button>
      ))}
      {!compact && <span className="ml-auto text-12 font-bold text-ink-soft">{play.parts.length} parties</span>}
    </div>
  )
}

/**
 * La partition : toutes les notes de la partie d'un coup. Une ligne par
 * phrase ; en grand écran (`strip`), les phrases se suivent, séparées d'un
 * trait, pour laisser la hauteur au clavier.
 */
function NotesSheet({ play, strip = false }: { play: PianoPlay; strip?: boolean }) {
  if (!play.current || !play.melody) return null
  let offset = 0
  const chip = (note: string, index: number) => {
    const now = play.demo !== null ? index === play.demo : index === play.step
    const done = play.demo === null && index < play.step
    return (
      <li
        key={index}
        aria-current={now ? 'step' : undefined}
        className={cn(
          'flex items-center justify-center rounded-pill border-2 font-extrabold transition-colors duration-150',
          strip ? 'h-8 min-w-9 px-1 text-12' : 'h-9 min-w-10 px-1.5 text-13',
          now ? 'border-outline bg-accent text-on-color' : done ? 'border-transparent bg-good-soft text-good-ink' : 'border-outline/30 bg-card text-ink',
        )}
      >
        {noteLabel(note)}
      </li>
    )
  }
  return (
    <div
      className={cn('rounded-md border-2 border-outline/25 bg-canvas', strip ? 'flex flex-wrap items-center gap-x-1 gap-y-1.5 p-2' : 'flex flex-col gap-2 p-2.5')}
      aria-label={`Les notes de ${play.melody.title}${play.parts.length > 1 ? `, partie ${play.part + 1}` : ''}`}
      role="group"
    >
      {play.current.phrases.map((phrase, phraseIndex) => {
        const start = offset
        offset += phrase.length
        return (
          <ol key={`${play.part}-${phraseIndex}`} className={cn('flex flex-wrap gap-1', !strip && 'gap-1.5', strip && phraseIndex > 0 && 'border-l-2 border-outline/30 pl-1.5')}>
            {phrase.map((note, noteIndex) => chip(note, start + noteIndex))}
          </ol>
        )
      })}
    </div>
  )
}

/** Ce qu'il faut faire maintenant : la touche à jouer, une partie réussie, le morceau joué. */
function Status({ play, onDone }: { play: PianoPlay; onDone?: () => void }) {
  if (!play.melody) {
    return <p className="text-13 font-semibold text-ink-soft">Joue librement. Le point marque le do central, le repère des deux mains.</p>
  }
  return (
    <AnimatePresence mode="wait" initial={false}>
      {play.partDone && play.allDone ? (
        <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-between gap-3" role="status">
          <span className="inline-flex items-center gap-2 text-14 font-extrabold text-ink">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border-2 border-outline bg-good text-on-color">
              <Check size={15} strokeWidth={3} aria-hidden="true" />
            </span>
            {play.parts.length > 1 ? 'Tout le morceau est joué !' : 'C’est joué, note pour note !'}
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <button type="button" onClick={() => play.goTo(0)} className="inline-flex items-center gap-1 text-14 font-extrabold text-ink underline decoration-2 underline-offset-4">
              <RotateCcw size={14} strokeWidth={2.6} aria-hidden="true" />
              Rejouer
            </button>
            {onDone && (
              <button
                type="button"
                onClick={onDone}
                className="inline-flex h-9 items-center gap-1.5 rounded-pill border-2 border-outline bg-good px-3 text-13 font-extrabold text-on-color shadow-chip active:shadow-press"
              >
                <Check size={15} strokeWidth={2.8} aria-hidden="true" />
                Revenir valider
              </button>
            )}
          </span>
        </motion.div>
      ) : play.partDone ? (
        <motion.div key={`part-${play.part}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-between gap-3" role="status">
          <span className="inline-flex items-center gap-2 text-14 font-extrabold text-ink">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border-2 border-outline bg-good text-on-color">
              <Check size={15} strokeWidth={3} aria-hidden="true" />
            </span>
            Partie {play.part + 1} réussie&nbsp;!
          </span>
          <button
            type="button"
            onClick={() => play.goTo(Math.max(play.nextPart, 0))}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-pill border-2 border-outline bg-accent px-3 text-14 font-extrabold text-on-color shadow-chip active:shadow-press"
          >
            Partie {Math.max(play.nextPart, 0) + 1}
            <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </motion.div>
      ) : (
        <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-13 font-semibold text-ink-soft" aria-live="polite">
          {play.miss ?? (play.target ? `Joue la touche qui s’allume : ${noteLabel(play.target)} (${play.step + 1}/${play.notes.length}).` : '')}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

/** Les touches, de `from` à `to` : blanches en grille, noires à cheval entre deux blanches. */
function Keys({ play, from, to, large = false }: { play: PianoPlay; from: string; to: string; large?: boolean }) {
  const keys = keyboardKeys(from, to)
  const whites = keys.filter((key) => !key.black)
  return (
    <div className="relative h-full rounded-md border-[2.5px] border-outline bg-[#1d1a17] p-1.5 shadow-card select-none" style={{ touchAction: 'none' }}>
      <div className="relative h-full">
        <div className="grid h-full gap-1" style={{ gridTemplateColumns: `repeat(${whites.length}, minmax(0, 1fr))` }}>
          {whites.map((key) => {
            const isTarget = key.note === play.lit
            const down = play.pressed.has(key.note)
            return (
              <button
                key={key.note}
                type="button"
                aria-label={`${noteLabel(key.note)}${key.note === 'C4' ? ', do central' : ''}`}
                {...play.keyProps(key.note)}
                className={cn(
                  'relative flex flex-col items-center justify-end rounded-b-[9px] rounded-t-[3px] pb-2 font-extrabold text-[#1d1a17] transition-[transform,background-color] duration-75',
                  large ? 'text-14' : whites.length > 10 ? 'text-11' : 'text-12',
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
          const isTarget = key.note === play.lit
          const down = play.pressed.has(key.note)
          return (
            <button
              key={key.note}
              type="button"
              aria-label={noteLabel(key.note).replace('♯', ' dièse')}
              {...play.keyProps(key.note)}
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
  )
}
