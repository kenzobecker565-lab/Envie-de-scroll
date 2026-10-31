/**
 * Repères temporels de la pub, partagés par l'animation (main.js) et la
 * bande-son (audio.mjs) : l'image et le son tombent exactement ensemble.
 *
 * Tempo 128 BPM : une mesure de 4 temps dure 1,875 s, donc 15 s = 8 mesures.
 */

export const WIDTH = 1080
export const HEIGHT = 1920
export const FPS = 60
export const DURATION = 15

export const BPM = 128
export const BEAT = 60 / BPM // 0,46875 s
export const BAR = 4 * BEAT // 1,875 s

/** Instant du temps n (peut être fractionnaire : 2.5 = la croche après le 3e temps). */
export const beat = (n) => n * BEAT

export const T = {
  // Mesures 1-2 : le scroll sans fin
  hook: 0.04, // « Tu scrolles. »
  flicks: [0.25, 1, 2, 2.75, 3.25, 3.625].map(beat), // coups de pouce sur le fil
  encore: beat(2), // « Encore. »
  encoreScroll: beat(3), // le mot lui-même se fait scroller
  stop: beat(4), // arrêt net
  button: beat(4) + 0.05, // le bouton « J'ai envie de scroller »
  question: beat(4.5), // « Cette envie-là ? »
  fingerIn: beat(5.4),
  press: beat(6), // le doigt appuie
  transform: beat(6.25), // « Transforme-la. »
  charge: beat(7), // le bouton se charge
  drop: beat(8), // 3,75 s : explosion de couleurs

  // Mesures 3-5 : six passions, deux temps chacune
  scenes: [8, 10, 12, 14, 16, 18].map(beat),

  // Mesure 6 : la progression
  zoomOut: beat(20), // 9,375 s : on découvre le téléphone
  dashboard: beat(20.75),
  stickers: [beat(21), beat(21.5), beat(22)],
  wipe: beat(23.3),

  // Mesure 7 : le slogan
  slogan: beat(24), // 11,25 s
  strike: beat(25),
  create: beat(26),
  shrink: beat(27.2),

  // Mesure 8 : la signature
  endcard: beat(28), // 13,125 s
  logoStrike: beat(29),
  tagline: beat(29.5),
  cta: beat(30),
  end: DURATION,
}
