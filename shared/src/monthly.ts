/**
 * ============================================================================
 *  LE MOT DU JOUR : un défi par mois
 * ============================================================================
 *
 * Chaque jour, un mot, à dessiner ou à écrire (15 min). Chaque mois a son
 * thème (octobre : frissons doux ; novembre : cocon ; décembre : lumières
 * d'hiver) ; les autres mois, le mot est tiré dans la liste générale.
 *
 * Pas de calendrier ni de jour « raté » : les mots passés du mois se
 * rattrapent quand on veut, et on compte seulement ceux qu'on a faits.
 *
 * Un mot se joue comme une activité ; son identifiant est
 * `defi-<passion>-<AAAA-MM-JJ>` (ex. `defi-dessin-2026-10-01`).
 *
 * ⚠️ Ces textes ne font pas partie du contenu validé : à relire librement.
 */

import { sample, WORDS } from './prompts.ts'
import { frenchTypography } from './typography.ts'
import type { Activity, Duration, PassionId } from './types.ts'

/** Le mot du jour se dessine ou s'écrit. */
export const CHALLENGE_PASSIONS = ['dessin', 'ecriture'] as const satisfies readonly PassionId[]
export type ChallengePassion = (typeof CHALLENGE_PASSIONS)[number]
export const CHALLENGE_DURATION: Duration = 15

interface MonthTheme {
  /** « Octobre des frissons doux ». */
  title: string
  /** Un mot par jour (le 1er, le 2…). */
  words: readonly string[]
}

/** Les thèmes, par numéro de mois (1 = janvier). */
const THEMES: Partial<Record<number, MonthTheme>> = {
  10: {
    title: 'Octobre des frissons doux',
    words: [
      'lanterne', 'chat noir', 'brume', 'citrouille', 'vieille clé', 'corbeau', 'feuille morte', 'grenier', 'bougie', 'toile d\'araignée',
      'forêt', 'masque', 'fantôme timide', 'champignon', 'potion', 'manoir', 'hibou', 'pleine lune', 'squelette qui danse', 'sorcière',
      'chaudron', 'épouvantail', 'chauve-souris', 'bonbon', 'miroir', 'porte grinçante', 'orage', 'malle mystérieuse', 'monstre gentil', 'balai volant',
      'déguisement',
    ],
  },
  11: {
    title: 'Novembre cocon',
    words: [
      'plaid', 'tasse fumante', 'pluie', 'parapluie', 'pull trop grand', 'châtaigne', 'fenêtre embuée', 'livre ouvert', 'chaussettes', 'soupe',
      'bibliothèque', 'brouillard', 'écharpe', 'feu de cheminée', 'ours', 'cabane', 'théière', 'photo souvenir', 'lampe de chevet', 'gants',
      'marché', 'flaque', 'train de nuit', 'carnet', 'hérisson', 'puzzle', 'bottes', 'pain chaud', 'radio', 'sieste',
    ],
  },
  12: {
    title: 'Décembre des lumières',
    words: [
      'flocon', 'guirlande', 'sapin', 'bonnet', 'traîneau', 'étoile', 'chocolat chaud', 'renne', 'igloo', 'patins à glace',
      'cadeau', 'boule à neige', 'pingouin', 'montagne', 'luge', 'lettre', 'pain d\'épices', 'bonhomme de neige', 'nuit étoilée', 'marché de Noël',
      'moufles', 'lutin', 'gâteau', 'feu d\'artifice', 'horloge', 'confettis', 'carillon', 'ours polaire', 'aurore boréale', 'vœu',
      'minuit',
    ],
  },
}

const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/** Petit hasard reproductible (le mot d'un jour sans thème est toujours le même). */
function dayRandom(seed: string): () => number {
  let state = 0
  for (let index = 0; index < seed.length; index++) state = (Math.imul(31, state) + seed.charCodeAt(index)) | 0
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) | 0
    return ((state >>> 8) & 0xffffff) / 0x1000000
  }
}

/** « 2026-10-01 » → le thème du mois et le mot du jour. */
export function dailyWord(day: string): { word: string; theme: string; month: string } {
  const [, monthText, dayText] = day.split('-')
  const month = Number(monthText)
  const dayOfMonth = Number(dayText)
  const theme = THEMES[month]
  const word = theme?.words[dayOfMonth - 1] ?? sample(WORDS, 1, dayRandom(day))[0] ?? 'lanterne'
  return { word: frenchTypography(word), theme: theme?.title ?? `Le mot du jour de ${MONTH_NAMES[month - 1] ?? 'ce mois'}`, month: day.slice(0, 7) }
}

const CHALLENGE_ID = /^defi-(dessin|ecriture)-(\d{4}-\d{2}-\d{2})$/

export function challengeId(passion: ChallengePassion, day: string): string {
  return `defi-${passion}-${day}`
}

export function isChallengeId(id: string): boolean {
  return CHALLENGE_ID.test(id)
}

/** `defi-dessin-2026-10-01` → la passion et le jour. */
export function parseChallengeId(id: string): { passion: ChallengePassion; day: string } | null {
  const match = CHALLENGE_ID.exec(id)
  if (!match) return null
  const [, passion, day] = match
  const date = new Date(`${day}T12:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day) return null
  return { passion: passion as ChallengePassion, day: day! }
}

export interface ChallengeActivity extends Activity {
  day: string
  word: string
  theme: string
}

/** Le mot du jour, joué comme une activité. */
export function getChallengeActivity(id: string): ChallengeActivity | undefined {
  const parsed = parseChallengeId(id)
  if (!parsed) return undefined
  const { word, theme } = dailyWord(parsed.day)
  const text =
    parsed.passion === 'dessin'
      ? `Le mot du jour : "${word}". Dessine-le comme tu le vois, à ta façon.`
      : `Le mot du jour : "${word}". Écris une petite histoire, un souvenir ou un poème autour de lui.`
  return { id, passion: parsed.passion, duration: CHALLENGE_DURATION, number: 0, text: frenchTypography(text), day: parsed.day, word, theme }
}

/** Les jours du mois jusqu'à aujourd'hui compris (`today` : « 2026-10-07 »), du plus récent au plus ancien. */
export function monthDaysUntil(today: string): string[] {
  const prefix = today.slice(0, 8)
  const last = Number(today.slice(8, 10))
  return Array.from({ length: last }, (_, index) => `${prefix}${String(last - index).padStart(2, '0')}`)
}

/** On peut jouer un mot du mois en cours, d'aujourd'hui ou d'avant (on rattrape quand on veut). */
export function canPlayChallenge(id: string, today: string): boolean {
  const parsed = parseChallengeId(id)
  return Boolean(parsed && parsed.day.slice(0, 7) === today.slice(0, 7) && parsed.day <= today)
}
