/**
 * Le son du clavier de l'appli : une note de piano synthétisée avec Web Audio
 * (une onde triangle et deux harmoniques douces, une attaque nette puis une
 * longue extinction), sans fichier à télécharger. Le contexte audio naît au
 * premier toucher, comme l'exigent les navigateurs (iPhone compris).
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
    master.gain.value = 0.55
    master.connect(context.destination)
  }
  if (context.state === 'suspended') void context.resume().catch(() => {})
  return master ? { context, master } : undefined
}

/** Joue une note (« C4 ») tout de suite. */
export function playNote(note: string): void {
  const ready = audio()
  if (!ready) return
  const { context, master } = ready
  const frequency = noteFrequency(note)
  const now = context.currentTime
  const length = 1.8

  const envelope = context.createGain()
  envelope.gain.setValueAtTime(0.0001, now)
  envelope.gain.exponentialRampToValueAtTime(0.6, now + 0.006)
  envelope.gain.exponentialRampToValueAtTime(0.18, now + 0.25)
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + length)

  // Un filtre qui adoucit les aigus, plus fermé pour les notes graves.
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = Math.min(6000, frequency * 6)
  filter.connect(envelope)
  envelope.connect(master)

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
    oscillator.stop(now + length + 0.05)
  }
}
