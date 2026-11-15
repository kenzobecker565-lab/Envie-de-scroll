/**
 * Hook prototype « La cagnotte » : une influenceuse pleure en story pour Gérard,
 * SDF de 61 ans : « Même deux euros, ça change sa vie ! ». La cagnotte explose :
 * 80 000 €. Gérard ouvre l'enveloppe : 6 000 €. « C'est… c'est tout ? » Story
 * suivante : une Rolex. « Petit cadeau pour moi… je l'ai bien mérité ! » Les
 * commentaires s'enflamment.
 */

const MAELYS = { robe: '#ff9ab0', jabot: false, collar: '#ffe0ea', hair: 'bob', hairColor: '#e8c070', skin: '#f2c8a6', iris: '#3a6a8a', female: true }
const GERARD = { robe: '#5a4a3a', jabot: false, collar: '#3a3026', hair: 'cap', cap: '#2a4a3a', beard: true, hairColor: '#8a8a86', skin: '#d6a07a', iris: '#3a2a1a' }

/** L'interface d'une story : barres de progression, pseudo, abonnés. */
function storyUi(k, g, { live = false } = {}) {
  const { svg, txt } = k
  const ui = svg('g', {}, g)
  const bars = [0, 1, 2].map((i) => {
    svg('rect', { x: 60 + i * 330, y: 60, width: 310, height: 10, rx: 5, fill: '#ffffff', opacity: 0.35 }, ui)
    return svg('rect', { x: 60 + i * 330, y: 60, width: 0, height: 10, rx: 5, fill: '#ffffff' }, ui)
  })
  svg('circle', { cx: 105, cy: 140, r: 38, fill: '#ff9ab0', stroke: '#ffffff', 'stroke-width': 6 }, ui)
  const n = txt(ui, '@maelys.lifestyle', { x: 165, y: 132, 'font-size': 38, fill: '#ffffff', 'text-anchor': 'start' })
  void n
  const subs = txt(ui, '412 k abonnés', { x: 165, y: 172, 'font-size': 30, fill: '#ffffff', 'text-anchor': 'start', opacity: 0.85 })
  if (live) {
    svg('rect', { x: 860, y: 110, width: 150, height: 56, rx: 12, fill: '#fe2c55' }, ui)
    txt(ui, 'LIVE', { x: 935, y: 150, 'font-size': 36, fill: '#ffffff' })
  }
  return { ui, bars, subs }
}
const heartD = 'M 0 30 C -36 6 -60 -14 -48 -38 C -38 -58 -12 -56 0 -36 C 12 -56 38 -58 48 -38 C 60 -14 36 6 0 30 Z'
/** Des cœurs qui montent (réactions en direct). */
function hearts(k, g, n = 14) {
  const r = k.rng(5)
  return Array.from({ length: n }, () => ({ el: k.svg('path', { d: heartD, fill: ['#fe2c55', '#ff9ab0', '#ffd166'][Math.floor(r() * 3)], opacity: 0 }, g), x: 760 + r() * 260, d: r() * 1.2, s: 0.6 + r() * 0.8 }))
}
function drawHearts(k, hs, t, t0) {
  for (const h of hs) {
    const u = ((t - t0 + h.d) % 1.4) / 1.4
    h.el.setAttribute('opacity', (Math.sin(Math.PI * u) * 0.9).toFixed(2))
    k.place(h.el, h.x + 30 * Math.sin(u * 9 + h.d * 5), 1500 - u * 900, h.s, 0)
  }
}
/** Le mascara qui coule (larmes noires). */
function mascara(k, p) {
  return [-1, 1].map((sd) => k.svg('path', { d: `M ${sd * 56} -112 C ${sd * 50} -80 ${sd * 64} -60 ${sd * 58} -20`, fill: 'none', stroke: '#2a2030', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0 }, p.head))
}
const star = 'M 0 -40 L 9 -9 L 40 0 L 9 9 L 0 40 L -9 9 L -40 0 L -9 -9 Z'

