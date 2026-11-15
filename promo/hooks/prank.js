/**
 * Hook prototype « Le prank » (v2, un seul plan) : tout est filmé par le
 * téléphone du youtubeur, en live. Selfie : « Les gars… expérience sociale. »
 * Il enfile sa cagoule, retourne la caméra, marche vers l'enfant sur le banc,
 * l'attrape ; l'enfant hurle. Un passant surgit : « LÂCHE-LE ! ». Le poing
 * arrive sur l'objectif. Le téléphone tombe, tournoie, finit dans l'herbe,
 * l'écran fissuré, face au ciel. Le live continue.
 */

const YT = { robe: '#fe2c55', jabot: false, collar: '#ffffff', hair: 'cap', cap: '#10121a', skin: '#f0c8a0', iris: '#3a5a7a' }
const KID = { robe: '#ffd166', jabot: false, collar: '#3b82f6', hair: 'messy', hairColor: '#7a4a2a', skin: '#f6d0b0', iris: '#3a5a7a' }
const PASSANT = { robe: '#2a3a5a', jabot: false, collar: '#1a2440', hair: 'short', hairColor: '#1a120c', beard: true, skin: '#a8714e', iris: '#1a120c' }
/** La cagoule noire (fente pour les yeux, trou pour la bouche). */
const BALA = 'M 0 -334 C 132 -334 166 -232 161 -130 C 157 -28 106 34 0 36 C -106 34 -157 -28 -161 -130 C -166 -232 -132 -334 0 -334 Z M -114 -190 L 114 -190 Q 122 -142 114 -94 L -114 -94 Q -122 -142 -114 -190 Z M -48 -24 A 48 30 0 1 0 48 -24 A 48 30 0 1 0 -48 -24 Z'

// Les temps forts.
const T = { MASK: 2.35, FLIP: 3.6, GRAB: 5.0, PASS: 5.3, PUNCH: 6.9, FALL: 6.95, GROUND: 7.55, SIREN: 8.6, REWIND: 9.6 }

/** Le parc : ciel, arbres, pelouse, allée. */
function park(k, g) {
  const { svg } = k
  svg('rect', { x: -900, y: -900, width: 2900, height: 2000, fill: 'url(#daySky)' }, g)
  for (const [x, y, r] of [[-300, 760, 260], [80, 700, 240], [420, 740, 260], [820, 700, 250], [1200, 760, 270], [1560, 720, 240]]) {
    svg('rect', { x: x - 22, y, width: 44, height: 380, fill: '#6a4a30' }, g)
    svg('circle', { cx: x, cy: y - 40, r, fill: '#4a8a3a' }, g)
    svg('circle', { cx: x - r * 0.3, cy: y - 90, r: r * 0.6, fill: '#5aa04a' }, g)
  }
  svg('rect', { x: -900, y: 1080, width: 2900, height: 1400, fill: 'url(#lawn)' }, g)
  svg('path', { d: 'M 380 1080 L 700 1080 L 1300 2500 L -200 2500 Z', fill: '#d8c8a4' }, g)
}

