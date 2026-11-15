/**
 * Hook prototype « Le rodéo » : 3 h 12, les motos réveillent la cité depuis des
 * mois. Karim, chauffeur de bus, ne dort plus. Il prend sa voiture… et fonce.
 * Rien n'importe d'autre module : le son (audio.mjs) lit aussi ce fichier.
 */

const KARIM = { robe: '#3a4a5a', jabot: false, collar: '#26303c', hair: 'short', hairColor: '#2a1a12', beard: true, skin: '#c8916a', iris: '#2b1d12' }

/** Une moto de cross cabrée, en ombre, avec son pilote. Origine : roue arrière au sol. */
function moto(k, parent) {
  const { svg } = k
  const g = svg('g', {}, parent)
  const beam = svg('path', { d: 'M 250 -150 L 900 -520 L 900 120 Z', fill: 'url(#beamG)', opacity: 0.55 }, g)
  const body = svg('g', { filter: 'url(#sil)' }, g)
  const wheels = [0, 250].map((x) => {
    const w = svg('g', { transform: `translate(${x} -60)` }, body)
    svg('circle', { r: 60, fill: 'none', stroke: '#000', 'stroke-width': 18 }, w)
    const sp = svg('g', {}, w)
    for (let a = 0; a < 6; a++) svg('path', { d: `M 0 0 L ${Math.cos(a) * 56} ${Math.sin(a) * 56}`, stroke: '#000', 'stroke-width': 5 }, sp)
    return sp
  })
  svg('path', { d: 'M 0 -60 L 90 -130 L 190 -130 L 250 -60 M 90 -130 L 70 -170 L 150 -175 L 205 -150 L 230 -200', fill: 'none', stroke: '#000', 'stroke-width': 22, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, body)
  // Le pilote : jambe, buste penché, casque, bras vers le guidon.
  svg('path', { d: 'M 120 -170 L 140 -110 L 175 -100', fill: 'none', stroke: '#000', 'stroke-width': 34, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, body)
  svg('path', { d: 'M 110 -175 C 100 -240 130 -290 170 -300 L 190 -260 C 165 -240 150 -210 150 -175 Z', fill: '#000' }, body)
  svg('circle', { cx: 190, cy: -320, r: 38, fill: '#000' }, body)
  svg('path', { d: 'M 175 -280 L 225 -215', stroke: '#000', 'stroke-width': 24, 'stroke-linecap': 'round' }, body)
  const lamp = svg('circle', { cx: 262, cy: -170, r: 22, fill: '#fff6d8' }, g)
  svg('circle', { cx: 262, cy: -170, r: 70, fill: 'url(#headl)', opacity: 0.9 }, g)
  return { g, wheels, beam, lamp }
}

export default {
  DUR: 7.6,
  REWIND: 7.1,
  VOICES: [{ clip: 'karim', who: 'karim', label: 'KARIM', at: 2.15 }],
  FLASHES: [5.95],
  SHAKES: [[5.95, 26], [6.0, 14]],
  shots: [
    {
      // S1 · 3 h 12 : Karim, les yeux grands ouverts ; dehors, les motos.
      t1: 1.1,
      build(k, g) {
        const { svg, bg, box, burst, makePerson, txt } = k
        bg(g, '#121833')
        const glow = svg('rect', { x: 600, y: 260, width: 420, height: 620, fill: '#ffb050', opacity: 0.4 }, g)
        for (let y = 270; y < 880; y += 46) svg('rect', { x: 600, y, width: 420, height: 30, fill: '#1c2448' }, g)
        svg('rect', { x: 590, y: 250, width: 440, height: 640, fill: 'none', stroke: '#0a0e1e', 'stroke-width': 22 }, g)
        const karim = makePerson(g, KARIM)
        svg('path', { d: 'M -100 1580 C 200 1500 700 1520 1180 1580 L 1180 2100 L -100 2100 Z', fill: '#e8e0d0', stroke: '#b8ab94', 'stroke-width': 8 }, g)
        svg('path', { d: 'M -100 1640 C 300 1580 700 1600 1180 1650', fill: 'none', stroke: '#c9bea8', 'stroke-width': 10 }, g)
        const clock = svg('g', { transform: 'translate(230 1500)' }, g)
        svg('rect', { x: -170, y: -70, width: 340, height: 140, rx: 26, fill: '#10121a', stroke: '#2a2f3a', 'stroke-width': 8 }, clock)
        txt(clock, '03:12', { y: 38, 'font-size': 110, fill: '#ff3b3b' })
        const vrr = burst(g, 'VRRRAAAP !', { fill: '#ffd166', ink: '#10121a', size: 104, r: 240 })
        box(g, '03 H 12 · ENCORE', 60, 110, 560)
        return { glow, karim, vrr }
      },
      draw(k, s, t, l) {
        s.glow.setAttribute('opacity', (0.25 + 0.35 * Math.abs(Math.sin(t * 9))).toFixed(2))
        s.karim.update(t, { x: 540, y: 1200, scale: 1.1, mouth: 0, brows: l > 0.4 ? 'angry' : 'sad', look: [0.7, -0.2], armR: [0.25, 0.4], armL: [0.25, 0.4], seed: 1 })
        k.burstAt(s.vrr, t, 0.3, 1.1, 720, 600, 8, 0.8)
      },
    },
    {
      // S2 · Dehors : la moto cabrée devant les tours ; les fenêtres s'allument.
      t1: 2.05,
      build(k, g) {
        const { svg, bg, burst } = k
        bg(g, 'url(#nightSky)')
        const wins = []
        for (const [x, w, h] of [[-60, 360, 1100], [330, 300, 1250], [660, 460, 1000]]) {
          svg('rect', { x, y: 1400 - h, width: w, height: h, fill: '#0c1022' }, g)
          for (let yy = 1400 - h + 40; yy < 1340; yy += 90) for (let xx = x + 30; xx < x + w - 50; xx += 80) wins.push(svg('rect', { x: xx, y: yy, width: 44, height: 54, fill: '#ffd28a', opacity: 0 }, g))
        }
        svg('rect', { x: -400, y: 1400, width: 1900, height: 800, fill: 'url(#asph)' }, g)
        const m = moto(k, g)
        const brap = burst(g, 'BRAAAP !', { fill: '#ffffff', ink: '#e5484d', size: 130, r: 260 })
        return { wins, m, brap }
      },
      draw(k, s, t, l) {
        const x = k.lerp(-380, 260, l / 0.95)
        s.m.g.setAttribute('transform', `translate(${x} 1720) rotate(${-24 + 4 * Math.sin(t * 8)}) scale(2.3)`)
        s.m.wheels.forEach((w) => w.setAttribute('transform', `rotate(${t * 1400})`))
        s.wins.forEach((w, i) => w.setAttribute('opacity', ((i * 37) % 100) / 100 < l * 0.9 ? 0.85 : 0))
        k.burstAt(s.brap, t, 1.18, 2.05, 600, 420, -8, 1)
      },
    },
    {
      // S3 · Dans sa voiture, éclairé par le tableau de bord : « Vous voulez jouer ? »
      t1: 4.95,
      build(k, g) {
        const { svg, bg, makePerson } = k
        bg(g, '#05070f')
        const far = svg('g', {}, g)
        svg('circle', { r: 16, fill: '#fff6d8' }, far)
        svg('circle', { r: 60, fill: 'url(#headl)' }, far)
        svg('path', { d: 'M -100 300 L 1180 300 L 1180 1000 L -100 1000 Z', fill: '#0b0f1c', opacity: 0.6 }, g)
        svg('ellipse', { cx: 540, cy: 1500, rx: 700, ry: 520, fill: '#1fbf5a', opacity: 0.18 }, g)
        const karim = makePerson(g, KARIM)
        const wheel = svg('g', {}, g)
        svg('path', { d: 'M 120 1720 C 220 1380 860 1380 960 1720', fill: 'none', stroke: '#14161c', 'stroke-width': 70, 'stroke-linecap': 'round' }, wheel)
        svg('path', { d: 'M 150 1700 C 250 1420 830 1420 930 1700', fill: 'none', stroke: '#2a2e38', 'stroke-width': 10 }, wheel)
        svg('rect', { x: -100, y: 1760, width: 1300, height: 400, fill: 'url(#dashG)' }, g)
        svg('rect', { x: 380, y: 1800, width: 320, height: 60, rx: 12, fill: '#1fbf5a', opacity: 0.35 }, g)
        return { far, karim }
      },
      draw(k, s, t, l) {
        s.far.setAttribute('transform', `translate(${760 + 30 * Math.sin(t * 2)} ${560 + 12 * Math.sin(t * 7)})`)
        const [a, b] = k.reach(-330, 250, -1)
        const [c, d] = k.reach(330, 250, 1)
        const cold = l > 1.5 ? 'angry' : 'determined'
        s.karim.update(t, { x: 540, y: 1180, scale: 1.12 + 0.05 * l, mouth: k.mouth('karim', t), brows: cold, look: [0, 0], armL: [a, b], armR: [c, d], seed: 1, breathe: 2 })
      },
    },
    {
      // S4 · Le compte-tours s'affole, les phares s'allument.
      t1: 5.4,
      build(k, g) {
        const { svg, bg, burst, txt } = k
        bg(g, '#05070f')
        const dial = svg('g', { transform: 'translate(540 1000)' }, g)
        svg('circle', { r: 360, fill: '#0c1410', stroke: '#2a3a30', 'stroke-width': 26 }, dial)
        for (let i = 0; i <= 8; i++) {
          const a = ((-220 + i * 32.5) * Math.PI) / 180
          svg('path', { d: `M ${Math.cos(a) * 280} ${Math.sin(a) * 280} L ${Math.cos(a) * 330} ${Math.sin(a) * 330}`, stroke: i > 6 ? '#ff3b3b' : '#9fe0b0', 'stroke-width': 14 }, dial)
          txt(dial, String(i), { x: Math.cos(a) * 230, y: Math.sin(a) * 230 + 22, 'font-size': 60, fill: i > 6 ? '#ff3b3b' : '#9fe0b0' })
        }
        const needle = svg('path', { d: 'M -14 0 L 0 -300 L 14 0 Z', fill: '#ff7a1a' }, dial)
        svg('circle', { r: 40, fill: '#2a3a30' }, dial)
        const vroom = burst(g, 'VROOOM !', { fill: '#ff7a1a', ink: '#ffffff', size: 130, r: 260 })
        return { needle, vroom }
      },
      draw(k, s, t, l) {
        const v = k.ease.out3(k.clamp(l / 0.35))
        s.needle.setAttribute('transform', `rotate(${-130 + 245 * v + 4 * Math.sin(t * 60)})`)
        k.burstAt(s.vroom, t, 4.98, 5.4, 540, 420, -6, 1)
      },
    },
    {
      // S5 · À travers le pare-brise : le phare de la moto fonce sur nous.
      t1: 5.95,
      build(k, g) {
        const { svg, bg, speedLines } = k
        bg(g, '#04060c')
        svg('path', { d: 'M 440 900 L 640 900 L 1300 2000 L -220 2000 Z', fill: '#1c1e24' }, g)
        svg('path', { d: 'M 540 900 L 540 2000', stroke: '#e8e0c0', 'stroke-width': 16, 'stroke-dasharray': '60 60' }, g)
        const lines = speedLines(g, 40, '#ffffff')
        const bike = svg('g', {}, g)
        svg('ellipse', { cx: 0, cy: 70, rx: 70, ry: 120, fill: '#000' }, bike)
        svg('circle', { cx: 0, cy: -60, r: 50, fill: '#000' }, bike)
        svg('circle', { r: 40, fill: '#fff6d8' }, bike)
        svg('circle', { r: 200, fill: 'url(#headl)' }, bike)
        svg('path', { d: 'M -600 -200 L 1700 -200 L 1700 300 L 1300 120 C 900 60 200 60 -200 120 L -600 300 Z', fill: '#0a0c12' }, g)
        svg('path', { d: 'M -200 2200 L -200 1650 C 200 1560 880 1560 1280 1650 L 1280 2200 Z', fill: '#0a0c12' }, g)
        svg('rect', { x: 430, y: 140, width: 220, height: 80, rx: 20, fill: '#1a1d26' }, g)
        return { lines, bike }
      },
      draw(k, s, t, l) {
        const z = k.ease.in3(k.clamp(l / 0.55))
        k.place(s.bike, 540 + 20 * Math.sin(t * 20), k.lerp(980, 1050, z), k.lerp(0.25, 3.2, z), 0)
        s.lines.setAttribute('transform', `translate(540 1000) rotate(${t * 30})`)
        s.lines.setAttribute('opacity', (0.3 + 0.7 * z).toFixed(2))
      },
    },
    {
      // S6 · BAM !
      t1: 6.35,
      build(k, g) {
        const { bg, burst, speedLines } = k
        bg(g, '#e5484d')
        const lines = speedLines(g, 60, '#ffd166')
        const bam = burst(g, 'BAM !', { fill: '#ffffff', ink: '#10121a', size: 230, r: 360, points: 18 })
        return { lines, bam }
      },
      draw(k, s, t) {
        s.lines.setAttribute('transform', 'translate(540 960)')
        k.burstAt(s.bam, t, 5.95, 6.35, 540, 900, -10, 1.15)
      },
    },
    {
      // S7 · Le silence : le casque roule dans la lumière des phares, la roue tourne encore.
      t1: 7.6,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#030408')
        svg('ellipse', { cx: 540, cy: 1150, rx: 820, ry: 640, fill: 'url(#lampG)', opacity: 0.8 }, g)
        svg('path', { d: 'M -200 700 L 1300 700 L 1300 2100 L -200 2100 Z', fill: '#2a2c32', opacity: 0.55 }, g)
        for (let i = 0; i < 18; i++) svg('path', { d: `M ${200 + ((i * 197) % 700)} ${1100 + ((i * 131) % 500)} l 18 -10 l 8 16 Z`, fill: '#cfe6ff', opacity: 0.7 }, g)
        const wheel = svg('g', { transform: 'translate(260 980) scale(1.4)' }, g)
        svg('circle', { r: 150, fill: 'none', stroke: '#0a0a0c', 'stroke-width': 40 }, wheel)
        const spokes = svg('g', {}, wheel)
        for (let a = 0; a < 8; a++) svg('path', { d: `M 0 0 L ${Math.cos(a * 0.785) * 140} ${Math.sin(a * 0.785) * 140}`, stroke: '#3a3c44', 'stroke-width': 10 }, spokes)
        const helmet = svg('g', {}, g)
        svg('circle', { r: 120, fill: '#e5484d', stroke: '#10121a', 'stroke-width': 12 }, helmet)
        svg('path', { d: 'M -100 -10 C -60 -70 70 -70 110 -20 L 100 40 C 40 10 -40 10 -100 40 Z', fill: '#10121a' }, helmet)
        svg('path', { d: 'M -60 -90 C -20 -110 30 -110 60 -96', fill: 'none', stroke: '#ffffff', 'stroke-width': 12, opacity: 0.6 }, helmet)
        return { spokes, helmet }
      },
      draw(k, s, t, l) {
        const p = k.ease.out3(k.clamp(l / 1.1))
        s.spokes.setAttribute('transform', `rotate(${t * 500 * (1 - 0.6 * p)})`)
        k.place(s.helmet, k.lerp(360, 740, p), 1240 + 24 * Math.abs(Math.sin(p * 9)) * (1 - p), 1.5, p * 300)
      },
    },
  ],
  /** Les bruitages (audio.mjs). */
  sound(a) {
    a.drone(0, 7.1, 0.05)
    a.sample('0621', 0, 0.35, { len: 2.05 })
    a.moto(0.2, 0.95, 0.4, true)
    a.moto(1.1, 0.95, 0.75, false)
    a.whoosh([1.1, 2.05, 4.95, 5.4, 5.95, 6.35])
    a.heart(2.2, 2.7, 0.35)
    a.sample('0189', 4.85, 0.9, { from: 0.4, len: 0.6 })
    a.sample('0600', 5.25, 0.9, { len: 0.75 })
    a.moto(5.4, 0.55, 0.6, true)
    a.sample('2368', 5.7, 0.6, { len: 0.3 })
    a.boom(5.95, 0.9, 90, 30, 0.6)
    a.sample('0148', 5.95, 0.9, { len: 1.0 })
    a.crash(5.95, 0.35)
    a.tinnitus(6.35, 0.75, 0.04)
    a.sample('0621', 6.35, 0.25, { from: 10, len: 1.2 })
    a.rewind(7.1, 0.5)
  },
}
