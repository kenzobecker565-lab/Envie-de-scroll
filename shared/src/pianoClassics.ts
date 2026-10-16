import { melody, type Melody } from './keyboard.ts'

/** Adaptations monodiques Scroll-up de thèmes du domaine public. Aucun enregistrement tiers. */
export interface PianoClassic {
  id: string
  title: string
  composer: string
  notation: string
  /** Durée d'une note, en secondes, pour l'aperçu synthétisé. */
  spacing: number
  rhythm?: readonly number[]
  source: string
}
export const PIANO_CLASSICS: readonly PianoClassic[] = [
  {
    id: 'piano-elise', title: 'Lettre à Élise', composer: 'Ludwig van Beethoven', spacing: .28,
    notation: 'E5 D#5 E5 D#5 E5 B4 D5 C5 A4 | C4 E4 A4 B4 | E4 G#4 B4 C5 || E5 D#5 E5 D#5 E5 B4 D5 C5 A4 | C4 E4 A4 B4 | E4 C5 B4 A4 || B4 C5 D5 E5 | G4 F5 E5 D5 | F4 E5 D5 C5 | E4 D5 C5 B4 || E5 D#5 E5 D#5 E5 B4 D5 C5 A4 | C4 E4 A4 B4 | E4 C5 B4 A4',
    source: 'https://imslp.org/wiki/F%C3%BCr_Elise%2C_WoO_59_(Beethoven%2C_Ludwig_van)',
  },
  {
    id: 'piano-joie', title: 'Ode à la joie', composer: 'Ludwig van Beethoven', spacing: .38,
    notation: 'E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4 D4 D4 || E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4 C4 C4 || D4 D4 E4 C4 | D4 E4 F4 E4 C4 | D4 E4 F4 E4 D4 | C4 D4 G3 || E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4 C4 C4',
    source: 'https://imslp.org/wiki/Symphony_No.9%2C_Op.125_(Beethoven%2C_Ludwig_van)',
  },
  {
    id: 'piano-moonlight', title: 'Sonate au clair de lune', composer: 'Ludwig van Beethoven', spacing: .43,
    notation: 'G#3 C#4 E4 G#3 C#4 E4 | G#3 C#4 E4 G#3 C#4 E4 || G#3 C#4 E4 G#3 C#4 E4 | G#3 C#4 E4 G#3 C#4 E4 || A3 C#4 E4 A3 C#4 E4 | A3 D4 F#4 A3 D4 F#4 || G#3 B3 F#4 G#3 C4 F#4 | G#3 C#4 E4 G#3 B3 D4',
    source: 'https://imslp.org/wiki/Piano_Sonata_No.14%2C_Op.27_No.2_(Beethoven%2C_Ludwig_van)',
  },
  {
    id: 'piano-canon', title: 'Canon de Pachelbel', composer: 'Johann Pachelbel', spacing: .48,
    notation: 'F#4 E4 D4 C#4 | B3 A3 B3 C#4 || D4 C#4 B3 A3 | G3 F#3 G3 E3 || F#3 A3 D4 C#4 | B3 D4 F#4 G4 || A4 G4 F#4 E4 | D4 C#4 B3 A3',
    source: 'https://imslp.org/wiki/Canon_and_Gigue_in_D_major%2C_P.37_(Pachelbel%2C_Johann)',
  },
  {
    id: 'piano-bach-prelude', title: 'Prélude en do majeur', composer: 'Johann Sebastian Bach', spacing: .24,
    notation: 'C4 E4 G4 C5 E5 G4 C5 E5 | C4 E4 G4 C5 E5 G4 C5 E5 || C4 D4 A4 D5 F5 A4 D5 F5 | C4 D4 A4 D5 F5 A4 D5 F5 || B3 D4 G4 D5 F5 G4 D5 F5 | B3 D4 G4 D5 F5 G4 D5 F5 || C4 E4 G4 C5 E5 G4 C5 E5 | C4 E4 G4 C5 E5 G4 C5 E5',
    source: 'https://imslp.org/wiki/Prelude_and_Fugue_in_C_major%2C_BWV_846_(Bach%2C_Johann_Sebastian)',
  },
  {
    id: 'piano-gymnopedie', title: 'Gymnopédie nº 1', composer: 'Erik Satie', spacing: .52,
    notation: 'F#4 A4 G4 F#4 C#4 B3 C#4 D4 | A3 G3 F#3 A3 G3 F#3 C#4 B3 || F#4 A4 G4 F#4 C#4 B3 C#4 D4 | A3 G3 F#3 A3 G3 F#3 C#4 B3',
    rhythm: [1,1,1,1,1,1,1,5,1,1,1,1,1,1,1,5],
    source: 'https://imslp.org/wiki/3_Gymnop%C3%A9dies_(Satie%2C_Erik)',
  },
]
export const CLASSIC_MELODIES: Readonly<Record<string, Melody>> = Object.fromEntries(PIANO_CLASSICS.map((piece) => [piece.id, melody(piece.title, piece.notation)]))
