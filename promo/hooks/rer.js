/**
 * Hook prototype « Le RER » (version 2, oppressante) : on est dans la peau de
 * Léa, écrasée dans un wagon bondé. Dès la première image, le visage de
 * l'homme, beaucoup trop près : « Allez… fais pas ta timide. » Sa main sur la
 * sienne. Une grosse main s'abat sur son épaule : « Toi. Tu descends. » Les
 * portes, la poussée, la chute sur le quai.
 */

const LEA = { robe: '#7a5ac8', jabot: false, collar: '#e6dcff', hair: 'bob', hairColor: '#1d140e', skin: '#e8b892', iris: '#3a2a1a', female: true }
const HARC = { robe: '#5a5a52', jabot: false, collar: '#3a3a34', hair: 'slick', hairColor: '#2a1a10', skin: '#e2b08a', iris: '#2b1d12' }
const MOUSSA = { robe: '#1f2d55', jabot: false, collar: '#ffd166', hair: 'short', hairColor: '#10100e', beard: true, skin: '#6a4430', iris: '#1a120c' }

/** Le wagon, vu de très près : barres jaunes, vitres noires, lumières du tunnel qui strient. */
function wagon(k, g, { dim = 0.35 } = {}) {
  const { svg, bg } = k
  bg(g, 'url(#wagon)')
  const lights = []
  for (const x of [-40, 560]) {
    svg('rect', { x, y: 220, width: 520, height: 620, rx: 40, fill: '#07080c', stroke: '#6a7480', 'stroke-width': 16 }, g)
    for (let i = 0; i < 4; i++) lights.push({ el: svg('rect', { x, y: 290 + i * 140, width: 160, height: 12, rx: 6, fill: '#ffd28a', opacity: 0.8 }, g), x0: x })
  }
  for (const x of [150, 930]) svg('rect', { x, y: -100, width: 40, height: 2200, rx: 20, fill: '#f2c230', stroke: '#a67a10', 'stroke-width': 4 }, g)
  const shade = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#1a0a14', opacity: dim }, g)
  return { lights, shade }
}
const tunnel = (w, t) => w.lights.forEach((l, i) => l.el.setAttribute('x', l.x0 + ((t * 2400 + i * 170) % 680) - 140))
/** La foule qui écrase le cadre : épaules et têtes en ombre, au premier plan. */
function crowd(k, g) {
  const { svg } = k
  const c = svg('g', { filter: 'url(#sil)' }, g)
  for (const [x, y, r] of [[-60, 380, 260], [1140, 520, 300], [-40, 1700, 320], [1120, 1650, 300]]) {
    svg('circle', { cx: x, cy: y - r * 1.1, r: r * 0.55, fill: '#000' }, c)
    svg('ellipse', { cx: x, cy: y + r * 0.4, rx: r, ry: r * 0.8, fill: '#000' }, c)
  }
  return c
}
/** Bouge en permanence : secousses du train, cadre penché. */
const lurch = (g, t, rot = 0, amp = 1) => g.setAttribute('transform', `rotate(${rot + 1.5 * amp * Math.sin(t * 3.1)} 540 960) translate(${(10 * amp * Math.sin(t * 13) + 6 * Math.sin(t * 29)).toFixed(1)} ${(8 * amp * Math.sin(t * 11 + 1)).toFixed(1)})`)
/** Un voile sombre qui pulse avec le cœur de Léa. */
function pulse(k, g) {
  return k.svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#lensV)', opacity: 1 }, g)
}
const beat = (t) => Math.max(0, Math.sin(t * Math.PI * 2.6)) ** 8

