/**
 * ============================================================================
 *  LE CLAVIER : notes, noms français, mélodies guidées
 * ============================================================================
 *
 * Les notes s'écrivent comme en anglais, avec l'octave : « C4 » est le do du
 * milieu du clavier (do central), « F#4 » le fa dièse juste au-dessus. À
 * l'écran, on les nomme à la française : Do, Ré, Mi, Fa, Sol, La, Si.
 *
 * Une mélodie guidée (activité ou étape de parcours) se joue sur le clavier
 * de l'appli quand on n'a pas de piano sous la main : la touche suivante
 * s'allume, et on avance note après note.
 */

/** Une suite de notes à jouer l'une après l'autre. */
export interface Melody {
  title: string
  notes: readonly string[]
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const FRENCH: Record<(typeof LETTERS)[number], string> = { C: 'Do', D: 'Ré', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' }
/** Demi-tons depuis do, pour chaque lettre. */
const SEMITONES: Record<(typeof LETTERS)[number], number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

const NOTE = /^([A-G])(#?)(\d)$/

export function isNote(value: string): boolean {
  return NOTE.test(value)
}

function parse(note: string): { letter: (typeof LETTERS)[number]; sharp: boolean; octave: number } {
  const match = NOTE.exec(note)
  if (!match) throw new Error(`Note inconnue : ${note}`)
  return { letter: match[1] as (typeof LETTERS)[number], sharp: match[2] === '#', octave: Number(match[3]) }
}

/** « F#4 » → « Fa♯ ». */
export function noteLabel(note: string): string {
  const { letter, sharp } = parse(note)
  return `${FRENCH[letter]}${sharp ? '♯' : ''}`
}

/** Numéro MIDI (do central = 60). */
export function midiNumber(note: string): number {
  const { letter, sharp, octave } = parse(note)
  return 12 * (octave + 1) + SEMITONES[letter] + (sharp ? 1 : 0)
}

/** Fréquence en hertz (la 440). */
export function noteFrequency(note: string): number {
  return 440 * 2 ** ((midiNumber(note) - 69) / 12)
}

export interface KeyboardKey {
  note: string
  black: boolean
}

/** Les touches du clavier de l'appli, de `from` à `to` inclus (deux octaves autour du do central). */
export function keyboardKeys(from = 'C3', to = 'C5'): KeyboardKey[] {
  const start = midiNumber(from)
  const end = midiNumber(to)
  const keys: KeyboardKey[] = []
  for (let midi = start; midi <= end; midi++) {
    const octave = Math.floor(midi / 12) - 1
    const step = midi % 12
    const letter = (Object.keys(SEMITONES) as (typeof LETTERS)[number][]).find((key) => SEMITONES[key] === step)
    if (letter) keys.push({ note: `${letter}${octave}`, black: false })
    else {
      const below = (Object.keys(SEMITONES) as (typeof LETTERS)[number][]).find((key) => SEMITONES[key] === step - 1)
      keys.push({ note: `${below}#${octave}`, black: true })
    }
  }
  return keys
}

/** Écrit une mélodie à partir d'une chaîne « C4 C4 C4 D4 E4 ». */
export function melody(title: string, notes: string): Melody {
  const list = notes.trim().split(/\s+/)
  for (const note of list) if (!isNote(note)) throw new Error(`Note inconnue dans « ${title} » : ${note}`)
  return { title, notes: list }
}
