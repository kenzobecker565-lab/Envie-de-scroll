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

/** L'habitacle : Karim au volant, éclairé par le tableau de bord ; derrière lui, la nuit. */
function carShot(k, g) {
  const { svg, bg, makePerson } = k
  bg(g, '#05070f')
  const pass = svg('g', {}, g)
  svg('ellipse', { rx: 260, ry: 160, fill: 'url(#headl)' }, pass)
  svg('circle', { r: 26, fill: '#ffffff' }, pass)
  svg('path', { d: 'M -100 300 L 1180 300 L 1180 1000 L -100 1000 Z', fill: '#0b0f1c', opacity: 0.55 }, g)
  const glow = svg('ellipse', { cx: 540, cy: 1500, rx: 700, ry: 520, fill: '#1fbf5a', opacity: 0.18 }, g)
  const karim = makePerson(g, KARIM)
  const wheel = svg('g', {}, g)
  svg('path', { d: 'M 120 1720 C 220 1380 860 1380 960 1720', fill: 'none', stroke: '#14161c', 'stroke-width': 70, 'stroke-linecap': 'round' }, wheel)
  svg('path', { d: 'M 150 1700 C 250 1420 830 1420 930 1700', fill: 'none', stroke: '#2a2e38', 'stroke-width': 10 }, wheel)
  svg('rect', { x: -100, y: 1760, width: 1300, height: 400, fill: 'url(#dashG)' }, g)
  const flick = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#ffb050', opacity: 0 }, g)
  return { pass, glow, karim, flick }
}
function drawCar(k, s, t, l, { zoom = 1, brows = 'angry' }) {
  const [a, b] = k.reach(-330, 250, -1)
  const [c, d] = k.reach(330, 250, 1)
  const px = ((t * 2600) % 2600) - 800
  s.pass.setAttribute('transform', `translate(${px} ${560 + 30 * Math.sin(t * 9)})`)
  s.flick.setAttribute('opacity', (0.12 * Math.max(0, Math.sin(t * 23))).toFixed(3))
  s.karim.update(t, { x: 540, y: 1180, scale: zoom, mouth: k.mouth('karim', t), brows, look: [0, 0], armL: [a, b], armR: [c, d], seed: 1, breathe: 2 })
}