export default {
  DUR: 6.3,
  REWIND: 5.8,
  VOICES: [
    { clip: 'harceleur2', who: 'harceleur', label: 'UN PASSAGER', at: 0.0 },
    { clip: 'passager2', who: 'passager', label: 'MOUSSA', at: 3.55 },
  ],
  FLASHES: [4.95],
  SHAKES: [[3.55, 22], [4.95, 26], [5.35, 18]],
  shots: [
    {
      // S1 · Son visage, beaucoup trop près, dès la première image : « Allez… »
      t1: 0.8,
      build(k, g) {
        const w = wagon(k, g)
        const h = k.makePerson(g, HARC)
        const c = crowd(k, g)
        const v = pulse(k, g)
        k.box(g, 'RER B · 18 H 40', 60, 120, 520)
        return { w, h, c, v }
      },
      draw(k, s, t, l) {
        tunnel(s.w, t)
        lurch(s.h.root.parentNode, t, -4, 1)
        s.h.update(t, { x: 560, y: 1160, scale: 1.75 + 0.15 * l, mouth: k.mouth('harceleur', t), brows: [4, -0.1], look: [-0.2, 0.2], armR: [0.4, 0.6], armL: [0.4, 0.6], headTilt: -0.3, seed: 6 })
        s.v.setAttribute('opacity', (0.8 + 0.2 * beat(t)).toFixed(2))
      },
    },
    {
      // S2 · Les yeux de Léa : elle regarde ailleurs, le souffle court.
      t1: 1.25,
      build(k, g) {
        const { svg } = k
        const w = wagon(k, g, { dim: 0.55 })
        const lea = k.makePerson(g, LEA)
        const drop = svg('path', { d: 'M 0 0 C 10 14 12 24 0 28 C -12 24 -10 14 0 0 Z', fill: '#cfeaff' }, g)
        const v = pulse(k, g)
        return { w, lea, drop, v }
      },
      draw(k, s, t, l) {
        tunnel(s.w, t)
        s.lea.update(t, { x: 540, y: 1700, scale: 3.2, mouth: 0, brows: 'sad', look: [0.9, 0.5], armR: [0.3, 0.5], armL: [0.3, 0.5], headTilt: 0.1, seed: 5, breathe: 3 })
        k.place(s.drop, 760, 980 + 60 * l, 1.6, 0)
        s.v.setAttribute('opacity', (0.85 + 0.15 * beat(t)).toFixed(2))
        lurch(s.lea.root.parentNode, t, 3, 0.6)
      },
    },
    {
      // S3 · Encore plus près, le cadre penché : « fais pas ta timide. »
      t1: 2.05,
      build(k, g) {
        const w = wagon(k, g, { dim: 0.5 })
        const h = k.makePerson(g, HARC)
        const c = crowd(k, g)
        const v = pulse(k, g)
        return { w, h, c, v }
      },
      draw(k, s, t, l) {
        tunnel(s.w, t)
        s.h.update(t, { x: 600, y: 1240, scale: 2.1 + 0.25 * l, mouth: k.mouth('harceleur', t), brows: [4, -0.1], look: [-0.4, 0.3], armR: [0.4, 0.6], armL: [0.4, 0.6], headTilt: 0.35, seed: 6 })
        lurch(s.h.root.parentNode, t, 7, 1.2)
        s.v.setAttribute('opacity', (0.85 + 0.15 * beat(t)).toFixed(2))
      },
    },
    {
      // S4 · Sur la barre, sa main glisse sur celle de Léa : « souris un peu… »
      t1: 3.0,
      build(k, g) {
        const { svg, bg, box } = k
        bg(g, '#b9c2cc')
        svg('rect', { x: 470, y: -100, width: 140, height: 2200, rx: 70, fill: '#f2c230', stroke: '#a67a10', 'stroke-width': 10 }, g)
        const her = svg('g', {}, g)
        svg('path', { d: 'M 1300 1250 L 640 1180', stroke: '#7a5ac8', 'stroke-width': 170, 'stroke-linecap': 'round' }, her)
        svg('ellipse', { cx: 560, cy: 1160, rx: 110, ry: 90, fill: '#e8b892', stroke: '#b88862', 'stroke-width': 6 }, her)
        for (let i = 0; i < 4; i++) svg('rect', { x: 460, y: 1090 + i * 40, width: 70, height: 34, rx: 17, fill: '#e8b892', stroke: '#b88862', 'stroke-width': 5 }, her)
        const his = svg('g', {}, g)
        svg('path', { d: 'M -300 300 L 440 820', stroke: '#5a5a52', 'stroke-width': 180, 'stroke-linecap': 'round' }, his)
        svg('ellipse', { cx: 520, cy: 880, rx: 120, ry: 100, fill: '#e2b08a', stroke: '#b2805a', 'stroke-width': 6 }, his)
        for (let i = 0; i < 4; i++) svg('rect', { x: 600, y: 810 + i * 42, width: 80, height: 36, rx: 18, fill: '#e2b08a', stroke: '#b2805a', 'stroke-width': 5 }, his)
        const v = pulse(k, g)
        const st = box(g, '4e STATION. PERSONNE NE BOUGE.', 70, 240, 940, 50)
        return { his, v, st }
      },
      draw(k, s, t, l) {
        const p = k.ease.io2(k.clamp(l / 0.75))
        s.his.setAttribute('transform', `translate(${-30 * p} ${230 * p})`)
        s.v.setAttribute('opacity', (0.85 + 0.15 * beat(t)).toFixed(2))
        lurch(s.his.parentNode, t, -3, 0.8)
      },
    },
    {
      // S5 · « ma belle. » Les visages se referment autour d'elle ; une larme.
      t1: 3.55,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#1a1020')
        const lea = k.makePerson(g, LEA)
        const ring = svg('g', { filter: 'url(#sil)' }, g)
        const heads = [[-120, 500], [1200, 520], [-160, 1300], [1240, 1260], [540, 2050]].map(([x, y]) => {
          const hh = svg('g', {}, ring)
          svg('circle', { cy: -260, r: 190, fill: '#000' }, hh)
          svg('ellipse', { cy: 160, rx: 360, ry: 300, fill: '#000' }, hh)
          return { hh, x, y }
        })
        const v = pulse(k, g)
        return { lea, heads, v }
      },
      draw(k, s, t, l) {
        const close = k.ease.in2(k.clamp(l / 0.55))
        s.lea.update(t, { x: 540, y: 1250, scale: 1.4, mouth: 0, brows: 'sad', look: [0, 0.6], blink: 1, armR: [0.3, 0.5], armL: [0.3, 0.5], tearT: 0.6 + l * 1.5, seed: 5 })
        for (const h of s.heads) k.place(h.hh, k.lerp(h.x, (h.x + 540) / 2, close * 0.45), k.lerp(h.y, (h.y + 960) / 2, close * 0.45), 1, 0)
        s.v.setAttribute('opacity', 1)
      },
    },
    {
      // S6 · Une grosse main s'abat sur son épaule : « Toi. Tu descends. »
      t1: 4.95,
      build(k, g) {
        const { svg, burst } = k
        const w = wagon(k, g, { dim: 0.2 })
        const m = k.makePerson(g, MOUSSA)
        const h = k.makePerson(g, HARC)
        const hand = svg('g', {}, g)
        svg('path', { d: 'M 760 1200 L 600 1370', stroke: '#1f2d55', 'stroke-width': 120, 'stroke-linecap': 'round' }, hand)
        svg('ellipse', { cx: 585, cy: 1395, rx: 100, ry: 80, fill: '#6a4430', stroke: '#3a2418', 'stroke-width': 8 }, hand)
        const clap = burst(g, 'CLAP !', { fill: '#ffffff', ink: '#10121a', size: 110, r: 200 })
        return { w, m, h, hand, clap }
      },
      draw(k, s, t, l) {
        tunnel(s.w, t * 0.3)
        const slam = k.ease.out3(k.clamp(l / 0.12))
        s.m.update(t, { x: 620, y: 1060, scale: 1.25, mouth: k.mouth('passager', t), brows: 'determined', look: [-0.3, 0.2], armR: [0.3, 0.5], armL: [0.3, 0.5], seed: 7 })
        s.h.update(t, { x: 330, y: 1300, scale: 1.25, mouth: l > 0.15 ? 0.5 : 0, brows: l > 0.15 ? 'surprised' : [4, -0.1], look: [0.7, -0.3], armR: [0.3, 0.5], armL: [0.3, 0.5], headTilt: 0.25, seed: 6 })
        s.hand.setAttribute('transform', `translate(0 ${k.lerp(-220, 0, slam)})`)
        k.burstAt(s.clap, t, 3.58, 3.95, 640, 520, -8, 0.9)
        lurch(s.m.root.parentNode, t, 0, 0.5)
      },
    },
    {
      // S7 · Les portes s'ouvrent, il le pousse dehors : VLAN !
      t1: 5.3,
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
        const open = k.ease.out3(k.clamp(l / 0.08))
        s.doors[0].setAttribute('transform', `translate(${-420 * open} 0)`)
        s.doors[1].setAttribute('transform', `translate(${420 * open} 0)`)
        const push = k.ease.in2(k.clamp((l - 0.05) / 0.25))
        s.h.update(t, { x: 540, y: k.lerp(1150, 1400, push), scale: k.lerp(1.2, 0.7, push), mouth: 0.8, brows: 'surprised', look: [0, -0.4], armR: [2.2, 0.4], armL: [2.2, 0.4], lean: -0.3 * push, seed: 6 })
        s.hands.setAttribute('transform', `translate(540 ${k.lerp(1700, 1200, k.ease.out3(k.clamp(l / 0.12)))})`)
        s.lines.setAttribute('transform', 'translate(540 1100)')
        k.burstAt(s.vlan, t, 4.98, 5.3, 540, 420, -8, 1)
      },
    },
    {
      // S8 · Sur le quai : le téléphone qui glisse ; des cris.
      t1: 6.3,
      build(k, g) {
        const { svg, bg, burst } = k
        bg(g, '#6a6c72')
        for (let y = 0; y < 2000; y += 120) svg('path', { d: `M -100 ${y} L 1200 ${y + 200}`, stroke: '#5a5c62', 'stroke-width': 6 }, g)
        svg('rect', { x: -100, y: 1500, width: 1300, height: 40, fill: '#ffffff' }, g)
        svg('rect', { x: -100, y: 1540, width: 1300, height: 600, fill: '#141518' }, g)
        const phone = svg('g', {}, g)
        svg('rect', { x: -70, y: -130, width: 140, height: 260, rx: 22, fill: '#10121a' }, phone)
        svg('rect', { x: -58, y: -116, width: 116, height: 232, rx: 14, fill: '#7a5ac8' }, phone)
        const scream = burst(g, 'AAAH !', { fill: '#ffffff', ink: '#e5484d', size: 120, r: 220 })
        return { phone, scream }
      },
      draw(k, s, t, l) {
        const p = k.ease.out3(k.clamp(l / 0.5))
        k.place(s.phone, k.lerp(300, 820, p), k.lerp(900, 1250, p), 1.4, p * 260)
        k.burstAt(s.scream, t, 5.4, 6.3, 640, 420, 8, 1)
      },
    },
  ],
  sound(a) {
    a.sample('0092', 0, 0.75, { from: 4, len: 4.95 })
    a.drone(0, 4.9, 0.08)
    a.riser(0, 3.55, 0.05)
    a.heart(0.05, 3.5, 0.45, 0.42)
    a.whoosh([0.8, 1.25, 2.05, 3.0, 3.55, 4.95, 5.3])
    a.sample('0597', 3.56, 0.6, { len: 0.3 })
    a.boom(3.56, 0.5, 110, 50, 0.2)
    a.psch(4.93, 0.4)
    a.boom(4.98, 0.75, 100, 36, 0.4)
    a.sample('0103', 4.99, 0.6, { len: 0.4 })
    a.boom(5.3, 0.8, 80, 30, 0.6)
    a.scream(5.4, 0.6, 0.35)
    a.rewind(5.8, 0.5)
  },
}
