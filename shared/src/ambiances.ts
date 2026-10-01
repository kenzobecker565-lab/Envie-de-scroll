/**
 * Les ambiances sonores de l'app : un style pour chaque goût, joué très doux
 * en fond. On le choisit dans les réglages (ou « Au hasard », un style différent
 * à chaque ouverture) ; on coupe le son d'un geste depuis l'accueil.
 *
 * Les fichiers sont dans app/public/music/ (préparés par
 * promo/ambiances/build.mjs) : 3 minutes au plus, tous au même volume.
 */

export const AMBIANCE_IDS = ['jazz', 'lofi', 'piano', 'bossa', 'acoustique', 'synthwave', '8bit', 'ambient', 'tropical', 'pluie'] as const
export type AmbianceId = (typeof AMBIANCE_IDS)[number]

/** Le choix dans les réglages : un style, ou « au hasard ». */
export type AmbianceChoice = AmbianceId | 'hasard'

export interface Ambiance {
  id: AmbianceId
  label: string
  /** Une phrase courte, sous le nom. */
  mood: string
  /** Chemin du fichier, servi par l'app. */
  src: string
  /** Couleur du sticker. */
  tone: 'accent' | 'warm' | 'good' | 'sky' | 'lilac'
  /** Le morceau d'origine, à créditer (licence Creative Commons BY 4.0) ; null : création de Scroll-up. */
  credit: { title: string; author: string } | null
}

const MACLEOD = 'Kevin MacLeod'

export const AMBIANCES: readonly Ambiance[] = [
  { id: 'jazz', label: 'Jazz noir', mood: 'Un club enfumé, tard le soir', src: '/music/jazz-noir.mp3', tone: 'lilac', credit: null },
  { id: 'lofi', label: 'Lo-fi', mood: 'Un beat tranquille pour se poser', src: '/music/lofi.mp3', tone: 'sky', credit: { title: 'Study and Relax', author: MACLEOD } },
  { id: 'piano', label: 'Piano', mood: 'Satie, doux et lent', src: '/music/piano.mp3', tone: 'warm', credit: { title: 'Gymnopédie n°\u00A01 (Erik Satie)', author: MACLEOD } },
  { id: 'bossa', label: 'Bossa nova', mood: 'Guitare, plage et soleil', src: '/music/bossa.mp3', tone: 'warm', credit: { title: 'Bossa Antigua', author: MACLEOD } },
  { id: 'acoustique', label: 'Acoustique', mood: 'Des guitares en plein air', src: '/music/acoustique.mp3', tone: 'good', credit: { title: 'Almost Bliss', author: MACLEOD } },
  { id: 'synthwave', label: 'Synthwave', mood: 'Les néons des années 80', src: '/music/synthwave.mp3', tone: 'accent', credit: { title: 'Chill Wave', author: MACLEOD } },
  { id: '8bit', label: '8-bit', mood: 'Un jeu vidéo, tout en douceur', src: '/music/8bit.mp3', tone: 'good', credit: { title: 'Airship Serenity', author: MACLEOD } },
  { id: 'ambient', label: 'Ambient', mood: 'Des nappes pour flotter', src: '/music/ambient.mp3', tone: 'lilac', credit: { title: 'Equatorial Complex', author: MACLEOD } },
  { id: 'tropical', label: 'Tropical', mood: 'Steel drum et marimba', src: '/music/tropical.mp3', tone: 'accent', credit: { title: 'Moonlight Beach', author: MACLEOD } },
  { id: 'pluie', label: 'Pluie', mood: 'Juste la pluie, sans musique', src: '/music/pluie.mp3', tone: 'sky', credit: null },
]

export const DEFAULT_AMBIANCE: AmbianceId = 'jazz'

export function isAmbianceId(value: unknown): value is AmbianceId {
  return AMBIANCE_IDS.includes(value as AmbianceId)
}

export function isAmbianceChoice(value: unknown): value is AmbianceChoice {
  return value === 'hasard' || isAmbianceId(value)
}

const BY_ID = new Map(AMBIANCES.map((ambiance) => [ambiance.id, ambiance]))

export function getAmbiance(id: AmbianceId): Ambiance {
  const ambiance = BY_ID.get(id)
  if (!ambiance) throw new Error(`Ambiance inconnue : ${id}`)
  return ambiance
}

/**
 * Le style à jouer pour un choix : le style lui-même, ou, pour « au hasard »,
 * un autre que `current` (`random` : nombre entre 0 et 1).
 */
export function resolveAmbiance(choice: AmbianceChoice, current: AmbianceId | null = null, random: number = Math.random()): AmbianceId {
  if (choice !== 'hasard') return choice
  const pool = AMBIANCE_IDS.filter((id) => id !== current)
  return pool[Math.min(pool.length - 1, Math.floor(random * pool.length))] ?? DEFAULT_AMBIANCE
}

/** La ligne de crédits des morceaux sous licence (titres, auteur, source, licence). */
export function ambianceCredits(): string {
  const titles = AMBIANCES.filter((ambiance) => ambiance.credit).map((ambiance) => `«\u00A0${ambiance.credit?.title}\u00A0»`)
  return `${titles.join(', ')}\u00A0: ${MACLEOD} (incompetech.com), licence CC BY 4.0, extraits raccourcis et mis au même volume. Jazz noir et pluie\u00A0: créés pour Scroll-up.`
}
