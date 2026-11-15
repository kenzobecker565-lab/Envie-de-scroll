/**
 * Hook prototype « Le RER » : dans un wagon bondé, un homme colle et harcèle une
 * jeune femme. Un passager se lève : « Toi. Tu descends. » Les portes s'ouvrent,
 * il le pousse dehors ; l'homme tombe mal sur le quai.
 */

const LEA = { robe: '#7a5ac8', jabot: false, collar: '#e6dcff', hair: 'bob', hairColor: '#1d140e', skin: '#e8b892', iris: '#3a2a1a', female: true }
const HARC = { robe: '#5a5a52', jabot: false, collar: '#3a3a34', hair: 'slick', hairColor: '#2a1a10', skin: '#e2b08a', iris: '#2b1d12' }
const MOUSSA = { robe: '#1f2d55', jabot: false, collar: '#ffd166', hair: 'short', hairColor: '#10100e', beard: true, skin: '#6a4430', iris: '#1a120c' }

/** L'intérieur du wagon : vitres noires (le tunnel), barres jaunes, sièges. */
function wagon(k, g) {
  const { svg, bg } = k
  bg(g, 'url(#wagon)')
  const lights = []
  for (const x of [-40, 560]) {
    svg('rect', { x, y: 300, width: 520, height: 520, rx: 40, fill: '#0a0c12', stroke: '#6a7480', 'stroke-width': 16 }, g)
    for (let i = 0; i < 3; i++) lights.push({ el: svg('rect', { x, y: 380 + i * 150, width: 120, height: 10, rx: 5, fill: '#ffd28a', opacity: 0.7 }, g), x0: x })
  }
  for (const x of [170, 910]) svg('rect', { x, y: -100, width: 34, height: 2200, rx: 17, fill: '#f2c230', stroke: '#a67a10', 'stroke-width': 4 }, g)
  svg('rect', { x: -100, y: 120, width: 1300, height: 60, fill: '#eef2f6' }, g)
  return lights
}
const tunnel = (lights, t) => lights.forEach((l, i) => l.el.setAttribute('x', l.x0 + ((t * 1800 + i * 170) % 640) - 120))

