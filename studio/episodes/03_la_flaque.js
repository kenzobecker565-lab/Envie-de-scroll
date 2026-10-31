/**
 * Épisode 3 — La flaque
 *
 * Il fait beau. Un petit nuage arrive et ne pleut… que sur Minuton. Il a beau
 * courir à gauche, à droite, le nuage le suit en riant. Une flaque se forme à ses
 * pieds : au lieu de bouder, Minuton saute dedans. Splash ! L'eau éclabousse le
 * nuage, qui éclate de rire à son tour. Ils dansent sous la pluie, puis le soleil
 * revient avec un arc-en-ciel, et le nuage, devenu tout petit, se pose sur la
 * couronne de Minuton comme un chapeau.
 */
const G = 1450 // ligne du sol de Minuton

export default {
  title: 'La flaque',
  duration: 35,
  decor: 'jardin',
  env: { time: 'day', sun: 1, clouds: 1, vignette: 0.32 },
  camera: { x: 540, y: 1000, zoom: 1.0 },

  cast: {
    tournesol: { type: 'image', img: 'tournesol', x: 110, y: 1350, scale: 0.7, z: -1, shadowW: 240 },
    flaque: { type: 'puddle', x: 820, y: G + 8, size: 0, w: 380, ripple: 0, z: -0.5 },
    arc: { type: 'rainbow', x: 540, y: 1180, r: 560, width: 30, reveal: 0, alpha: 0.85, z: -2 },
    minuton: { type: 'minuton', x: -160, y: G, expr: 'joy' },
    nuage: { type: 'cloud', x: -320, y: 560, scale: 0.85, face: 1, mood: 0.5, rain: 0, ground: G, z: 1 },
  },

  music: [
    { t0: 0.4, t1: 4.2, style: 'uke', bpm: 112, key: 65 },
    { t0: 7.0, t1: 13.2, style: 'pizz', bpm: 132, key: 62, minor: true },
    { t0: 16.9, t1: 25.0, style: 'party', bpm: 128, key: 65 },
    { t0: 25.2, t1: 35, style: 'lullaby', bpm: 84, key: 65 },
  ],
  ambience: [{ t0: 0, t1: 35, type: 'garden' }],

  track: [
    // --- Il fait beau (0 – 4)
    { t: 0, do: 'transition', type: 'fadeIn', dur: 0.8 },
    { t: 0, a: 'minuton', do: 'walk', to: 360, speed: 210 },
    { t: 0.9, do: 'fx', type: 'notes', x: 300, y: 980, n: 4 },
    { t: 2.6, a: 'minuton', do: 'turn', to: 0 },
    { t: 2.8, a: 'minuton', do: 'arms', pose: 'up', dur: 0.5 },
    { t: 2.8, a: 'minuton', do: 'expr', name: 'happyClosed' },
    { t: 2.9, a: 'minuton', do: 'squash', amount: -0.08 },

    // --- Le nuage arrive (4 – 6,8)
    { t: 3.6, a: 'nuage', do: 'set', x: 360, dur: 2.2, ease: 'out3' },
    { t: 4.3, do: 'env', sun: 0.35, dur: 1.2 },
    { t: 5.6, a: 'minuton', do: 'arms', pose: 'down', dur: 0.4 },
    { t: 5.8, a: 'minuton', do: 'expr', name: 'curious' },
    { t: 5.8, a: 'minuton', do: 'lookAt', target: 'nuage' },
    { t: 6.0, a: 'nuage', do: 'set', mood: 1, dur: 0.3 },

    // --- Il pleut… sur lui seulement (6,8 – 8)
    { t: 6.7, a: 'nuage', do: 'set', rain: 1, dark: 0.35, dur: 0.4 },
    { t: 6.9, a: 'minuton', do: 'expr', name: 'surprise' },
    { t: 6.9, a: 'minuton', do: 'squash', amount: 0.15 },
    { t: 7.3, a: 'minuton', do: 'expr', name: 'grumpy' },
    { t: 7.3, a: 'minuton', do: 'shiver', dur: 0.6, amount: 0.8 },

    // --- La poursuite (8 – 12,6)
    { t: 8.0, a: 'minuton', do: 'walk', to: 600, speed: 300 },
    { t: 8.0, a: 'minuton', do: 'look', x: 0.6, y: -0.2 },
    { t: 8.35, a: 'nuage', do: 'set', x: 600, dur: 0.9, ease: 'inOut' },
    { t: 9.3, a: 'minuton', do: 'expr', name: 'disappointed' },
    { t: 9.3, a: 'minuton', do: 'lookAt', target: 'nuage' },
    { t: 9.8, a: 'minuton', do: 'walk', to: 230, style: 'run' },
    { t: 9.8, a: 'minuton', do: 'expr', name: 'determined' },
    { t: 10.0, a: 'nuage', do: 'set', x: 230, dur: 0.75, ease: 'inOut' },
    { t: 11.0, a: 'minuton', do: 'walk', to: 820, style: 'run' },
    { t: 11.15, a: 'nuage', do: 'set', x: 820, dur: 1.15, ease: 'inOut' },
    { t: 11.0, do: 'camera', fw: 0.35, follow: 'minuton', fx: 0, dur: 0.6 },
    { t: 12.3, a: 'minuton', do: 'turn', to: -0.2 },
    { t: 12.3, a: 'minuton', do: 'arms', pose: 'hips', dur: 0.3 },
    { t: 12.3, a: 'minuton', do: 'expr', name: 'grumpy' },
    { t: 12.3, a: 'minuton', do: 'lookAt', target: 'nuage' },
    { t: 12.5, a: 'nuage', do: 'set', mood: 1, mouthOpen: 0.8, dur: 0.2 },
    { t: 13.1, a: 'nuage', do: 'set', mouthOpen: 0, dur: 0.2 },

    // --- Gros plan : il boude. La flaque se forme (13,4 – 16)
    { t: 13.4, do: 'camera', x: 820, y: 1200, zoom: 1.75, fw: 0, dur: 0 },
    { t: 13.4, a: 'minuton', do: 'arms', pose: 'down', dur: 0.3 },
    { t: 13.4, a: 'minuton', do: 'expr', name: 'sad' },
    { t: 13.4, a: 'minuton', do: 'look', x: 0, y: -0.6, dur: 0.3 },
    { t: 13.0, a: 'flaque', do: 'set', size: 1, ripple: 1, dur: 3.0, ease: 'out' },
    { t: 14.3, do: 'fx', type: 'drops', x: 830, y: 980, n: 4 },
    { t: 14.6, a: 'minuton', do: 'look', x: 0.15, y: 1, dur: 0.4 },
    { t: 14.6, a: 'minuton', do: 'expr', name: 'curious' },
    { t: 15.0, do: 'camera', x: 820, y: 1230, zoom: 1.3, dur: 0 },
    { t: 15.3, a: 'minuton', do: 'expr', name: 'idea' },
    { t: 15.3, do: 'fx', type: 'sparkle', x: 920, y: 1030, n: 8 },
    { t: 15.4, a: 'minuton', do: 'squash', amount: -0.1 },

    // --- Splash ! (16 – 20,5)
    { t: 16.0, a: 'minuton', do: 'expr', name: 'mischief' },
    { t: 16.2, a: 'minuton', do: 'jump', height: 1.1, dur: 0.75 },
    { t: 16.2, a: 'minuton', do: 'arms', pose: 'cheer', dur: 0.3 },
    { t: 16.95, do: 'fx', type: 'splash', x: 820, y: G, n: 22, scale: 1.3 },
    { t: 16.95, do: 'shake', amp: 10, dur: 0.35 },
    { t: 16.95, a: 'minuton', do: 'expr', name: 'laugh' },
    { t: 17.1, do: 'camera', x: 700, y: 1000, zoom: 1.0, dur: 0.8, ease: 'out3' },
    { t: 17.3, a: 'minuton', do: 'hop', n: 3, height: 0.45, each: 0.42 },
    { t: 17.6, do: 'fx', type: 'splash', x: 820, y: G, n: 12 },
    { t: 18.02, do: 'fx', type: 'splash', x: 820, y: G, n: 12 },
    { t: 18.44, do: 'fx', type: 'splash', x: 820, y: G, n: 12 },
    { t: 18.9, a: 'minuton', do: 'jump', height: 1.6, dur: 0.85 },
    { t: 19.73, do: 'fx', type: 'splash', x: 820, y: G, n: 34, scale: 2.2 },
    { t: 19.73, do: 'shake', amp: 14, dur: 0.4 },
    { t: 19.9, a: 'nuage', do: 'set', mood: 0, mouthOpen: 0.9, eyesClosed: 1, dur: 0.1 },
    { t: 19.9, do: 'fx', type: 'drops', x: 820, y: 640, n: 10 },
    { t: 20.3, a: 'nuage', do: 'set', eyesClosed: 0, mouthOpen: 0.6, mood: 1, dur: 0.3 },

    // --- Ils dansent sous la pluie (20,5 – 25)
    { t: 20.5, a: 'minuton', do: 'cheer', dur: 4.2 },
    { t: 20.5, a: 'minuton', do: 'hop', n: 6, height: 0.3, each: 0.5 },
    { t: 20.5, do: 'fx', type: 'notes', x: 760, y: 900, n: 5 },
    { t: 20.6, a: 'nuage', do: 'set', y: 520, dur: 0.5 },
    { t: 21.1, a: 'nuage', do: 'set', y: 600, dur: 0.5 },
    { t: 21.6, a: 'nuage', do: 'set', y: 520, dur: 0.5 },
    { t: 22.1, a: 'nuage', do: 'set', y: 600, dur: 0.5 },
    { t: 22.6, a: 'nuage', do: 'set', y: 520, dur: 0.5 },
    { t: 23.6, a: 'minuton', do: 'spin', turns: 1, dur: 0.9 },
    { t: 23.1, a: 'nuage', do: 'set', y: 580, dur: 0.5 },

    // --- Le soleil revient, l'arc-en-ciel (25 – 29)
    { t: 25.0, a: 'nuage', do: 'set', rain: 0, dark: 0, mouthOpen: 0, dur: 0.8 },
    { t: 25.0, a: 'flaque', do: 'set', ripple: 0, dur: 1 },
    { t: 25.0, do: 'env', sun: 1, dur: 1.5 },
    { t: 25.2, a: 'minuton', do: 'arms', pose: 'down', dur: 0.4 },
    { t: 25.4, a: 'arc', do: 'set', reveal: 1, dur: 2.0, ease: 'inOut' },
    { t: 25.6, a: 'minuton', do: 'turn', to: 0 },
    { t: 25.6, a: 'minuton', do: 'expr', name: 'surprise' },
    { t: 25.6, a: 'minuton', do: 'look', x: -0.3, y: -0.9, dur: 0.5 },
    { t: 26.6, a: 'minuton', do: 'expr', name: 'joy' },
    { t: 26.6, do: 'fx', type: 'sparkle', x: 540, y: 700, n: 12, scale: 1.4 },
    { t: 27.6, a: 'nuage', do: 'set', scale: 0.32, attach: 'minuton', attachW: 1, ax: 10, ay: -22, mood: 1, dur: 1.6, ease: 'inOut3' },
    { t: 27.6, a: 'minuton', do: 'lookAt', target: 'nuage' },
    { t: 29.2, a: 'minuton', do: 'squash', amount: 0.1 },
    { t: 29.2, a: 'minuton', do: 'expr', name: 'happyClosed' },
    { t: 29.2, do: 'fx', type: 'hearts', x: 820, y: 860, n: 5 },

    // --- Ils repartent ensemble (30 – 36)
    { t: 30.4, a: 'minuton', do: 'expr', name: 'joy' },
    { t: 30.4, a: 'minuton', do: 'look', x: 0.5, y: 0, dur: 0.3 },
    { t: 30.6, a: 'minuton', do: 'walk', to: 1180, speed: 150 },
    { t: 31.0, do: 'fx', type: 'notes', x: 900, y: 900, n: 4 },
    { t: 33.0, do: 'transition', type: 'irisOut', dur: 1.6, x: 1010, y: 1180 },
  ],
}
