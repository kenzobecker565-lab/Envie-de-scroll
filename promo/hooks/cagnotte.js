/**
 * Hook prototype « La cagnotte » : une influenceuse pleure en story pour Gérard,
 * SDF de 61 ans : « Même deux euros, ça change sa vie ! ». La cagnotte explose :
 * 80 000 €. Story suivante : la remise de l'enveloppe ; Gérard, bouleversé : « Merci…
 * merci mademoiselle. Vous m'avez sauvé la vie. » Lui ne sait pas. Nous, on voit :
 * 6 000 € dans l'enveloppe, 80 000 € collectés. Où sont les 74 000 € ?
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
function hearts(k, g, n = 14, x0 = 760) {
  const r = k.rng(5)
  return Array.from({ length: n }, () => ({ el: k.svg('path', { d: heartD, fill: ['#fe2c55', '#ff9ab0', '#ffd166'][Math.floor(r() * 3)], opacity: 0 }, g), x: x0 + r() * (1040 - x0), d: r() * 1.2, s: 0.6 + r() * 0.8 }))
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
  DUR: 10.6,
  REWIND: 10.1,
  VOICES: [
    { clip: 'influ1c', who: 'influenceuse', label: 'MAËLYS · 412 K ABONNÉS', at: 0.0 },
    { clip: 'gerard4', who: 'gerard', label: 'GÉRARD', at: 5.2 },
  ],
  FLASHES: [3.9, 8.35],
  SHAKES: [[3.9, 16], [8.35, 26], [9.0, 18]],
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
      // S7 · Story suivante (glissement) : « LA REMISE » : elle lui tend l'enveloppe, face caméra.
      t1: 5.25,
      enter: 'swipe',
      build(k, g) {
        const { svg, bg, txt } = k
        bg(g, '#d8d2c4')
        for (let y = 0; y < 1300; y += 70) for (let x = (y / 70) % 2 ? -60 : 0; x < 1100; x += 120) svg('rect', { x, y, width: 116, height: 66, fill: '#ece8de', stroke: '#c9c2b2', 'stroke-width': 4 }, g)
        svg('rect', { x: -400, y: 1300, width: 1900, height: 900, fill: '#7a7468' }, g)
        const gp = k.makePerson(g, GERARD)
        const m = k.makePerson(g, MAELYS)
        const env = svg('g', {}, g)
        svg('rect', { x: -130, y: -80, width: 260, height: 160, rx: 10, fill: '#f2ead8', stroke: '#b8a888', 'stroke-width': 6 }, env)
        svg('path', { d: 'M -130 -80 L 0 10 L 130 -80', fill: 'none', stroke: '#b8a888', 'stroke-width': 6 }, env)
        svg('path', { d: heartD, fill: '#fe2c55', transform: 'translate(0 30) scale(0.6)' }, env)
        const hs = hearts(k, g, 12, 940)
        const ui = storyUi(k, g)
        const title = svg('g', {}, g)
        svg('rect', { x: -330, y: -55, width: 660, height: 110, rx: 55, fill: '#ffffff', opacity: 0.92 }, title)
        txt(title, 'LA REMISE À GÉRARD', { y: 20, 'font-size': 56, fill: '#fe2c55' })
        return { gp, m, env, hs, ui, title }
      },
      draw(k, s, t, l) {
        s.gp.update(t, { x: 790, y: 1080, scale: 0.9, brows: 'surprised', look: [-0.5, 0.3], armR: [0.4, 1.2], armL: [1.1, 0.6], seed: 4 })
        s.m.update(t, { x: 300, y: 1160, scale: 0.95, mouth: 0.5, brows: 'neutral', look: [0.2, 0], armR: [1.2, 0.2], armL: [2.5, 0.7], headTilt: 0.12, seed: 2 })
        k.place(s.env, k.lerp(540, 600, k.ease.out3(k.clamp(l / 0.4))), 1260, 1, -6)
        drawHearts(k, s.hs, t, 4.65)
        k.place(s.title, 540, 330, k.popS(t, 4.72, Infinity, 0.25), -3)
      },
    },
    {
      // S8 · Gérard, bouleversé de joie : « Merci… merci mademoiselle… »
      t1: 7.0,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#d8d2c4')
        svg('ellipse', { cx: 540, cy: 760, rx: 640, ry: 760, fill: '#fff3c4', opacity: 0.6 }, g)
        const gp = k.makePerson(g, GERARD)
        const hs = hearts(k, g, 18)
        const ui = storyUi(k, g)
        return { gp, hs, ui }
      },
      draw(k, s, t, l) {
        const z = 1.3 + 0.35 * k.ease.io2(k.clamp(l / 1.75))
        s.gp.update(t, { x: 540, y: 1180 + 180 * (z - 1.3), scale: z, mouth: k.mouth('gerard', t), brows: 'sad', look: [0.2, -0.1], armR: [0.9, 2.1], armL: [0.9, 2.1], tearT: 0.4 + l, headTilt: 0.1 * Math.sin(t * 2.5), seed: 4 })
        drawHearts(k, s.hs, t, 5.25)
      },
    },
    {
      // S9 · « Vous m'avez sauvé la vie. » Il serre l'enveloppe contre lui… et nous, on voit ce qu'il y a dedans.
      t1: 8.35,
      build(k, g) {
        const { svg, bg, txt } = k
        bg(g, '#d8d2c4')
        const gp = k.makePerson(g, GERARD)
        const env = svg('g', {}, g)
        svg('rect', { x: -230, y: -140, width: 460, height: 280, rx: 16, fill: '#f2ead8', stroke: '#b8a888', 'stroke-width': 8 }, env)
        const note = svg('g', {}, env)
        svg('rect', { x: -200, y: -260, width: 400, height: 170, rx: 12, fill: '#d9a8c8', stroke: '#8a5a7a', 'stroke-width': 6 }, note)
        txt(note, '6 000 €', { y: -150, 'font-size': 92, fill: '#4a2a3a' })
        const ring = svg('ellipse', { cx: 0, cy: -175, rx: 280, ry: 140, fill: 'none', stroke: '#e5484d', 'stroke-width': 14, 'stroke-dasharray': '50 26', opacity: 0 }, env)
        return { gp, env, ring }
      },
      draw(k, s, t, l) {
        s.gp.update(t, { x: 540, y: 900, scale: 1.1, mouth: k.mouth('gerard', t), brows: 'sad', look: [0, 0.3], armR: [0.6, 1.9], armL: [0.6, 1.9], tearT: 1.5 + l, seed: 4 })
        k.place(s.env, 540, 1270, 1.0, -4)
        s.ring.setAttribute('opacity', l > 0.5 ? 1 : 0)
        s.ring.setAttribute('transform', `rotate(${t * 15} 0 -175)`)
      },
    },
    {
      // S10 · Le calcul : 80 000 € collectés, 6 000 € donnés.
      t1: 9.0,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#10121a')
        const top = svg('g', { transform: 'translate(540 560)' }, g)
        txt(top, 'COLLECTÉ', { y: -110, 'font-size': 60, fill: '#9aa6b4' })
        txt(top, '80 000 €', { y: 60, 'font-size': 190, fill: '#12e070' })
        const bot = svg('g', { opacity: 0 }, g)
        txt(bot, 'DONNÉ À GÉRARD', { y: -110, 'font-size': 60, fill: '#9aa6b4' })
        svg('rect', { x: -380, y: -70, width: 760, height: 200, rx: 26, fill: 'none', stroke: '#e5484d', 'stroke-width': 18 }, bot)
        txt(bot, '6 000 €', { y: 90, 'font-size': 170, fill: '#e5484d' })
        return { bot }
      },
      draw(k, s, t, l) {
        const v = k.clamp((l - 0.12) / 0.12)
        s.bot.setAttribute('opacity', v > 0 ? 1 : 0)
        k.place(s.bot, 540, 1060, k.lerp(2.2, 1, k.ease.out3(v)), -6)
      },
    },
    {
      // S11 · « 74 000 € ? » Les commentaires s'enflamment, les abonnés fondent.
      t1: 10.6,
      build(k, g) {
        const { svg, txt, bg, speedLines } = k
        bg(g, '#7a1a1a')
        const lines = speedLines(g, 50, '#a0302a')
        const q = svg('g', {}, g)
        txt(q, '74 000 €', { y: 0, 'font-size': 210, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 16, 'paint-order': 'stroke fill' })
        txt(q, 'OÙ SONT-ILS ?', { y: 140, 'font-size': 100, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 12, 'paint-order': 'stroke fill' })
        const ui = storyUi(k, g)
        const msgs = ['ARNAQUEUSE', 'ET LE RESTE ???', 'RENDS L’ARGENT', 'J’AI DONNÉ 50 € POUR ÇA', 'SIGNALÉE', 'HONTE À TOI', '-50 K ABONNÉS'].map((m, i) => {
          const b = svg('g', { opacity: 0 }, g)
          svg('rect', { x: -20, y: -44, width: 46 + 30 * m.length, height: 80, rx: 40, fill: '#10121a', opacity: 0.85 }, b)
          txt(b, m, { x: 8 + 15 * m.length, y: 12, 'font-size': 46, fill: i % 2 ? '#ffd166' : '#ff6b6b' })
          return b
        })
        return { lines, q, ui, msgs }
      },
      draw(k, s, t, l) {
        s.lines.setAttribute('transform', `translate(540 760) rotate(${t * 30})`)
        k.place(s.q, 540, 720, k.popS(t, 9.02, Infinity, 0.2) * (1 + 0.03 * Math.sin(t * 20)), -4)
        s.msgs.forEach((b, i) => {
          const a = 9.15 + i * 0.13
          b.setAttribute('opacity', t >= a ? 1 : 0)
          if (t >= a) k.place(b, 60 + (i % 2) * 120, 1600 - (t - a) * 520, 1, i % 2 ? 3 : -3)
        })
        s.ui.subs.textContent = `${Math.max(361, Math.round(412 - Math.max(0, t - 9.1) * 50))} k abonnés`
        s.ui.subs.setAttribute('fill', '#ff3b3b')
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
    beat(a, 3.9, 4.7, 45)
    a.kaching(3.92, 0.18)
    a.kaching(4.3, 0.15)
    a.notif([4.0, 4.06, 4.12, 4.18, 4.24, 4.3, 4.36, 4.42, 4.5])
    // La remise : piano tendre (faux happy end) sous les remerciements de Gérard.
    a.whoosh([4.65])
    for (const [i, c] of [[60, 64, 67], [57, 60, 64], [53, 57, 60, 65], [55, 59, 62, 67]].entries()) a.chord(4.68 + i * 0.92, c, 1.0, 0.045)
    a.sample('2363', 4.7, 0.25, { len: 0.8 })
    // Le calcul : disque rayé, le beat repart, sombre.
    a.scratch(8.3, 0.3)
    a.boom(8.35, 0.9, 70, 28, 1.0)
    a.kick(9.0, 0.8)
    beat(a, 9.0, 10.1, 41)
    a.notif([9.15, 9.28, 9.41, 9.54, 9.67, 9.8, 9.93])
    a.rewind(10.1, 0.5)
  },
}
