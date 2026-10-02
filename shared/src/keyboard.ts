/**
 * ============================================================================
 *  LE CLAVIER : notes, noms français, mélodies guidées
 * ============================================================================
 *
 * Les notes s'écrivent comme en anglais, avec l'octave : « C4 » est le do du
 * milieu du clavier (do central), « F#4 » le fa dièse juste au-dessus. À
 * l'écran, on les nomme à la française : Do, Ré, Mi, Fa, Sol, La, Si.
 *
 * Une mélodie guidée (tuto de chanson ou leçon de parcours) se joue sur le
 * clavier de l'appli : la touche suivante s'allume, et on avance note après
 * note. Elle s'écrit phrase par phrase (« | » sépare les phrases) : chaque
 * phrase a sa ligne à l'écran, comme sur une partition, et une mélodie longue
 * s'apprend en plusieurs parties.
 */

/** Une suite de notes à jouer l'une après l'autre, rangées en phrases. */
export interface Melody {
  title: string
  /** Toutes les notes, dans l'ordre. */
  notes: readonly string[]
  /** Les phrases : une ligne chacune à l'écran. */
  phrases: readonly (readonly string[])[]
  /** Les parties d'apprentissage, si la notation les fixe (« || ») : l'indice de la première phrase de chacune. */
  partStarts?: readonly number[]
}

/** Sans parties fixées, au-delà de ce nombre de notes, une mélodie s'apprend en plusieurs parties. */
export const PART_MAX_NOTES = 28

/** Une partie d'apprentissage : quelques phrases, assez peu de notes pour tout voir d'un coup. */
export interface MelodyPart {
  phrases: readonly (readonly string[])[]
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

/** Rang d'une touche blanche (do0 = 0) ; une touche noire prend celui de la blanche juste en dessous. */
function whiteIndex(note: string): number {
  const { letter, octave } = parse(note)
  return octave * 7 + LETTERS.indexOf(letter)
}

function whiteNote(index: number): string {
  return `${LETTERS[((index % 7) + 7) % 7]}${Math.floor(index / 7)}`
}

/**
 * La portion de clavier à afficher pour jouer ces notes : au moins `min`
 * touches blanches (une octave), au plus `max`, centrée sur les notes. Une
 * touche noire demande ses deux voisines blanches. `null` si elles ne
 * tiennent pas (on passera alors d'une portion à l'autre).
 */
export function keyboardWindow(notes: readonly string[], min = 8, max = 12): { from: string; to: string } | null {
  if (!notes.length) return null
  let low = Infinity
  let high = -Infinity
  for (const note of notes) {
    const index = whiteIndex(note)
    low = Math.min(low, index)
    high = Math.max(high, parse(note).sharp ? index + 1 : index)
  }
  const span = high - low + 1
  if (span > max) return null
  const extra = Math.max(0, min - span)
  const start = low - Math.floor(extra / 2)
  return { from: whiteNote(start), to: whiteNote(start + Math.max(span, min) - 1) }
}

/**
 * Les parties d'apprentissage : celles fixées par la notation (« || »), sinon
 * les phrases regroupées, `max` notes au plus par partie (une phrase n'est
 * jamais coupée). Chaque partie tient en entier à l'écran.
 */
export function melodyParts(melody: Melody, max = PART_MAX_NOTES): MelodyPart[] {
  if (melody.partStarts?.length) {
    return melody.partStarts.map((start, index) => {
      const phrases = melody.phrases.slice(start, melody.partStarts?.[index + 1] ?? melody.phrases.length)
      return { phrases, notes: phrases.flat() }
    })
  }
  const parts: MelodyPart[] = []
  let phrases: (readonly string[])[] = []
  let count = 0
  for (const phrase of melody.phrases) {
    if (phrases.length && count + phrase.length > max) {
      parts.push({ phrases, notes: phrases.flat() })
      phrases = []
      count = 0
    }
    phrases.push(phrase)
    count += phrase.length
  }
  if (phrases.length) parts.push({ phrases, notes: phrases.flat() })
  return parts
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

/**
 * Écrit une mélodie à partir d'une chaîne « C4 C4 C4 D4 E4 D4 | C4 E4 D4 D4 C4 » :
 * « | » sépare les phrases, « || » les parties d'apprentissage.
 */
export function melody(title: string, notation: string): Melody {
  const phrases: string[][] = []
  const partStarts: number[] = []
  for (const part of notation.split('||')) {
    const partPhrases = part
      .split('|')
      .map((phrase) => phrase.trim().split(/\s+/).filter(Boolean))
      .filter((phrase) => phrase.length > 0)
    if (!partPhrases.length) continue
    partStarts.push(phrases.length)
    phrases.push(...partPhrases)
  }
  for (const note of phrases.flat()) if (!isNote(note)) throw new Error(`Note inconnue dans « ${title} » : ${note}`)
  return { title, notes: phrases.flat(), phrases, ...(partStarts.length > 1 ? { partStarts } : {}) }
}