export default {
  DUR: 5.2,
  REWIND: 4.7,
  VOICES: [{ clip: 'karim2', who: 'karim', label: 'KARIM', at: 0.05 }],
  FLASHES: [3.4],
  SHAKES: [[1.0, 18], [3.4, 26], [3.45, 14]],
  shots: [
    {
      // S1 · Dès la première image : Karim au volant, à 3 h 12. « Vous voulez jouer ? »
      t1: 1.0,
      build(k, g) {
        const s = carShot(k, g)
        k.box(g, '03 H 12', 60, 120, 300)
        return s
      },
      draw(k, s, t, l) {
        drawCar(k, s, t, l, { zoom: 1.12 + 0.12 * l, brows: 'angry' })
      },
    },
    {
      // S2 · La moto cabrée passe en trombe devant le pare-brise : BRAAAP !
      t1: 1.45,
      build(k, g) {
        const { svg, bg, burst } = k
        bg(g, 'url(#nightSky)')
        for (const [x, w, h] of [[-60, 360, 1100], [330, 300, 1250], [660, 460, 1000]]) {
          svg('rect', { x, y: 1400 - h, width: w, height: h, fill: '#0c1022' }, g)
          for (let yy = 1400 - h + 40; yy < 1340; yy += 90) for (let xx = x + 30; xx < x + w - 50; xx += 80) svg('rect', { x: xx, y: yy, width: 44, height: 54, fill: '#ffd28a', opacity: ((xx * 7 + yy * 3) % 10) / 12 }, g)
        }
        svg('rect', { x: -400, y: 1400, width: 1900, height: 800, fill: 'url(#asph)' }, g)
        const m = moto(k, g)
        svg('path', { d: 'M -600 -200 L 1700 -200 L 1700 260 L 1300 100 C 900 40 200 40 -200 100 L -600 260 Z', fill: '#0a0c12' }, g)
        svg('path', { d: 'M -200 2200 L -200 1700 C 200 1600 880 1600 1280 1700 L 1280 2200 Z', fill: '#0a0c12' }, g)
        const brap = burst(g, 'BRAAAP !', { fill: '#ffffff', ink: '#e5484d', size: 140, r: 270 })
        return { m, brap }
      },
      draw(k, s, t, l) {
        const x = k.lerp(-900, 1300, l / 0.45)
        s.m.g.setAttribute('transform', `translate(${x} 1600) rotate(${-26 + 5 * Math.sin(t * 20)}) scale(3.2)`)
        s.m.wheels.forEach((w) => w.setAttribute('transform', `rotate(${t * 1800})`))
        k.burstAt(s.brap, t, 1.03, 1.45, 560, 470, -8, 1)
      },
    },
    {
      // S3 · « On va jouer. » Gros plan, le regard se fige.
      t1: 2.45,
      build(k, g) {
        return carShot(k, g)
      },
      draw(k, s, t, l) {
        drawCar(k, s, t, l, { zoom: 1.35 + 0.35 * k.ease.in2(k.clamp(l / 1.0)), brows: 'angry' })
      },
    },
    {
      // S4 · Le compte-tours s'affole.
      t1: 2.85,
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
        const v = k.ease.out3(k.clamp(l / 0.25))
        s.needle.setAttribute('transform', `rotate(${-130 + 245 * v + 4 * Math.sin(t * 60)})`)
        k.burstAt(s.vroom, t, 2.47, 2.85, 540, 420, -6, 1)
      },
    },
    {
      // S5 · À travers le pare-brise : le phare de la moto fonce sur nous.
      t1: 3.4,
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
        return { lines, bike }
      },
      draw(k, s, t, l) {
        const z = k.ease.in3(k.clamp(l / 0.55))
        k.place(s.bike, 540 + 20 * Math.sin(t * 20), k.lerp(980, 1050, z), k.lerp(0.3, 3.4, z), 0)
        s.lines.setAttribute('transform', `translate(540 1000) rotate(${t * 30})`)
        s.lines.setAttribute('opacity', (0.4 + 0.6 * z).toFixed(2))
      },
    },
    {
      // S6 · BAM !
      t1: 3.75,
      build(k, g) {
        const { bg, burst, speedLines } = k
        bg(g, '#e5484d')
        const lines = speedLines(g, 60, '#ffd166')
        const bam = burst(g, 'BAM !', { fill: '#ffffff', ink: '#10121a', size: 230, r: 360, points: 18 })
        return { lines, bam }
      },
      draw(k, s, t) {
        s.lines.setAttribute('transform', 'translate(540 960)')
        k.burstAt(s.bam, t, 3.4, 3.75, 540, 900, -10, 1.15)
      },
    },
    {
      // S7 · Le silence : le casque roule dans la lumière des phares, la roue tourne encore.
      t1: 5.2,
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
        const p = k.ease.out3(k.clamp(l / 0.9))
        s.spokes.setAttribute('transform', `rotate(${t * 500 * (1 - 0.6 * p)})`)
        k.place(s.helmet, k.lerp(360, 740, p), 1240 + 24 * Math.abs(Math.sin(p * 9)) * (1 - p), 1.5, p * 300)
      },
    },
  ],
  /** Les bruitages (audio.mjs) : vraies motos de cross (BigSoundBank). */
  sound(a) {
    a.drone(0, 4.7, 0.05)
    a.sample('0888', 0, 0.8, { from: 26.0, len: 1.05, fade: 0.01 })
    a.sample('0906', 0.55, 1.1, { from: 3.0, len: 1.2 })
    a.sample('0888', 1.45, 0.45, { from: 27.2, len: 1.0, lp: 1400 })
    a.whoosh([1.0, 1.45, 2.45, 2.85, 3.4, 3.75])
    a.sample('0600', 2.4, 1.0, { len: 0.95 })
    a.sample('0603', 2.85, 1.0, { from: 3.0, len: 0.55 })
    a.sample('2368', 3.1, 0.7, { len: 0.3 })
    a.boom(3.4, 0.9, 90, 30, 0.6)
    a.sample('0148', 3.4, 0.9, { len: 1.0 })
    a.crash(3.4, 0.35)
    a.tinnitus(3.75, 0.9, 0.04)
    a.sample('0621', 3.75, 0.3, { from: 10, len: 1.0 })
    a.rewind(4.7, 0.5)
  },
}
