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

/** Maëlys en story (fond, personnage, mascara, interface). */
function maelysShot(k, g, { glasses = false } = {}) {
  k.bg(g, '#c9b8a6')
  k.svg('rect', { x: -400, y: 1200, width: 1900, height: 1000, fill: '#8a7a6a' }, g)
  const m = k.makePerson(g, MAELYS)
  const tears = mascara(k, m)
  return { m, tears }
}
/** La musique : piano faussement triste, puis le beat qui tombe, coupé net sur Gérard, qui revient avec la Rolex. */
const BPM = 124
const BEAT = 60 / BPM
function beat(a, t0, t1, root) {
  for (let t = t0, n = 0; t < t1 - 0.02; t += BEAT / 2, n++) {
    if (n % 4 === 0 || n % 8 === 3) a.kick(t, 0.7)
    if (n % 4 === 2) a.clap(t, 0.35)
    a.hat(t, 0.06)
    if (n % 2 === 1) a.hat(t + BEAT / 4, 0.04)
    if (n % 4 === 0) a.sub(t, root + (n % 16 === 8 ? 3 : 0), BEAT * 1.6, 0.32)
  }
}

export default {
  DUR: 11.35,
  REWIND: 10.85,
  VOICES: [
    { clip: 'influ1c', who: 'influenceuse', label: 'MAËLYS · 412 K ABONNÉS', at: 0.0 },
    { clip: 'gerard2', who: 'gerard', label: 'GÉRARD', at: 5.4 },
    { clip: 'influ2c', who: 'influenceuse2', label: 'MAËLYS · STORY SUIVANTE', at: 7.15 },
  ],
  FLASHES: [3.9, 5.0],
  SHAKES: [[3.9, 16], [4.65, 10], [5.0, 26], [7.15, 8], [9.15, 18]],
  shots: [
    {
      // S1 · Story, en larmes : « Il s'appelle Gérard… »
      t1: 0.85,
      build(k, g) {
        const s = maelysShot(k, g)
        s.ui = storyUi(k, g)
        return s
      },
      draw(k, s, t) {
        s.m.update(t, { x: 540, y: 1250, scale: 1.4 + 0.15 * t, mouth: k.mouth('influenceuse', t), brows: 'sad', look: [0, 0.1], armR: [2.3, 0.9], armL: [0.3, 0.5], tearT: 0.5 + t, headTilt: 0.1, seed: 2 })
        s.tears.forEach((e) => e.setAttribute('opacity', 0.85))
        s.ui.bars[0].setAttribute('width', Math.min(310, t * 120).toFixed(0))
      },
    },
    {
      // S2 · Gérard, sur son carton ; les cœurs montent.
      t1: 1.45,
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
        k.box(g, 'GÉRARD · 61 ANS · 3 ANS À LA RUE', 70, 260, 940, 46)
        return { gp, cup, hs, ui }
      },
      draw(k, s, t, l) {
        s.gp.update(t, { x: 520, y: 1180, scale: 1.0 + 0.1 * l, mouth: 0, brows: 'sad', look: [0.2, 0.4], armR: [0.3, 1.4], armL: [0.3, 1.4], headTilt: 0.15, seed: 4 })
        k.place(s.cup, 860, 1300, 1, 0)
        drawHearts(k, s.hs, t, 0.85)
        s.ui.bars[0].setAttribute('width', Math.min(310, t * 120).toFixed(0))
      },
    },
    {
      // S3 · Très gros plan, les yeux mouillés : « Même deux euros… »
      t1: 2.35,
      build(k, g) {
        return maelysShot(k, g)
      },
      draw(k, s, t, l) {
        s.m.update(t, { x: 540, y: 1700, scale: 2.7 + 0.2 * l, mouth: k.mouth('influenceuse', t), brows: 'sad', look: [0, 0], armR: [0.3, 0.5], armL: [0.3, 0.5], tearT: 1 + l, headTilt: -0.05, seed: 2 })
        s.tears.forEach((e) => e.setAttribute('opacity', 0.9))
      },
    },
    {
      // S4 · Les dons pleuvent : des pouces qui tapent sur DONNER, partout.
      t1: 3.1,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#10121a')
        const cells = [0, 1, 2].map((i) => {
          const c = svg('g', { transform: `translate(${190 + i * 350} ${i % 2 ? 1000 : 820})` }, g)
          svg('rect', { x: -150, y: -280, width: 300, height: 560, rx: 36, fill: '#22252e', stroke: '#3a3e48', 'stroke-width': 8 }, c)
          svg('rect', { x: -120, y: 120, width: 240, height: 80, rx: 40, fill: '#12a150' }, c)
          txt(c, 'DONNER', { y: 174, 'font-size': 40, fill: '#ffffff' })
          txt(c, ['2 €', '20 €', '50 €'][i], { y: -60, 'font-size': 90, fill: '#ffffff' })
          const thumb = svg('ellipse', { cx: 30, cy: 260, rx: 60, ry: 90, fill: '#e2b08a', stroke: '#b2805a', 'stroke-width': 6 }, c)
          return { c, thumb, i }
        })
        const plus = ['+2 €', '+20 €', '+50 €', '+10 €', '+5 €', '+100 €'].map((m) => {
          const b = svg('g', { opacity: 0 }, g)
          txt(b, m, { 'font-size': 70, fill: '#12e070', stroke: '#10121a', 'stroke-width': 10, 'paint-order': 'stroke fill' })
          return b
        })
        return { cells, plus }
      },
      draw(k, s, t, l) {
        s.cells.forEach((c) => {
          const tap = Math.abs(Math.sin((l * 3 + c.i * 0.33) * Math.PI))
          c.thumb.setAttribute('transform', `translate(0 ${(-60 * tap).toFixed(0)})`)
        })
        s.plus.forEach((b, i) => {
          const a = i * 0.11
          const u = l - a
          b.setAttribute('opacity', u > 0 ? Math.max(0, 1 - u * 1.4).toFixed(2) : 0)
          if (u > 0) k.place(b, 160 + ((i * 317) % 760), 1300 - u * 500, 1, 0)
        })
      },
    },
    {
      // S5 · « …ça change sa vie ! » Le bouton FAIRE UN DON.
      t1: 3.9,
      build(k, g) {
        const { svg, txt } = k
        const s = maelysShot(k, g)
        s.hs = hearts(k, g)
        s.btn = svg('g', {}, g)
        svg('rect', { x: -260, y: -60, width: 520, height: 120, rx: 60, fill: '#12a150', stroke: '#ffffff', 'stroke-width': 8 }, s.btn)
        txt(s.btn, 'FAIRE UN DON', { y: 22, 'font-size': 58, fill: '#ffffff' })
        s.ui = storyUi(k, g)
        return s
      },
      draw(k, s, t, l) {
        s.m.update(t, { x: 540, y: 1200, scale: 1.55 + 0.15 * l, mouth: k.mouth('influenceuse', t), brows: 'sad', look: [0, 0], armR: [0.9, 2.2], armL: [0.9, 2.2], tearT: 1.2 + l, seed: 2 })
        s.tears.forEach((e) => e.setAttribute('opacity', 0.85))
        drawHearts(k, s.hs, t, 3.1)
        k.place(s.btn, 540, 360, k.popS(t, 3.12, Infinity, 0.25) * (1 + 0.06 * Math.sin(t * 16)), -3)
        s.ui.bars[0].setAttribute('width', '310')
        s.ui.bars[1].setAttribute('width', Math.min(310, l * 200).toFixed(0))
      },
    },
    {
      // S6 · La cagnotte explose : 80 000 €.
      t1: 4.65,
      build(k, g) {
        const { svg, txt, bg, speedLines, burst } = k
        bg(g, '#0f3a24')
        const lines = speedLines(g, 50, '#145a34')
        const ph = svg('g', { transform: 'translate(540 860)' }, g)
        svg('rect', { x: -380, y: -560, width: 760, height: 1120, rx: 60, fill: '#10121a' }, ph)
        svg('rect', { x: -350, y: -530, width: 700, height: 1060, rx: 40, fill: '#ffffff' }, ph)
        txt(ph, 'CAGNOTTE POUR GÉRARD', { y: -420, 'font-size': 44, fill: '#10121a' })
        svg('path', { d: heartD, fill: '#fe2c55', transform: 'translate(0 -300) scale(1.4)' }, ph)
        const amount = txt(ph, '0 €', { y: -80, 'font-size': 150, fill: '#12a150' })
        svg('rect', { x: -290, y: 20, width: 580, height: 40, rx: 20, fill: '#e2e6ea' }, ph)
        const bar = svg('rect', { x: -290, y: 20, width: 0, height: 40, rx: 20, fill: '#12a150' }, ph)
        const donors = txt(ph, '', { y: 140, 'font-size': 40, fill: '#5a6270' })
        const coins = Array.from({ length: 18 }, (_, i) => {
          const c = svg('g', { opacity: 0 }, g)
          svg('circle', { r: 40, fill: '#ffd166', stroke: '#a67a10', 'stroke-width': 8 }, c)
          txt(c, '€', { y: 16, 'font-size': 46, fill: '#a67a10' })
          return { c, x: 80 + ((i * 197) % 920), d: (i * 0.137) % 0.6 }
        })
        const boom = burst(g, '80 000 € !', { fill: '#ffd166', ink: '#12a150', size: 120, r: 260 })
        return { lines, ph, amount, bar, donors, coins, boom }
      },
      draw(k, s, t, l) {
        const p = k.ease.out3(k.clamp(l / 0.4))
        s.lines.setAttribute('transform', `translate(540 900) rotate(${t * 40})`)
        k.place(s.ph, 540, 860, 1 + 0.06 * Math.exp(-l * 6) * Math.sin(l * 40), 0)
        s.amount.textContent = `${Math.round(80000 * p).toLocaleString('fr-FR')} €`
        s.bar.setAttribute('width', (580 * p).toFixed(0))
        s.donors.textContent = `${Math.round(6412 * p).toLocaleString('fr-FR')} donateurs`
        for (const c of s.coins) {
          const u = ((l + c.d) % 0.6) / 0.6
          c.c.setAttribute('opacity', 1)
          k.place(c.c, c.x, -100 + u * 2200, 1, u * 500)
        }
        k.burstAt(s.boom, t, 4.25, 4.65, 540, 1560, -8, 1.05)
      },
    },
    {
      // S7 · Gros plan : les mains de Gérard déchirent l'enveloppe.
      t1: 5.0,
      build(k, g) {
        const { svg, bg, burst } = k
        bg(g, '#2a2e36')
        const env = svg('g', { transform: 'translate(540 960)' }, g)
        const left = svg('g', {}, env)
        svg('rect', { x: -380, y: -230, width: 380, height: 460, fill: '#f2ead8', stroke: '#b8a888', 'stroke-width': 10 }, left)
        const right = svg('g', {}, env)
        svg('rect', { x: 0, y: -230, width: 380, height: 460, fill: '#f2ead8', stroke: '#b8a888', 'stroke-width': 10 }, right)
        svg('path', { d: 'M 0 -230 L 30 -150 L -20 -60 L 25 40 L -15 130 L 0 230', fill: 'none', stroke: '#b8a888', 'stroke-width': 8 }, env)
        for (const sd of [-1, 1]) {
          const h = svg('g', {}, sd < 0 ? left : right)
          svg('ellipse', { cx: sd * 360, cy: 60, rx: 120, ry: 150, fill: '#d6a07a', stroke: '#a6704a', 'stroke-width': 8 }, h)
        }
        const rip = burst(g, 'SCRITCH !', { fill: '#ffffff', ink: '#10121a', size: 110, r: 230 })
        return { left, right, rip }
      },
      draw(k, s, t, l) {
        const p = k.ease.out3(k.clamp(l / 0.25))
        s.left.setAttribute('transform', `translate(${-90 * p} 0) rotate(${-8 * p})`)
        s.right.setAttribute('transform', `translate(${90 * p} 0) rotate(${8 * p})`)
        k.burstAt(s.rip, t, 4.68, 5.0, 540, 420, -6, 0.95)
      },
    },
    {
      // S8 · Le choc : 80 000 € barré, 6 000 € tamponné.
      t1: 5.4,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#f2ead8')
        const big = svg('g', { transform: 'translate(540 640)' }, g)
        txt(big, '80 000 €', { y: 50, 'font-size': 190, fill: '#12a150' })
        const strike = svg('path', { d: 'M -420 20 L 420 -10', stroke: '#e5484d', 'stroke-width': 30, 'stroke-linecap': 'round', 'stroke-dasharray': 860, 'stroke-dashoffset': 860 }, big)
        const stamp = svg('g', { opacity: 0 }, g)
        svg('rect', { x: -380, y: -130, width: 760, height: 260, rx: 30, fill: 'rgba(255,255,255,0.85)', stroke: '#e5484d', 'stroke-width': 22 }, stamp)
        txt(stamp, '6 000 €', { y: 70, 'font-size': 200, fill: '#e5484d' })
        const label = txt(g, 'POUR GÉRARD', { x: 540, y: 1300, 'font-size': 80, fill: '#10121a' })
        return { strike, stamp, label }
      },
      draw(k, s, t, l) {
        s.strike.setAttribute('stroke-dashoffset', (860 * (1 - k.ease.out3(k.clamp(l / 0.12)))).toFixed(0))
        const v = k.clamp((l - 0.08) / 0.12)
        s.stamp.setAttribute('opacity', v > 0 ? 1 : 0)
        k.place(s.stamp, 540, 1000, k.lerp(2.4, 1, k.ease.out3(v)), -8)
        s.label.setAttribute('opacity', l > 0.2 ? 1 : 0)
      },
    },
    {
      // S9 · Gérard, la pousse-avant sur son visage : « C'est… c'est tout ? »
      t1: 7.15,
      build(k, g) {
        const { svg, bg, txt } = k
        bg(g, '#2a2e36')
        svg('ellipse', { cx: 540, cy: 760, rx: 600, ry: 700, fill: 'url(#lampG)', opacity: 0.45 }, g)
        const gp = k.makePerson(g, GERARD)
        const note = svg('g', {}, g)
        svg('rect', { x: -170, y: -80, width: 340, height: 160, rx: 12, fill: '#d9a8c8', stroke: '#8a5a7a', 'stroke-width': 6 }, note)
        txt(note, '6 000 €', { y: 28, 'font-size': 80, fill: '#4a2a3a' })
        return { gp, note }
      },
      draw(k, s, t, l) {
        const z = 1.2 + 0.5 * k.ease.io2(k.clamp(l / 1.7))
        s.gp.update(t, { x: 540, y: 1150 + 200 * (z - 1.2), scale: z, mouth: k.mouth('gerard', t), brows: 'sad', look: [0, 0.4], armR: [0.6, 1.9], armL: [0.6, 1.9], headTilt: -0.1 + 0.05 * Math.sin(t * 2), seed: 4 })
        k.place(s.note, 540, 1560 + 120 * (z - 1.2), 1, -4)
      },
    },
    {
      // S10 · Story suivante (glissement) : la Rolex. « Petit cadeau pour moi… »
      t1: 9.15,
      enter: 'swipe',
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
        const sparks = [[300, 820], [560, 860], [360, 1150], [520, 1120], [240, 980]].map(([x, y]) => ({ el: svg('path', { d: star, fill: '#ffffff' }, g), x, y }))
        const ui = storyUi(k, g)
        const tag = svg('g', {}, g)
        svg('rect', { x: -250, y: -50, width: 500, height: 100, rx: 50, fill: '#ffffff', opacity: 0.9 }, tag)
        k.txt(tag, 'CADEAU POUR MOI', { y: 18, 'font-size': 46, fill: '#d9a930' })
        const price = svg('g', {}, g)
        svg('rect', { x: -200, y: -50, width: 400, height: 100, rx: 20, fill: '#10121a' }, price)
        k.txt(price, '14 500 €', { y: 20, 'font-size': 60, fill: '#ffd166' })
        return { arm, hands, sparks, ui, tag, price }
      },
      draw(k, s, t, l) {
        const zoom = 1 + 0.12 * k.ease.out3(k.clamp(l / 0.4))
        s.arm.setAttribute('transform', `translate(540 960) scale(${zoom}) rotate(${(-4 + 5 * Math.sin(t * 4)).toFixed(2)}) translate(-540 -960)`)
        s.hands.setAttribute('transform', `rotate(${t * 60})`)
        s.sparks.forEach((sp, i) => {
          const u = Math.max(0, Math.sin(t * 8 + i * 1.7))
          sp.el.setAttribute('opacity', u.toFixed(2))
          k.place(sp.el, sp.x, sp.y, 0.6 + 0.9 * u, t * 120)
        })
        k.place(s.tag, 540, 420, k.popS(t, 7.4, Infinity, 0.25), -4)
        k.place(s.price, 540, 1560, k.popS(t, 8.2, Infinity, 0.2), 3)
        s.ui.bars.forEach((b, i) => b.setAttribute('width', i < 2 ? '310' : Math.min(310, l * 160).toFixed(0)))
      },
    },
    {
      // S11 · « je l'ai bien mérité ! » ; les commentaires s'enflamment.
      t1: 11.35,
      build(k, g) {
        const { svg, txt } = k
        k.bg(g, '#f2e6d8')
        const m = k.makePerson(g, MAELYS)
        const shades = svg('g', {}, m.head)
        for (const sd of [-1, 1]) svg('rect', { x: sd * 56 - 50, y: -175, width: 100, height: 70, rx: 24, fill: '#10121a' }, shades)
        svg('path', { d: 'M -10 -150 L 10 -150', stroke: '#10121a', 'stroke-width': 10 }, shades)
        const ui = storyUi(k, g)
        const msgs = ['ARNAQUEUSE', 'ET GÉRARD ???', 'RENDS L’ARGENT', 'OÙ SONT LES 74 000 € ?', 'SIGNALÉE', 'HONTE À TOI', '-50 K ABONNÉS'].map((m, i) => {
          const b = svg('g', { opacity: 0 }, g)
          svg('rect', { x: -20, y: -44, width: 46 + 30 * m.length, height: 80, rx: 40, fill: '#10121a', opacity: 0.85 }, b)
          txt(b, m, { x: 8 + 15 * m.length, y: 12, 'font-size': 46, fill: i % 2 ? '#ffd166' : '#ff6b6b' })
          return b
        })
        return { m, ui, msgs }
      },
      draw(k, s, t, l) {
        s.m.update(t, { x: 540, y: 1250, scale: 1.35 + 0.1 * l, mouth: k.mouth('influenceuse2', t), brows: 'neutral', look: [0.2, 0], armR: [2.4, 0.7], armL: [0.3, 0.5], headTilt: -0.12, seed: 2 })
        s.msgs.forEach((b, i) => {
          const a = 9.3 + i * 0.18
          b.setAttribute('opacity', t >= a ? 1 : 0)
          if (t >= a) k.place(b, 60 + (i % 2) * 120, 1260 - (t - a) * 420, 1, i % 2 ? 3 : -3)
        })
        s.ui.subs.textContent = `${Math.max(361, Math.round(412 - Math.max(0, t - 9.3) * 40))} k abonnés`
        s.ui.subs.setAttribute('fill', t > 9.3 ? '#ff3b3b' : '#ffffff')
      },
    },
  ],
  sound(a) {
    // Piano faussement triste (la min – fa – do – sol), qui monte vers le drop.
    for (const [i, c] of [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]].entries()) a.chord(i * 2 * BEAT, c, 2 * BEAT + 0.1, 0.05)
    a.riser(2.4, 1.5, 0.05)
    for (let t = 3.1; t < 3.9; t += BEAT / 4) a.clap(t, 0.12 + 0.2 * ((t - 3.1) / 0.8))
    a.notif([0.9, 1.15, 1.4, 2.45, 2.56, 2.67, 2.78, 2.89, 3.0])
    // Le drop : la cagnotte explose.
    beat(a, 3.9, 5.0, 45)
    a.kaching(3.92, 0.18)
    a.kaching(4.3, 0.15)
    a.notif([4.0, 4.06, 4.12, 4.18, 4.24, 4.3, 4.36, 4.42, 4.5])
    a.rip(4.66, 0.3, 0.45)
    // Le choc : disque rayé, coupure, puis le silence de Gérard.
    a.scratch(4.98, 0.3)
    a.boom(5.0, 0.9, 70, 28, 1.2)
    a.drone(5.4, 1.75, 0.06)
    a.sample('0621', 5.4, 0.3, { from: 8, len: 1.75 })
    // Story suivante : le beat revient, plus fier, avec la Rolex.
    a.whoosh([7.15])
    a.kaching(7.2, 0.2)
    beat(a, 7.15, 10.85, 41)
    a.sample('2390', 7.3, 0.2, { len: 1.5 })
    a.notif([9.3, 9.48, 9.66, 9.84, 10.02, 10.2, 10.38])
    a.boom(9.15, 0.4, 90, 40, 0.4)
    a.rewind(10.85, 0.5)
  },
}