export default {
  DUR: 8.9,
  REWIND: 8.4,
  VOICES: [
    { clip: 'harceleur', who: 'harceleur', label: 'UN PASSAGER', at: 1.1 },
    { clip: 'passager', who: 'passager', label: 'MOUSSA', at: 5.3 },
  ],
  FLASHES: [7.65],
  SHAKES: [[7.62, 24], [8.15, 18]],
  shots: [
    {
      // S1 · RER B, 18 h 40 : Léa, écouteurs, elle regarde ses pieds.
      t1: 1.1,
      build(k, g) {
        const lights = wagon(k, g)
        const lea = k.makePerson(g, LEA)
        k.box(g, 'RER B · 18 H 40', 60, 190, 520)
        return { lights, lea }
      },
      draw(k, s, t) {
        tunnel(s.lights, t)
        s.lea.update(t, { x: 540, y: 1250, scale: 1.2, mouth: 0, brows: 'sad', look: [-0.2, 0.6], armR: [0.3, 1.6], armL: [0.3, 1.6], headTilt: -0.1, seed: 5 })
      },
    },
    {
      // S2 · Lui, beaucoup trop près : « Allez… fais pas ta timide. »
      t1: 3.2,
      build(k, g) {
        const lights = wagon(k, g)
        const leaBack = k.makePerson(g, LEA)
        leaBack.root.setAttribute('filter', 'url(#sil)')
        leaBack.root.setAttribute('opacity', 0.85)
        const h = k.makePerson(g, HARC)
        return { lights, leaBack, h }
      },
      draw(k, s, t, l) {
        tunnel(s.lights, t)
        s.leaBack.update(t, { x: 200, y: 1550, scale: 1.1, look: [0.5, 0], seed: 5 })
        s.h.update(t, { x: 620 - 30 * k.ease.out2(k.clamp(l / 1.5)), y: 1180, scale: 1.25, mouth: k.mouth('harceleur', t), brows: [4, -0.1], look: [-0.7, 0.3], armR: [2.6, 0.3], armL: [0.3, 0.6], headTilt: -0.25, seed: 6 })
      },
    },
    {
      // S3 · Sur la barre, sa main glisse vers celle de Léa.
      t1: 4.2,
      build(k, g) {
        const { svg, bg, box } = k
        bg(g, '#c9d2dc')
        svg('rect', { x: 470, y: -100, width: 140, height: 2200, rx: 70, fill: '#f2c230', stroke: '#a67a10', 'stroke-width': 10 }, g)
        const her = svg('g', {}, g)
        svg('path', { d: 'M 1300 1250 L 640 1180', stroke: '#7a5ac8', 'stroke-width': 170, 'stroke-linecap': 'round' }, her)
        svg('ellipse', { cx: 560, cy: 1160, rx: 110, ry: 90, fill: '#e8b892', stroke: '#b88862', 'stroke-width': 6 }, her)
        for (let i = 0; i < 4; i++) svg('rect', { x: 460, y: 1090 + i * 40, width: 70, height: 34, rx: 17, fill: '#e8b892', stroke: '#b88862', 'stroke-width': 5 }, her)
        const his = svg('g', {}, g)
        svg('path', { d: 'M -300 300 L 440 820', stroke: '#5a5a52', 'stroke-width': 180, 'stroke-linecap': 'round' }, his)
        svg('ellipse', { cx: 520, cy: 880, rx: 120, ry: 100, fill: '#e2b08a', stroke: '#b2805a', 'stroke-width': 6 }, his)
        for (let i = 0; i < 4; i++) svg('rect', { x: 600, y: 810 + i * 42, width: 80, height: 36, rx: 18, fill: '#e2b08a', stroke: '#b2805a', 'stroke-width': 5 }, his)
        const st = box(g, '4e STATION', 300, 260, 480, 56)
        return { his, st }
      },
      draw(k, s, t, l) {
        const p = k.ease.io2(k.clamp(l / 0.9))
        s.his.setAttribute('transform', `translate(${-30 * p} ${230 * p})`)
      },
    },
    {
      // S4 · Léa ferme les yeux. Une larme.
      t1: 5.2,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#2a2440')
        const lea = k.makePerson(g, LEA)
        const shadow = k.makePerson(g, HARC)
        shadow.root.setAttribute('filter', 'url(#sil)')
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#lensV)' }, g)
        return { lea, shadow }
      },
      draw(k, s, t, l) {
        s.lea.update(t, { x: 560, y: 1200, scale: 1.35, mouth: 0, brows: 'sad', look: [0.5, 0.7], blink: 1, armR: [0.3, 0.5], armL: [0.3, 0.5], tearT: l * 1.2, headTilt: 0.15, seed: 5 })
        s.shadow.update(t, { x: 1080, y: 1300, scale: 1.4, look: [-0.5, 0.2], seed: 6 })
      },
    },
    {
      // S5 · Moussa se lève : « Toi. Tu descends. »
      t1: 7.6,
      build(k, g) {
        const lights = wagon(k, g)
        const m = k.makePerson(g, MOUSSA)
        return { lights, m }
      },
      draw(k, s, t, l) {
        tunnel(s.lights, t * (l > 1.6 ? 0.2 : 1))
        const up = k.ease.out3(k.clamp(l / 0.6))
        s.m.update(t, { x: 540, y: k.lerp(1600, 1220, up), scale: k.lerp(1.15, 1.32, k.clamp(l / 2.4)), mouth: k.mouth('passager', t), brows: 'determined', look: [-0.1, 0], armR: [0.3, 0.5], armL: [0.3, 0.5], seed: 7 })
      },
    },
    {
      // S6 · Les portes s'ouvrent, il le pousse dehors : VLAN !
      t1: 8.15,
      build(k, g) {
        const { svg, bg, burst, speedLines } = k
        bg(g, '#0a0c12')
        svg('rect', { x: 140, y: 200, width: 800, height: 1500, fill: '#3a3e48' }, g)
        svg('rect', { x: 140, y: 1300, width: 800, height: 400, fill: '#6a6c72' }, g)
        svg('rect', { x: 140, y: 1296, width: 800, height: 18, fill: '#ffffff' }, g)
        const lines = speedLines(g, 40, '#ffffff')
        const h = k.makePerson(g, HARC)
        const doors = [svg('rect', { x: 140, y: 200, width: 400, height: 1500, fill: '#c9d2dc', stroke: '#6a7480', 'stroke-width': 10 }, g), svg('rect', { x: 540, y: 200, width: 400, height: 1500, fill: '#c9d2dc', stroke: '#6a7480', 'stroke-width': 10 }, g)]
        svg('rect', { x: 120, y: 180, width: 840, height: 1540, fill: 'none', stroke: '#2a3240', 'stroke-width': 40 }, g)
        const hands = svg('g', {}, g)
        for (const x of [-170, 170]) {
          svg('path', { d: `M ${x * 1.6} 900 L ${x} 250`, stroke: '#1f2d55', 'stroke-width': 170, 'stroke-linecap': 'round' }, hands)
          svg('circle', { cx: x, cy: 230, r: 80, fill: '#6a4430' }, hands)
        }
        const vlan = burst(g, 'VLAN !', { fill: '#ffd166', ink: '#e5484d', size: 170, r: 280 })
        return { doors, h, hands, vlan, lines }
      },
      draw(k, s, t, l) {
        const open = k.ease.out3(k.clamp(l / 0.12))
        s.doors[0].setAttribute('transform', `translate(${-420 * open} 0)`)
        s.doors[1].setAttribute('transform', `translate(${420 * open} 0)`)
        const push = k.ease.in2(k.clamp((t - 7.62) / 0.3))
        s.h.update(t, { x: 540, y: k.lerp(1150, 1380, push), scale: k.lerp(1.15, 0.75, push), mouth: 0.8, brows: 'surprised', look: [0, -0.4], armR: [2.2, 0.4], armL: [2.2, 0.4], lean: -0.3 * push, seed: 6 })
        s.hands.setAttribute('transform', `translate(540 ${k.lerp(1700, 1200, k.ease.out3(k.clamp((t - 7.6) / 0.15)))})`)
        s.lines.setAttribute('opacity', push > 0.05 ? 1 : 0)
        s.lines.setAttribute('transform', 'translate(540 1100)')
        k.burstAt(s.vlan, t, 7.65, 8.15, 540, 420, -8, 1)
      },
    },
    {
      // S7 · Sur le quai : le téléphone qui glisse ; des cris.
      t1: 8.9,
      build(k, g) {
        const { svg, bg, burst } = k
        bg(g, '#6a6c72')
        for (let y = 0; y < 2000; y += 120) svg('path', { d: `M -100 ${y} L 1200 ${y + 200}`, stroke: '#5a5c62', 'stroke-width': 6 }, g)
        svg('rect', { x: -100, y: 1500, width: 1300, height: 40, fill: '#ffffff' }, g)
        svg('rect', { x: -100, y: 1540, width: 1300, height: 600, fill: '#141518' }, g)
        const legs = svg('g', { filter: 'url(#sil)' }, g)
        svg('path', { d: 'M -60 700 L 320 820 L 300 900 L -60 820 Z M -60 860 L 280 980 L 260 1050 L -60 960 Z', fill: '#000' }, legs)
        const phone = svg('g', {}, g)
        svg('rect', { x: -70, y: -130, width: 140, height: 260, rx: 22, fill: '#10121a' }, phone)
        svg('rect', { x: -58, y: -116, width: 116, height: 232, rx: 14, fill: '#7a5ac8' }, phone)
        const scream = burst(g, 'AAAH !', { fill: '#ffffff', ink: '#e5484d', size: 120, r: 220 })
        return { phone, scream }
      },
      draw(k, s, t, l) {
        const p = k.ease.out3(k.clamp(l / 0.5))
        k.place(s.phone, k.lerp(380, 820, p), k.lerp(1000, 1250, p), 1.3, p * 220)
        k.burstAt(s.scream, t, 8.25, 8.9, 640, 420, 8, 1)
      },
    },
  ],
  sound(a) {
    a.sample('0092', 0, 0.55, { len: 7.6 })
    a.drone(1.1, 6.5, 0.05)
    a.heart(3.2, 2.0, 0.3)
    a.whoosh([1.1, 3.2, 4.2, 5.2, 7.6, 8.15])
    a.sample('0092', 7.2, 0.6, { from: 30, len: 0.6 })
    a.psch(7.6, 0.35)
    a.boom(7.65, 0.7, 100, 36, 0.4)
    a.sample('0103', 7.66, 0.6, { len: 0.4 })
    a.boom(8.15, 0.8, 80, 30, 0.6)
    a.scream(8.25, 0.6, 0.35)
    a.rewind(8.4, 0.5)
  },
}
