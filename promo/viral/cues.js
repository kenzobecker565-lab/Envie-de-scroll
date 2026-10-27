/**
 * Repères de la vidéo virale, calés sur la musique (media/musique-vidiq.mp3,
 * générée avec vidIQ) : 120 BPM, premier temps à 0,23 s. Le temps de la
 * vidéo est celui de la musique.
 *
 * La musique : une montée (0 → 3,7 s), la batterie entre à 3,73 s, un break
 * (7,73 → 9,73 s), la reprise à 9,73 s, la basse à 14,23 s, le plein à 21,23 s.
 */

export const WIDTH = 1080
export const HEIGHT = 1920
export const FPS = 60
export const DURATION = 25.8

export const BEAT = 0.5
/** Instant du temps n de la musique. */
export const beat = (n) => 0.23 + n * BEAT

export const T = {
  // 1 · L'accroche : 2 mois par an
  hook: 0.05,
  stat: 0.45,
  perYear: 0.95,
  screens: 1.45,
  source: 2.3,
  // 2 · Le fil sans fin, sur la batterie
  drums: 3.73,
  scrolls: [3.73, 4.23, 4.73, 5.23],
  encore: 5.73,
  encore2: 6.23,
  question: 6.73,
  question2: 7.23,
  // 3 · Le break : tout se fige
  pause: 7.73,
  pauseText: 7.9,
  pauseText2: 8.7,
  // 4 · La vraie app
  reveal: 9.73,
  tagline: 10.1,
  tapCta: 10.73,
  tapMood: 11.73,
  tapTime: 12.23,
  tapPassion: 12.73,
  activity: 13.0,
  idea: 13.3,
  drop: 14.23,
  tapValidate: 15.23,
  photo: 15.73,
  tapSave: 16.73,
  done: 17.0,
  coins: 17.3,
  rule: 18.2,
  milestone: 18.8,
  noGuilt: 19.6,
  tapRate: 20.23,
  tapGallery: 20.73,
  // 5 · Les thèmes
  themes: [21.23, 21.73, 22.23, 22.73],
  // 6 · La fin
  end: 23.23,
  endLine: 23.85,
  cta: 24.4,
  final: 25.23,
}
