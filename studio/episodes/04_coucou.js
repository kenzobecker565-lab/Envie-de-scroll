/**
 * Épisode test — Coucou !
 *
 * Premier essai de la marionnette en images (pièces ChatGPT, vue de face).
 * Minuton arrive, salue le spectateur, regarde autour de lui, a une idée, chante,
 * saute de joie, rougit, fait un clin d'œil, puis s'assoit, bâille et s'endort.
 */
const G = 1480

export default {
  title: 'Coucou !',
  duration: 24,
  decor: 'jardin',
  env: { time: 'day', sun: 1, vignette: 0.3 },
  camera: { x: 540, y: 1080, zoom: 1.12 },
  cast: {
    minuton: { type: 'minuton', x: -170, y: G, expr: 'joy' },
  },
  music: [
    { t0: 0.3, t1: 9.6, style: 'uke', bpm: 112, key: 65 },
    { t0: 9.8, t1: 15.0, style: 'party', bpm: 124, key: 65 },
    { t0: 18.6, t1: 24, style: 'lullaby', bpm: 76, key: 65 },
  ],
  ambience: [{ t0: 0, t1: 24, type: 'garden' }],
  track: [
    { t: 0, do: 'transition', type: 'fadeIn', dur: 0.6 },
    // il arrive en marchant
    { t: 0, a: 'minuton', do: 'walk', to: 540, speed: 260 },
    { t: 2.6, a: 'minuton', do: 'turn', to: 0, dur: 0.25 },
    { t: 2.7, a: 'minuton', do: 'squash', amount: 0.08 },
    // coucou au spectateur
    { t: 3.0, a: 'minuton', do: 'expr', name: 'joy' },
    { t: 3.0, a: 'minuton', do: 'wave', side: 'R', n: 4 },
    { t: 3.0, do: 'camera', x: 540, y: 1180, zoom: 1.5, dur: 0.8, ease: 'inOut3' },
    // il regarde autour de lui (le regard saute de point en point)
    { t: 4.8, a: 'minuton', do: 'expr', name: 'neutral' },
    { t: 4.9, a: 'minuton', do: 'look', x: -0.8, y: 0, dur: 0.05 },
    { t: 5.6, a: 'minuton', do: 'look', x: 0.8, y: -0.6, dur: 0.05 },
    { t: 6.3, a: 'minuton', do: 'look', x: 0, y: 0.8, dur: 0.05 },
    { t: 6.9, a: 'minuton', do: 'look', x: 0, y: 0, dur: 0.05 },
    { t: 6.9, a: 'minuton', do: 'arms', pose: 'think', dur: 0.25 },
    { t: 6.9, a: 'minuton', do: 'expr', name: 'curious' },
    // une idée !
    { t: 7.8, a: 'minuton', do: 'expr', name: 'idea' },
    { t: 7.8, a: 'minuton', do: 'arms', pose: 'reachUp', dur: 0.2 },
    { t: 7.8, a: 'minuton', do: 'squash', amount: -0.1 },
    { t: 7.8, do: 'fx', type: 'sparkle', x: 640, y: 930, n: 8 },
    { t: 7.85, do: 'sfx', name: 'ding', gain: 0.25 },
    // il chante
    { t: 8.9, a: 'minuton', do: 'arms', pose: 'open', dur: 0.3 },
    { t: 8.9, a: 'minuton', do: 'expr', name: 'happyClosed' },
    { t: 9.0, a: 'minuton', do: 'babble', dur: 2.2 },
    { t: 9.1, do: 'fx', type: 'notes', x: 600, y: 980, n: 5 },
    { t: 9.0, a: 'minuton', do: 'hop', n: 2, height: 0.15, each: 0.55 },
    // saut de joie
    { t: 11.4, do: 'camera', x: 540, y: 1040, zoom: 1.12, dur: 0.6, ease: 'out3' },
    { t: 11.5, a: 'minuton', do: 'expr', name: 'surprise' },
    { t: 11.5, a: 'minuton', do: 'arms', pose: 'down', dur: 0.15 },
    { t: 11.9, a: 'minuton', do: 'expr', name: 'laugh' },
    { t: 11.9, a: 'minuton', do: 'jump', height: 1.5, dur: 0.85 },
    { t: 11.9, a: 'minuton', do: 'cheer', dur: 1.4 },
    { t: 12.75, do: 'fx', type: 'confetti', x: 540, y: 1000, n: 40 },
    { t: 13.2, a: 'minuton', do: 'hop', n: 2, height: 0.35, each: 0.4 },
    // il rougit, puis clin d'œil
    { t: 14.6, a: 'minuton', do: 'arms', pose: 'cover', dur: 0.25 },
    { t: 14.6, a: 'minuton', do: 'expr', name: 'embarrassed' },
    { t: 14.6, do: 'camera', x: 540, y: 1180, zoom: 1.6, dur: 0.5, ease: 'inOut' },
    { t: 15.9, a: 'minuton', do: 'arms', pose: 'thumbs', dur: 0.2 },
    { t: 15.9, a: 'minuton', do: 'expr', name: 'wink' },
    { t: 15.9, a: 'minuton', do: 'squash', amount: 0.06 },
    { t: 15.95, do: 'sfx', name: 'pop', gain: 0.3 },
    // il s'assoit, bâille et s'endort
    { t: 17.4, do: 'camera', x: 540, y: 1100, zoom: 1.3, dur: 1.0, ease: 'inOut' },
    { t: 17.4, a: 'minuton', do: 'arms', pose: 'down', dur: 0.3 },
    { t: 17.4, a: 'minuton', do: 'expr', name: 'relief' },
    { t: 17.6, a: 'minuton', do: 'sit', dur: 0.5 },
    { t: 18.6, a: 'minuton', do: 'expr', name: 'yawn', dur: 0.3 },
    { t: 18.6, a: 'minuton', do: 'arms', pose: 'cover', dur: 0.3 },
    { t: 19.9, a: 'minuton', do: 'arms', pose: 'down', dur: 0.4 },
    { t: 19.9, a: 'minuton', do: 'expr', name: 'sleep', dur: 0.5 },
    { t: 20.4, do: 'env', time: 1.2, dur: 2.5 },
    { t: 20.6, do: 'fx', type: 'zzz', x: 640, y: 980, n: 3 },
    { t: 22.4, do: 'transition', type: 'irisOut', dur: 1.5, x: 540, y: 1180 },
  ],
}
