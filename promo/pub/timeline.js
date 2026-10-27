/**
 * Grille de temps de la pub « pub » (≈ 28 s), partagée par l'image et le son.
 *
 * - La voix off (vidIQ / ElevenLabs) démarre à VO_START.
 * - La musique (126 BPM) est décalée pour que son drop (entrée de la basse, à
 *   11,19 s dans le morceau) tombe pile sur « plutôt » de « Voici Plutôt Que
 *   Scroller » : la révélation de la marque.
 * - Les coupes et les effets tombent sur les temps de la musique (beatAt).
 */

export const WIDTH = 1080
export const HEIGHT = 1920
export const FPS = 60
export const DURATION = 28

export const VO_START = 0.25
export const TEMPO = 126.05
export const BEAT = 60 / TEMPO
export const DROP = VO_START + 7.18 // « plutôt » (attaque du p)
export const MUSIC_DROP = 11.17 // position du drop dans le morceau (attaque du premier temps)
export const MUSIC_OFFSET = MUSIC_DROP - DROP // temps musique = temps pub + MUSIC_OFFSET

/** Instant du temps n de la musique (n = 0 : le drop ; négatif avant). */
export const beatAt = (n) => DROP + n * BEAT
/** Instant d'un mot de la voix off (temps mesuré dans le fichier de voix). */
export const vo = (t) => VO_START + t

/** Instants clés, partagés par l'image (main.js) et le son (audio.mjs). */
export const T = {
  // 1 · l'accroche : le fil défile, la notification, l'arrêt net
  notif: vo(1.52),
  counter: beatAt(-10), // le temps d'écran s'emballe jusqu'à l'arrêt
  freeze: beatAt(-8),
  // 2 · le bouton ; la musique revient, étouffée, et s'ouvre jusqu'au drop
  musicBack: beatAt(-4),
  tapBtn: beatAt(-1),
  // 3 · le logo
  strike: vo(7.56),
  // 4 · la démo dans le téléphone
  phoneIn: beatAt(3),
  taps: [beatAt(4), beatAt(6), beatAt(8), beatAt(9.5)],
  screens: [beatAt(5), beatAt(7), beatAt(9), beatAt(10)],
  cardPop: beatAt(12),
  chip: vo(13.64),
  whip: beatAt(16) - 0.22,
  // 5 · les vraies vidéos (sur « dessin, musique, cuisine, sport »), la grille, le minuteur
  cuts: [beatAt(16), beatAt(17.5), beatAt(19), beatAt(20.5)],
  grid: beatAt(22),
  nums: [vo(17.68), vo(18.2), vo(18.8)],
  minutes: vo(19.08),
  // 6 · la progression
  progress: beatAt(26),
  progScreen: beatAt(28),
  stTransformed: vo(20.76),
  stStreak: vo(21.74),
  streakBump: vo(22.28),
  // 7 · la signature et l'appel à l'action
  end: beatAt(33),
  endLogo: vo(23.43),
  endStrike: vo(23.92),
  cta: beatAt(40),
  sting: beatAt(41), // dernier coup, juste après la voix
}

/**
 * Les balayages du fil, de plus en plus rapides. Le doigt se pose et tire la
 * vidéo (`pull` px, pendant `drag` s), puis lâche sur le temps de la musique
 * (`t`) : la vidéo suivante se cale en décélérant (`snap` s).
 */
export const SWIPES = [
  { t: beatAt(-12), drag: 0.24, pull: 210, snap: 0.32 },
  { t: beatAt(-10), drag: 0.12, pull: 140, snap: 0.21 },
  { t: beatAt(-9.5), drag: 0.085, pull: 110, snap: 0.17 },
  { t: beatAt(-9), drag: 0.075, pull: 95, snap: 0.15 },
  { t: beatAt(-8.5), drag: 0.065, pull: 85, snap: 0.14 },
]

/**
 * Sous-titres, groupés par blocs de 1 à 3 mots (temps : début de chaque mot
 * dans la voix, mesurés par transcription Whisper puis vérifiés sur
 * l'enveloppe du son). « hi » : mots mis en
 * valeur. « at » : position (bas ou haut de l'écran).
 */
export const CAPTIONS = [
  { words: [['SI', 0.0], ['TU', 0.2], ['VOIS', 0.3]], at: 'low' },
  { words: [['CETTE', 0.44], ['VIDÉO…', 0.64]], at: 'low', hi: ['VIDÉO…'] },
  { words: [['C’EST', 1.52], ['QUE', 1.72], ['TU', 1.8]], at: 'low' },
  { words: [['SCROLLES', 1.94], ['ENCORE.', 2.28]], at: 'low', hi: ['ENCORE.'], until: 3.1 },
  { words: [['ET', 3.42], ['SI', 3.56], ['CETTE', 3.7], ['ENVIE', 3.94]], at: 'low', hi: ['ENVIE'] },
  { words: [['DEVENAIT', 4.12], ['UN', 4.46], ['TRUC', 4.54]], at: 'low' },
  { words: [['QUE', 4.7], ['T’AIMES', 4.92], ['VRAIMENT ?', 5.24]], at: 'low', hi: ['VRAIMENT ?'], until: 6.35 },
  { words: [['VOICI…', 6.7]], at: 'low', until: 7.02 },
  { words: [['UN', 8.66], ['BOUTON,', 8.8]], at: 'high', hi: ['BOUTON,'] },
  { words: [['TON', 9.64], ['HUMEUR,', 9.76]], at: 'high', hi: ['HUMEUR,'] },
  { words: [['ET', 10.74], ['L’APPLI', 10.8], ['TE', 11.1], ['PROPOSE', 11.22]], at: 'high' },
  { words: [['UNE', 11.64], ['ACTIVITÉ', 11.72], ['CRÉATIVE,', 12.2]], at: 'high', hi: ['CRÉATIVE,'] },
  { words: [['LIÉE', 13.14], ['À', 13.42], ['TA', 13.56], ['PASSION.', 13.64]], at: 'high', hi: ['PASSION.'], until: 14.35 },
  { words: [['ET', 20.17], ['CHAQUE', 20.28], ['ENVIE', 20.52]], at: 'high' },
  { words: [['TRANSFORMÉE', 20.76]], at: 'high', hi: ['TRANSFORMÉE'] },
  { words: [['FAIT', 21.61], ['GRIMPER', 21.74]], at: 'high' },
  { words: [['TA', 22.16], ['SÉRIE.', 22.28]], at: 'high', hi: ['SÉRIE.'], until: 23.0 },
  { words: [['TA', 24.62], ['PROCHAINE', 24.7], ['ENVIE,', 24.98]], at: 'end' },
  { words: [['FAIS-EN', 25.78], ['QUELQUE', 26.0], ['CHOSE.', 26.14]], at: 'end', hi: ['QUELQUE', 'CHOSE.'], until: DURATION - VO_START },
]
