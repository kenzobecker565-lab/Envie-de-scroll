/**
 * Le son du clavier de l'appli : une note de piano synthétisée avec Web Audio
 * (une onde triangle et deux harmoniques douces, une attaque nette puis une
 * extinction courte), sans fichier à télécharger. Le contexte audio naît au
 * premier toucher, comme l'exigent les navigateurs (iPhone compris).
 *
 * Comme sur un vrai piano : la note sonne tant que la touche est tenue (elle
 * s'éteint doucement, en plusieurs secondes), puis s'étouffe quand on lâche
 * la touche, sauf si la pédale est enfoncée : elle résonne alors jusqu'au bout.
 */

import { noteFrequency } from '@scroll-up/shared'

let context: AudioContext | undefined
let master: GainNode | undefined

function audio(): { context: AudioContext; master: GainNode } | undefined {
  if (!context) {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Context) return undefined
    context = new Context()
    master = context.createGain()
    master.gain.value = 0.5
    master.connect(context.destination)
  }
  if (context.state === 'suspended') void context.resume().catch(() => {})
  return master ? { context, master } : undefined
}

/** Une note qui sonne : `release()` la laisse s'étouffer (la touche est lâchée, sans pédale). */
export interface NoteHandle {
  release(): void
}

const SILENT: NoteHandle = { release: () => {} }
/** Résonance maximale avec une touche tenue ou la pédale : 3 secondes. */
const RING_SECONDS = 3
/** Extinction naturelle plus courte pour éviter que les notes se superposent trop longtemps. */
const RING_DECAY = 0.65
/** Relâchement doux mais bref : les oscillateurs s'arrêtent après 360 ms. */
const DAMPER = 0.06

/** Joue une note (« C4 ») tout de suite. */
export function playNote(note: string): NoteHandle {
  const ready = audio()
  if (!ready) return SILENT
  const { context, master } = ready
  const frequency = noteFrequency(note)
  const now = context.currentTime

  const envelope = context.createGain()
  envelope.gain.setValueAtTime(0.0001, now)
  envelope.gain.exponentialRampToValueAtTime(0.6, now + 0.006)
  envelope.gain.exponentialRampToValueAtTime(0.26, now + 0.3)
  // Puis la longue extinction, tant que rien ne l'étouffe.
  envelope.gain.setTargetAtTime(0.0001, now + 0.3, RING_DECAY)

  // Un filtre qui adoucit les aigus, plus fermé pour les notes graves.
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = Math.min(6000, frequency * 6)
  filter.connect(envelope)
  envelope.connect(master)

  const oscillators: OscillatorNode[] = []
  const partials: [OscillatorType, number, number][] = [
    ['triangle', 1, 1],
    ['sine', 2, 0.3],
    ['sine', 3, 0.1],
  ]
  for (const [type, multiple, level] of partials) {
    const oscillator = context.createOscillator()
    oscillator.type = type
    oscillator.frequency.value = frequency * multiple
    const gain = context.createGain()
    gain.gain.value = level
    oscillator.connect(gain)
    gain.connect(filter)
    oscillator.start(now)
    oscillator.stop(now + RING_SECONDS)
    oscillators.push(oscillator)
  }

  let released = false
  return {
    release() {
      if (released) return
      released = true
      const at = context.currentTime
      // Annule aussi les étapes encore prévues si la touche est lâchée pendant l'attaque.
      // On garde le niveau courant pour éviter un clic, puis on étouffe rapidement la note.
      if (typeof envelope.gain.cancelAndHoldAtTime === 'function') {
        envelope.gain.cancelAndHoldAtTime(at)
      } else {
        const level = envelope.gain.value
        envelope.gain.cancelScheduledValues(at)
        envelope.gain.setValueAtTime(level, at)
      }
      envelope.gain.setTargetAtTime(0.0001, at, DAMPER)
      for (const oscillator of oscillators) {
        try {
          oscillator.stop(Math.min(now + RING_SECONDS, at + DAMPER * 6))
        } catch {
          // Déjà arrêté : rien à faire.
        }
      }
    },
  }
}
