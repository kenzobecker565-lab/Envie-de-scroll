/**
 * Repères temporels de la pub Scroll-up, partagés par l'animation (main.js)
 * et la bande-son (audio.mjs) : l'image et le son tombent exactement ensemble.
 *
 * Tempo 120 BPM : un temps dure 0,5 s, une mesure 2 s, donc 30 s = 15 mesures.
 * Chaque scène dure deux mesures (4 s), sauf le signal (une mesure).
 */

export const WIDTH = 1080
export const HEIGHT = 1920
export const FPS = 60
export const DURATION = 30

export const BPM = 120
export const BEAT = 60 / BPM // 0,5 s
export const BAR = 4 * BEAT // 2 s

/** Instant du temps n (peut être fractionnaire : 2.5 = la croche après le 3e temps). */
export const beat = (n) => n * BEAT

export const T = {
  // 1 · Le piège (0 → 4 s) : le fil sans fin, la nuit.
  hook: 0.1, // « 23h47. »
  swipes: [0.35, 0.95, 1.45, 1.85], // le doigt pousse le fil, qui se cale sur le post suivant
  frenzy: 2.1, // puis il défile sans s'arrêter
  hook2: 1.0, // « Encore un scroll ? »
  slow: 2.6, // le fil ralentit (la musique s'arrête comme une bande)
  stop: 3.0, // « STOP. »
  morph: 3.5, // le sticker STOP devient le bouton, la couleur envahit l'écran
  drop: 4.0,

  // 2 · Le bouton (4 → 8 s)
  stickers: [4.25, 4.5, 4.75],
  headline: 5.0, // « Ton pouce te démange ? »
  fingerIn: 5.85,
  press: 6.5, // le doigt appuie
  release: 6.8,
  zoom: 7.25, // le bouton envahit l'écran

  // 3 · Le signal (8 → 10 s)
  signal: 8.0,
  signal2: 9.0, // « On s'occupe de toi. »
  signalOut: 9.75,

  // 4 · Les choix (10 → 14 s)
  mood: 10.0,
  moodTap: 11.0,
  time: 11.5,
  timeTap: 12.0,
  passion: 12.5,
  passionTap: 13.25,
  passionZoom: 13.5,

  // 5 · Créer (14 → 18 s)
  activity: 14.0,
  draw: 14.5, // le crayon dessine
  drawEnd: 15.75,
  grid: 16.0, // l'écran recule : les quatre passions
  quads: [16.0, 16.25, 16.5], // écriture, musique, cinéma
  instead: 17.0, // « Crée au lieu de scroller. »

  // 6 · La récompense (18 → 22 s)
  reward: 18.0,
  stamp: 18.25,
  saved: 18.5, // « Activité enregistrée. »
  plus: 18.75, // « +5 minutes ajoutées à ton total. »
  coins: [19.0, 19.25, 19.5, 19.75, 20.0], // cinq pièces, une par minute
  burst: 20.0,
  rule: 20.5, // « 1 minute = 1 pièce d'or »
  rewardOut: 21.5,

  // 7 · La galerie et les thèmes (22 → 26 s)
  gallery: 22.0,
  noGuilt: 22.5,
  themes: [23.0, 24.0, 25.0], // Pop Nuit, BD, Memphis
  galleryOut: 25.75,

  // 8 · La signature (26 → 30 s)
  end: 26.0,
  wordmark: 26.5,
  tagline: 27.0,
  cta: 27.75,
  fingerIn2: 28.0,
  ctaPress: 28.5,
  final: 29.0,
}