export default {
  DUR: 10.1,
  REWIND: T.REWIND,
  VOICES: [
    { clip: 'youtubeur', who: 'youtubeur', label: 'LE YOUTUBEUR · EN DIRECT', at: 0.0 },
    { clip: 'passant', who: 'passant', label: 'UN PASSANT', at: 5.55 },
  ],
  FLASHES: [T.PUNCH],
  SHAKES: [[T.GRAB, 12], [T.PUNCH, 34], [T.GROUND, 20]],
  shots: [
    {
      t1: 10.1,
      build(k, g) {
        const { svg, txt, bg, burst } = k
        bg(g, '#0a0a0c')
        // ---- La caméra selfie : lui, en gros plan, le parc derrière.
        const selfie = svg('g', {}, g)
        const sBack = svg('g', { filter: 'url(#blur6)' }, selfie)
        park(k, sBack)
        const yt = k.makePerson(selfie, YT)
        const bala = svg('path', { d: BALA, 'fill-rule': 'evenodd', fill: '#14161c' }, yt.head)
        // ---- La caméra arrière : le parc, le banc, l'enfant ; son bras ; le passant.
        const rear = svg('g', {}, g)
        const world = svg('g', {}, rear)
        park(k, world)
        svg('rect', { x: 360, y: 1180, width: 360, height: 30, rx: 10, fill: '#8a5a30' }, world)
        svg('rect', { x: 360, y: 1120, width: 360, height: 24, rx: 10, fill: '#8a5a30' }, world)
        const kid = k.makePerson(world, KID)
        for (const x of [380, 690]) svg('rect', { x, y: 1210, width: 18, height: 90, fill: '#3a3a3a' }, world)
        const pas = k.makePerson(world, PASSANT)
        const arm = svg('g', {}, rear)
        svg('path', { d: 'M -200 2100 C 100 1700 300 1450 420 1300', fill: 'none', stroke: '#10121a', 'stroke-width': 170, 'stroke-linecap': 'round' }, arm)
        svg('circle', { cx: 430, cy: 1290, r: 72, fill: '#f0c8a0' }, arm)
        const fist = svg('g', { opacity: 0 }, rear)
        svg('path', { d: 'M 900 2100 L 620 1200', stroke: '#2a3a5a', 'stroke-width': 280, 'stroke-linecap': 'round' }, fist)
        svg('rect', { x: 420, y: 860, width: 380, height: 330, rx: 100, fill: '#a8714e', stroke: '#10121a', 'stroke-width': 14 }, fist)
        for (let i = 0; i < 4; i++) svg('path', { d: `M ${460 + i * 85} 880 L ${460 + i * 85} 980`, stroke: '#6a4430', 'stroke-width': 12, 'stroke-linecap': 'round' }, fist)
        const help = burst(rear, 'AU SECOURS !', { fill: '#ffd166', ink: '#e5484d', size: 100, r: 250 })
        const paf = burst(g, 'PAF !', { fill: '#ffffff', ink: '#e5484d', size: 230, r: 330, points: 18 })
        // ---- Par terre : le ciel, l'herbe, l'écran fissuré ; le passant penché ; l'enfant qui s'enfuit.
        const ground = svg('g', { opacity: 0 }, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#daySky)' }, ground)
        for (const [x, r] of [[120, 300], [900, 340]]) svg('circle', { cx: x, cy: 260, r, fill: '#4a8a3a' }, ground)
        const over = k.makePerson(ground, PASSANT)
        over.root.setAttribute('filter', 'url(#sil)')
        svg('path', { d: 'M -400 1500 Q 540 1380 1500 1500 L 1500 2300 L -400 2300 Z', fill: '#3a6a32' }, ground)
        for (let i = 0; i < 50; i++) svg('path', { d: `M ${(i * 97) % 1080} ${1500 + ((i * 53) % 400)} l 10 -60 l 10 60`, fill: '#4a8a3a' }, ground)
        const limp = svg('g', {}, ground)
        svg('path', { d: 'M 1200 1900 L 820 1700', stroke: '#10121a', 'stroke-width': 150, 'stroke-linecap': 'round' }, limp)
        svg('circle', { cx: 800, cy: 1690, r: 66, fill: '#f0c8a0' }, limp)
        const run = svg('g', {}, ground)
        svg('circle', { r: 40, fill: '#7a4a2a' }, run)
        svg('ellipse', { cy: 80, rx: 45, ry: 60, fill: '#ffd166' }, run)
        const crack = svg('g', { opacity: 0 }, g)
        for (const d of ['M 620 700 L 480 420 L 520 120', 'M 620 700 L 900 520 L 1100 560', 'M 620 700 L 700 1100 L 640 1500', 'M 620 700 L 300 860 L -20 820', 'M 480 420 L 300 330']) svg('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': 8, opacity: 0.9 }, crack)
        svg('circle', { cx: 620, cy: 700, r: 30, fill: 'none', stroke: '#ffffff', 'stroke-width': 6 }, crack)
        // ---- L'interface du live (fixe).
        const ui = svg('g', {}, g)
        svg('circle', { cx: 105, cy: 120, r: 38, fill: '#fe2c55', stroke: '#ffffff', 'stroke-width': 6 }, ui)
        txt(ui, '@kevin.experiences', { x: 165, y: 112, 'font-size': 38, fill: '#ffffff', 'text-anchor': 'start', stroke: '#10121a', 'stroke-width': 6, 'paint-order': 'stroke fill' })
        txt(ui, '2,1 M abonnés', { x: 165, y: 152, 'font-size': 30, fill: '#ffffff', 'text-anchor': 'start', stroke: '#10121a', 'stroke-width': 5, 'paint-order': 'stroke fill' })
        svg('rect', { x: 760, y: 88, width: 120, height: 56, rx: 12, fill: '#fe2c55' }, ui)
        txt(ui, 'LIVE', { x: 820, y: 128, 'font-size': 36, fill: '#ffffff' })
        svg('rect', { x: 890, y: 88, width: 150, height: 56, rx: 12, fill: '#000', opacity: 0.5 }, ui)
        const views = txt(ui, '', { x: 965, y: 128, 'font-size': 34, fill: '#ffffff' })
        const title = svg('g', {}, ui)
        svg('rect', { x: -320, y: -42, width: 640, height: 84, rx: 20, fill: '#000', opacity: 0.55 }, title)
        txt(title, 'EXPÉRIENCE SOCIALE', { y: 16, 'font-size': 44, fill: '#ffffff' })
        const msgs = [
          ['@nono', 'trop hâte mdr', '#ffffff'],
          ['@lea.b', 'vas-y fais-le', '#ffffff'],
          ['@sam', 'c’est un vrai gosse ???', '#ffd166'],
          ['@jojo', 'c’est pas drôle là', '#ffd166'],
          ['@inès', 'il pleure le petit…', '#ff6b6b'],
          ['@kz', 'MDRRR LE PASSANT', '#ffffff'],
          ['@yanis', 'il bouge plus ?', '#ff6b6b'],
          ['@paul', 'APPELEZ LES SECOURS', '#ff6b6b'],
          ['@lea.b', 'c’était un prank !!!', '#ffd166'],
        ].map(([w, m2, c]) => {
          const b = svg('g', { opacity: 0 }, ui)
          svg('rect', { x: 0, y: -40, width: 40 + 21 * (w.length + m2.length), height: 74, rx: 37, fill: c === '#ff6b6b' ? '#7a1018' : '#000', opacity: c === '#ffffff' ? 0.55 : 0.85 }, b)
          const tt = txt(b, '', { x: 24, y: 12, 'font-size': 36, 'text-anchor': 'start' })
          svg('tspan', { fill: '#9fd0ff', 'font-weight': 900 }, tt).textContent = `${w} `
          svg('tspan', { fill: c }, tt).textContent = m2
          return b
        })
        return { selfie, yt, bala, rear, world, kid, pas, arm, fist, help, paf, ground, over, limp, run, crack, ui, views, title, msgs }
      },
      draw(k, s, t) {
        const flipK = k.clamp((t - (T.FLIP - 0.12)) / 0.24)
        const isRear = t >= T.FLIP
        const onGround = t >= T.GROUND
        k.show(s.selfie, !isRear)
        k.show(s.rear, isRear && t < T.GROUND)
        s.ground.setAttribute('opacity', onGround ? 1 : 0)
        // Le retournement de caméra : l'image s'écrase puis revient.
        const squash = Math.abs(Math.cos(Math.PI * flipK))
        const hand = (amp) => `translate(${(amp * (8 * Math.sin(t * 7.3) + 4 * Math.sin(t * 17))).toFixed(1)} ${(amp * 6 * Math.sin(t * 6.1 + 1)).toFixed(1)})`
        // ---- Selfie.
        if (!isRear) {
          s.selfie.setAttribute('transform', `translate(540 960) scale(${squash.toFixed(3)} 1) translate(-540 -960) ${hand(1)}`)
          s.yt.update(t, { x: 540, y: 1270, scale: 1.5, mouth: k.mouth('youtubeur', t), brows: t > T.MASK ? 'angry' : 'neutral', look: [0, 0.1], armR: [2.3, 0.9], armL: t > T.MASK - 0.4 && t < T.MASK + 0.3 ? [2.7, 1.6] : [0.3, 0.5], headTilt: 0.08 * Math.sin(t * 2), seed: 2 })
          const m = k.ease.out3(k.clamp((t - T.MASK) / 0.3))
          s.bala.setAttribute('transform', `translate(0 ${(-420 * (1 - m)).toFixed(0)})`)
          s.bala.setAttribute('opacity', m > 0.01 ? 1 : 0)
        }
        // ---- Caméra arrière : il marche vers le banc, attrape l'enfant ; le passant charge ; le poing.
        if (isRear && !onGround) {
          const walk = k.ease.io2(k.clamp((t - T.FLIP) / (T.GRAB - T.FLIP)))
          const z = k.lerp(1.0, 1.9, walk)
          const bob = (1 - walk) * 18 * Math.abs(Math.sin(t * 9))
          const spin = t > T.FALL ? k.ease.in2(k.clamp((t - T.FALL) / (T.GROUND - T.FALL))) : 0
          const shake = t > T.GRAB && t < T.PUNCH ? 14 * Math.sin(t * 40) : 0
          s.rear.setAttribute('transform', `translate(540 960) scale(${(squash * (1 + 0.5 * spin)).toFixed(3)} ${(1 + 0.5 * spin).toFixed(3)}) rotate(${(spin * 220).toFixed(1)}) translate(-540 -960) ${hand(1.4)}`)
          s.world.setAttribute('transform', `translate(540 ${960 + bob}) scale(${z}) translate(-540 -1000) translate(${shake} 0)`)
          const grabbed = t > T.GRAB
          s.kid.update(t, { x: 540 + (grabbed ? 10 * Math.sin(t * 40) : 0), y: 1030, scale: 0.42, mouth: grabbed ? 1 : 0.2, brows: grabbed ? 'surprised' : 'neutral', look: grabbed ? [-0.4, 0.3] : [0, 0.4], armR: grabbed ? [2.6 + 0.3 * Math.sin(t * 30), 0.6] : [0.5, 1.4], armL: grabbed ? [1.4, 0.2] : [0.5, 1.4], tearT: grabbed ? t - T.GRAB : -1, seed: 3 })
          const a = k.ease.out3(k.clamp((t - (T.GRAB - 0.3)) / 0.3))
          s.arm.setAttribute('transform', `translate(${k.lerp(-500, 0, a)} ${k.lerp(600, 0, a) + (grabbed ? 12 * Math.sin(t * 40) : 0)})`)
          k.burstAt(s.help, t, T.GRAB + 0.05, T.PUNCH - 0.2, 760, 600, 8, 0.72)
          const p = k.ease.in2(k.clamp((t - T.PASS) / (T.PUNCH - T.PASS)))
          s.pas.root.setAttribute('opacity', t > T.PASS ? 1 : 0)
          s.pas.update(t, { x: k.lerp(1300, 700, p), y: k.lerp(1040, 1120, p), scale: k.lerp(0.45, 1.1, p), mouth: k.mouth('passant', t), brows: 'angry', look: [-0.4, 0], armR: [1.2 + 0.5 * Math.sin(t * 16), 1.1], armL: [1.2 - 0.5 * Math.sin(t * 16), 1.1], lean: -0.1, seed: 4 })
          const f = k.ease.in3(k.clamp((t - (T.PUNCH - 0.15)) / 0.15))
          s.fist.setAttribute('opacity', t > T.PUNCH - 0.15 && t < T.FALL + 0.1 ? 1 : 0)
          s.fist.setAttribute('transform', `translate(540 960) scale(${k.lerp(0.5, 2.2, f)}) translate(-540 -960)`)
        }
        k.burstAt(s.paf, t, T.PUNCH, T.GROUND - 0.1, 540, 900, -10, 1.1)
        // ---- Par terre : face au ciel, l'écran fissuré ; le live continue.
        if (onGround) {
          const l = t - T.GROUND
          s.over.update(t, { x: 560, y: 1150, scale: 1.3, look: [0, 0.6], armR: [0.3, 0.6], armL: [0.3, 0.6], seed: 4 })
          s.over.root.setAttribute('opacity', l < 1.0 ? 1 : Math.max(0, 1 - (l - 1.0) * 2).toFixed(2))
          k.place(s.run, k.lerp(700, 1200, k.clamp(l / 1.2)), 1450 - 20 * Math.abs(Math.sin(t * 14)), 0.8, 0)
          s.ground.setAttribute('transform', `rotate(-14 540 960) ${hand(0.3)}`)
        }
        s.crack.setAttribute('opacity', onGround ? 1 : 0)
        // ---- Interface : spectateurs qui s'envolent, commentaires en haut.
        const v = 12.4 + t * 0.4 + (t > T.GRAB ? (t - T.GRAB) * 3 : 0) + (t > T.PUNCH ? (t - T.PUNCH) * 14 : 0)
        s.views.textContent = `${v.toFixed(1).replace('.', ',')} k`
        k.place(s.title, 540, 250, t < T.FLIP ? 1 : 0, 0)
        const times = [0.5, 1.4, T.FLIP + 0.4, T.GRAB - 0.25, T.GRAB + 0.35, T.PUNCH + 0.25, T.GROUND + 0.2, T.GROUND + 0.55, T.GROUND + 0.9]
        const shown = times.filter((a2) => t >= a2).length
        s.msgs.forEach((b, i) => {
          const a2 = times[i]
          const row = shown - 1 - i
          b.setAttribute('opacity', t >= a2 && row < 4 ? (1 - row * 0.12).toFixed(2) : 0)
          if (t >= a2) k.place(b, 30, 640 - row * 82 + 30 * Math.exp(-(t - a2) * 18), 0.98 + 0.15 * Math.exp(-(t - a2) * 10), 0)
        })
      },
    },
  ],
  sound(a) {
    // Le vlog : un petit beat léger sous le selfie, coupé net quand il attrape l'enfant.
    const B = 60 / 124
    for (let t = 0, n = 0; t < T.GRAB - 0.05; t += B / 2, n++) {
      if (n % 4 === 0) a.kick(t, 0.45)
      if (n % 4 === 2) a.clap(t, 0.2)
      a.hat(t, 0.04)
    }
    a.sample('1660', 0, 0.3, { len: T.GRAB })
    a.notif([0.5, 1.4, T.FLIP + 0.4, T.GRAB - 0.25])
    a.whoosh([T.FLIP])
    a.steps(T.FLIP, T.GRAB - T.FLIP, 0.12)
    // L'enlèvement : disque rayé, cri, tension.
    a.scratch(T.GRAB - 0.03, 0.25)
    a.scream(T.GRAB + 0.05, 1.3, 0.45)
    a.drone(T.GRAB, T.REWIND - T.GRAB, 0.07)
    a.notif([T.GRAB + 0.35])
    a.steps(T.PASS, T.PUNCH - T.PASS, 0.2)
    // Le coup de poing, la chute du téléphone, l'écran qui se fissure.
    a.sample('0597', T.PUNCH - 0.02, 1.0, { len: 0.35 })
    a.boom(T.PUNCH, 0.9, 110, 34, 0.5)
    a.crash(T.PUNCH + 0.01, 0.25)
    a.whoosh([T.FALL + 0.05])
    a.boom(T.GROUND, 0.7, 90, 30, 0.5)
    a.sample('0771', T.GROUND, 0.45, { len: 0.7 })
    a.tinnitus(T.GROUND, 1.4, 0.035)
    a.notif([T.PUNCH + 0.25, T.GROUND + 0.2, T.GROUND + 0.55, T.GROUND + 0.9])
    a.sample('1463', T.SIREN, 0.15, { len: T.REWIND - T.SIREN + 0.3, lp: 1800 })
    a.rewind(T.REWIND, 0.5)
  },
}