export default {
  DUR: 10.9,
  REWIND: 10.4,
  VOICES: [
    { clip: 'influ1c', who: 'influenceuse', label: 'MAËLYS · 412 K ABONNÉS', at: 0.0 },
    { clip: 'gerard2', who: 'gerard', label: 'GÉRARD', at: 4.85 },
    { clip: 'influ2c', who: 'influenceuse2', label: 'MAËLYS · STORY SUIVANTE', at: 6.7 },
  ],
  FLASHES: [3.9],
  SHAKES: [[3.9, 14], [6.7, 10], [8.6, 16]],
  shots: [
    {
      // S1 · Story, en larmes : « Il s'appelle Gérard… »
      t1: 0.85,
      build(k, g) {
        k.bg(g, '#c9b8a6')
        k.svg('rect', { x: -400, y: 1200, width: 1900, height: 1000, fill: '#8a7a6a' }, g)
        const m = k.makePerson(g, MAELYS)
        const tears = mascara(k, m)
        const ui = storyUi(k, g)
        return { m, tears, ui }
      },
      draw(k, s, t) {
        s.m.update(t, { x: 540, y: 1250, scale: 1.4, mouth: k.mouth('influenceuse', t), brows: 'sad', look: [0, 0.1], armR: [2.3, 0.9], armL: [0.3, 0.5], tearT: 0.5 + t, headTilt: 0.1, seed: 2 })
        s.tears.forEach((e) => e.setAttribute('opacity', 0.85))
        s.ui.bars[0].setAttribute('width', Math.min(310, t * 120).toFixed(0))
      },
    },
    {
      // S2 · Gérard, sur son carton, contre le mur du métro.
      t1: 1.5,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#d8d2c4')
        for (let y = 0; y < 1300; y += 70) for (let x = (y / 70) % 2 ? -60 : 0; x < 1100; x += 120) svg('rect', { x, y, width: 116, height: 66, fill: '#ece8de', stroke: '#c9c2b2', 'stroke-width': 4 }, g)
        svg('rect', { x: -400, y: 1300, width: 1900, height: 900, fill: '#7a7468' }, g)
        svg('rect', { x: 120, y: 1240, width: 840, height: 130, fill: '#c8a06a', stroke: '#8a6a40', 'stroke-width': 8 }, g)
        const gp = k.makePerson(g, GERARD)
        const cup = svg('g', {}, g)
        svg('path', { d: 'M -50 -60 L 50 -60 L 38 60 L -38 60 Z', fill: '#ffffff', stroke: '#9aa6b4', 'stroke-width': 6 }, cup)
        const hs = hearts(k, g)
        const ui = storyUi(k, g)
        return { gp, cup, hs, ui }
      },
      draw(k, s, t, l) {
        s.gp.update(t, { x: 520, y: 1180, scale: 1.0, mouth: 0, brows: 'sad', look: [0.2, 0.4], armR: [0.3, 1.4], armL: [0.3, 1.4], headTilt: 0.15, seed: 4 })
        k.place(s.cup, 860, 1300, 1, 0)
        drawHearts(k, s.hs, t, 0.85)
        s.ui.bars[0].setAttribute('width', Math.min(310, t * 120).toFixed(0))
      },
    },
    {
      // S3 · Elle supplie : « Même deux euros, ça change sa vie ! » Le bouton FAIRE UN DON.
      t1: 3.9,
      build(k, g) {
        const { svg, txt } = k
        k.bg(g, '#c9b8a6')
        svg('rect', { x: -400, y: 1200, width: 1900, height: 1000, fill: '#8a7a6a' }, g)
        const m = k.makePerson(g, MAELYS)
        const tears = mascara(k, m)
        const hs = hearts(k, g)
        const btn = svg('g', { opacity: 0 }, g)
        svg('rect', { x: -260, y: -60, width: 520, height: 120, rx: 60, fill: '#12a150', stroke: '#ffffff', 'stroke-width': 8 }, btn)
        txt(btn, 'FAIRE UN DON', { y: 22, 'font-size': 58, fill: '#ffffff' })
        const ui = storyUi(k, g)
        return { m, tears, hs, btn, ui }
      },
      draw(k, s, t, l) {
        s.m.update(t, { x: 540, y: 1200, scale: 1.55 + 0.1 * l, mouth: k.mouth('influenceuse', t), brows: 'sad', look: [0, 0], armR: [0.9, 2.2], armL: [0.9, 2.2], tearT: 1.2 + l, seed: 2 })
        s.tears.forEach((e) => e.setAttribute('opacity', 0.85))
        drawHearts(k, s.hs, t, 1.5)
        const b = k.popS(t, 2.3, Infinity, 0.3)
        s.btn.setAttribute('opacity', b > 0.01 ? 1 : 0)
        k.place(s.btn, 540, 360, b * (1 + 0.05 * Math.sin(t * 12)), -3)
        s.ui.bars[0].setAttribute('width', '310')
        s.ui.bars[1].setAttribute('width', Math.min(310, l * 120).toFixed(0))
      },
    },
    {
      // S4 · La cagnotte explose : 80 000 €.
      t1: 4.8,
      build(k, g) {
        const { svg, txt, bg, speedLines, burst } = k
        bg(g, '#0f3a24')
        const lines = speedLines(g, 50, '#145a34')
        const ph = svg('g', { transform: 'translate(540 900)' }, g)
        svg('rect', { x: -380, y: -560, width: 760, height: 1120, rx: 60, fill: '#10121a' }, ph)
        svg('rect', { x: -350, y: -530, width: 700, height: 1060, rx: 40, fill: '#ffffff' }, ph)
        txt(ph, 'CAGNOTTE POUR GÉRARD', { y: -420, 'font-size': 44, fill: '#10121a' })
        svg('path', { d: heartD, fill: '#fe2c55', transform: 'translate(0 -300) scale(1.4)' }, ph)
        const amount = txt(ph, '0 €', { y: -80, 'font-size': 150, fill: '#12a150' })
        svg('rect', { x: -290, y: 20, width: 580, height: 40, rx: 20, fill: '#e2e6ea' }, ph)
        const bar = svg('rect', { x: -290, y: 20, width: 0, height: 40, rx: 20, fill: '#12a150' }, ph)
        const donors = txt(ph, '', { y: 140, 'font-size': 40, fill: '#5a6270' })
        const coins = Array.from({ length: 16 }, (_, i) => {
          const c = svg('g', { opacity: 0 }, g)
          svg('circle', { r: 40, fill: '#ffd166', stroke: '#a67a10', 'stroke-width': 8 }, c)
          txt(c, '€', { y: 16, 'font-size': 46, fill: '#a67a10' })
          return { c, x: 80 + ((i * 197) % 920), d: (i * 0.137) % 0.9 }
        })
        const boom = burst(g, '80 000 € !', { fill: '#ffd166', ink: '#12a150', size: 120, r: 260 })
        return { lines, amount, bar, donors, coins, boom }
      },
      draw(k, s, t, l) {
        const p = k.ease.out3(k.clamp(l / 0.75))
        s.lines.setAttribute('transform', `translate(540 900) rotate(${t * 30})`)
        s.amount.textContent = `${Math.round(80000 * p).toLocaleString('fr-FR')} €`
        s.bar.setAttribute('width', (580 * p).toFixed(0))
        s.donors.textContent = `${Math.round(6412 * p).toLocaleString('fr-FR')} donateurs`
        for (const c of s.coins) {
          const u = (l + c.d) % 0.9 / 0.9
          c.c.setAttribute('opacity', 1)
          k.place(c.c, c.x, -100 + u * 2200, 1, u * 400)
        }
        k.burstAt(s.boom, t, 4.35, 4.8, 540, 1560, -8, 1)
      },
    },
    {
      // S5 · Gérard ouvre l'enveloppe : 6 000 €. « C'est… c'est tout ? »
      t1: 6.65,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#3a3e48')
        svg('ellipse', { cx: 540, cy: 800, rx: 620, ry: 700, fill: 'url(#lampG)', opacity: 0.5 }, g)
        const gp = k.makePerson(g, GERARD)
        const env = svg('g', {}, g)
        svg('rect', { x: -230, y: -140, width: 460, height: 280, rx: 16, fill: '#f2ead8', stroke: '#b8a888', 'stroke-width': 8 }, env)
        svg('path', { d: 'M -230 -140 L 0 20 L 230 -140', fill: 'none', stroke: '#b8a888', 'stroke-width': 8 }, env)
        const note = svg('g', {}, env)
        svg('rect', { x: -200, y: -300, width: 400, height: 190, rx: 12, fill: '#d9a8c8', stroke: '#8a5a7a', 'stroke-width': 6 }, note)
        txt(note, '6 000 €', { y: -175, 'font-size': 92, fill: '#4a2a3a' })
        return { gp, env, note }
      },
      draw(k, s, t, l) {
        s.gp.update(t, { x: 420, y: 1060, scale: 1.15, mouth: k.mouth('gerard', t), brows: 'sad', look: [0, 0.5], armR: [0.6, 1.9], armL: [0.6, 1.9], headTilt: -0.1, seed: 4 })
        k.place(s.env, 760, 1150, 0.8, -8)
        s.note.setAttribute('transform', `translate(0 ${(-80 * k.ease.out3(k.clamp(l / 0.5))).toFixed(0)})`)
      },
    },
    {
      // S6 · Story suivante : la Rolex. « Petit cadeau pour moi… »
      t1: 8.6,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#f2e6d8')
        svg('rect', { x: -400, y: 1250, width: 1900, height: 900, fill: '#e2d2bc' }, g)
        const arm = svg('g', {}, g)
        svg('path', { d: 'M -300 1100 L 620 940', stroke: '#f2c8a6', 'stroke-width': 190, 'stroke-linecap': 'round' }, arm)
        svg('ellipse', { cx: 700, cy: 925, rx: 120, ry: 100, fill: '#f2c8a6' }, arm)
        const watch = svg('g', { transform: 'translate(420 980) rotate(-10)' }, arm)
        svg('rect', { x: -70, y: -150, width: 140, height: 300, rx: 30, fill: '#d9a930', stroke: '#8a6a10', 'stroke-width': 8 }, watch)
        svg('circle', { r: 95, fill: '#d9a930', stroke: '#8a6a10', 'stroke-width': 10 }, watch)
        svg('circle', { r: 72, fill: '#0f3a24' }, watch)
        for (let i = 0; i < 12; i++) svg('rect', { x: -4, y: -66, width: 8, height: 14, fill: '#ffd166', transform: `rotate(${i * 30})` }, watch)
        const hands = svg('g', {}, watch)
        svg('path', { d: 'M 0 0 L 0 -50 M 0 0 L 34 0', stroke: '#ffffff', 'stroke-width': 8, 'stroke-linecap': 'round' }, hands)
        const sparks = [[300, 820], [560, 860], [360, 1150], [520, 1120]].map(([x, y]) => ({ el: svg('path', { d: star, fill: '#ffffff' }, g), x, y }))
        const ui = storyUi(k, g)
        const tag = svg('g', {}, g)
        svg('rect', { x: -250, y: -50, width: 500, height: 100, rx: 50, fill: '#ffffff', opacity: 0.9 }, tag)
        k.txt(tag, 'CADEAU POUR MOI', { y: 18, 'font-size': 46, fill: '#d9a930' })
        return { arm, hands, sparks, ui, tag }
      },
      draw(k, s, t, l) {
        s.arm.setAttribute('transform', `rotate(${(-6 + 6 * Math.sin(t * 3)).toFixed(2)} 540 960)`)
        s.hands.setAttribute('transform', `rotate(${t * 60})`)
        s.sparks.forEach((sp, i) => {
          const u = Math.max(0, Math.sin(t * 6 + i * 1.7))
          sp.el.setAttribute('opacity', u.toFixed(2))
          k.place(sp.el, sp.x, sp.y, 0.6 + 0.8 * u, t * 90)
        })
        k.place(s.tag, 540, 420, k.popS(t, 6.9, Infinity, 0.3), -4)
        s.ui.bars[2].setAttribute('width', Math.min(310, l * 160).toFixed(0))
      },
    },
    {
      // S7 · « je l'ai bien mérité ! » ; les commentaires s'enflamment.
      t1: 10.9,
      build(k, g) {
        const { svg, txt } = k
        k.bg(g, '#f2e6d8')
        const m = k.makePerson(g, MAELYS)
        const shades = svg('g', {}, m.head)
        for (const sd of [-1, 1]) svg('rect', { x: sd * 56 - 50, y: -175, width: 100, height: 70, rx: 24, fill: '#10121a' }, shades)
        svg('path', { d: 'M -10 -150 L 10 -150', stroke: '#10121a', 'stroke-width': 10 }, shades)
        const ui = storyUi(k, g)
        const msgs = ['ARNAQUEUSE', 'ET GÉRARD ???', 'RENDS L’ARGENT', 'OÙ SONT LES 74 000 € ?', 'SIGNALÉE', 'HONTE À TOI'].map((m, i) => {
          const b = svg('g', { opacity: 0 }, g)
          svg('rect', { x: -20, y: -44, width: 46 + 30 * m.length, height: 80, rx: 40, fill: '#10121a', opacity: 0.85 }, b)
          txt(b, m, { x: 8 + 15 * m.length, y: 12, 'font-size': 46, fill: i % 2 ? '#ffd166' : '#ff6b6b' })
          return b
        })
        return { m, ui, msgs }
      },
      draw(k, s, t, l) {
        s.m.update(t, { x: 540, y: 1250, scale: 1.35, mouth: k.mouth('influenceuse2', t), brows: 'neutral', look: [0.2, 0], armR: [2.4, 0.7], armL: [0.3, 0.5], headTilt: -0.12, seed: 2 })
        s.msgs.forEach((b, i) => {
          const a = 8.9 + i * 0.22
          b.setAttribute('opacity', t >= a ? 1 : 0)
          if (t >= a) k.place(b, 60 + (i % 2) * 120, 1260 - (t - a) * 380, 1, (i % 2 ? 3 : -3))
        })
        s.ui.subs.textContent = `${Math.max(361, Math.round(412 - Math.max(0, t - 8.9) * 40))} k abonnés`
        s.ui.subs.setAttribute('fill', t > 8.9 ? '#ff3b3b' : '#ffffff')
      },
    },
  ],
  sound(a) {
    a.drone(0, 3.9, 0.03)
    a.sample('0621', 0, 0.25, { len: 3.9 })
    a.notif([0.9, 1.2, 1.6, 2.1, 2.5, 3.0])
    a.whoosh([0.85, 1.5, 3.9, 4.8, 6.65, 8.6])
    a.boom(3.9, 0.5, 120, 50, 0.3)
    a.notif([3.95, 4.02, 4.1, 4.16, 4.22, 4.3, 4.36, 4.42, 4.5, 4.58, 4.66, 4.72])
    a.sample('2363', 4.3, 0.35, { len: 0.6 })
    a.sample('0621', 4.8, 0.4, { from: 8, len: 1.85 })
    a.drone(4.8, 1.85, 0.06)
    a.notif([6.7, 6.9])
    a.sample('2390', 6.65, 0.25, { len: 1.9 })
    a.notif([8.9, 9.1, 9.3, 9.5, 9.7, 9.9])
    a.boom(8.6, 0.5, 90, 40, 0.4)
    a.rewind(10.4, 0.5)
  },
}
