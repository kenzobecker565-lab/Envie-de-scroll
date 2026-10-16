/**
 * Repères de la pub « Envol », partagés par l'image (main.js) et le son
 * (audio.mjs). 120 BPM : un temps = 0,5 s, une mesure = 2 s, 30 s = 15 mesures.
 */

export const WIDTH = 1080
export const HEIGHT = 1920
export const FPS = 60
export const DURATION = 30

export const BPM = 120
export const BEAT = 60 / BPM
export const BAR = 4 * BEAT

/** Les minutes qui tombent dans le vide, une par temps puis de plus en plus vite. */
export const FALLS = [0.25, 0.75, 1.25, 1.75, 2.0, 2.25, 2.5, 2.625, 2.75, 2.875, 3.0, 3.125, 3.25, 3.375, 3.5, 3.625, 3.75]
/** Durée d'une chute, du haut de l'écran au fond du vide. */
export const FALL_TIME = 1.1

/** Les cinq étages de l'ascension : une passion par mesure. */
export const FLOORS = [8, 10, 12, 14, 16]

export const T = {
  // 1 · La chute (0 → 4 s)
  line1: 0.4, // « Chaque jour, »
  line2: 1.25, // « tes minutes tombent »
  line3: 2.5, // « dans le vide. »
  freeze: 4.0, // tout s'arrête

  // 2 · Minuton (4 → 6 s)
  minuton: 4.25, // il entre
  catch: 4.5, // il attrape une minute
  saufUne: 4.75, // « Sauf celle-là. »

  // 3 · Le renversement (6 → 8 s)
  question: 6.0, // « Et si tu scrollais… » (un mot par croche)
  up: 7.0, // « …vers le haut ? » + le geste
  reverse: 7.5, // la gravité s'inverse, la couleur arrive
  drop: 8.0,

  // 4 · L'ascension (8 → 18 s) : voir FLOORS
  summit: 18.0, // le sommet : Minuton, 25 minutons
  rule: 18.5, // « 1 minute créée = 1 minuton »
  outfits: [19.0, 19.5, 20.0, 20.5], // il change de tenue sur chaque temps
  shopLine: 19.0, // « Dépense-les en tenues, thèmes, mélodies… »

  // 5 · L'app (21 → 25 s)
  phone: 21.0, // le téléphone monte
  swipe: 22.0, // le pouce glisse vers le haut sur « Swipe Up »
  screen2: 22.5, // l'activité proposée
  appLine: 21.25, // « Un geste vers le haut. »
  appLine2: 23.0, // « 5 minutes. Une création. »
  screen3: 24.0, // la création rangée

  // 6 · La signature (25 → 30 s)
  end: 25.0,
  endMinuton: 25.5,
  wordmark: 26.0,
  tagline: 26.75,
  cta: 27.5,
  final: 29.0,
}
