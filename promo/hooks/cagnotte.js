/**
 * Hook prototype « La cagnotte » (v5, un seul plan) : le live de la remise.
 * Maëlys filme face caméra, à côté de Gérard : « Les gars, grâce à vous… voilà
 * l'enveloppe pour Gérard ! ». Épinglée en haut du live : « CAGNOTTE · 80 000 €
 * récoltés ». Gérard ouvre l'enveloppe et compte : 12 billets de 500 €, 6 000 €.
 * Bouleversé, il remercie (« Vous m'avez sauvé la vie »). Lui ne sait pas. Le
 * chat, si : « IL Y A QUE 6 000 ??? ». Elle panique : « Euh… on coupe, on
 * coupe ! », la main sur l'objectif. Le live est terminé.
 */

const MAELYS = { robe: '#ff9ab0', jabot: false, collar: '#ffe0ea', hair: 'bob', hairColor: '#e8c070', skin: '#f2c8a6', iris: '#3a6a8a', female: true }
const GERARD = { robe: '#5a4a3a', jabot: false, collar: '#3a3026', hair: 'cap', cap: '#2a4a3a', beard: true, hairColor: '#8a8a86', skin: '#d6a07a', iris: '#3a2a1a' }
const heartD = 'M 0 30 C -36 6 -60 -14 -48 -38 C -38 -58 -12 -56 0 -36 C 12 -56 38 -58 48 -38 C 60 -14 36 6 0 30 Z'

// Les temps forts.
const T = { GIVE: 1.85, TAKE: 2.6, OPEN: 3.3, COUNT: 3.5, COUNT_END: 4.9, CHAT: 5.4, STICKER: 6.0, PANIC: 7.3, HAND: 8.45, END: 9.25, REWIND: 9.7 }
// La caméra : [instant, centre x, centre y, zoom]. Un seul plan : on ne coupe jamais, on cadre.
const CAM = [
  [0, 560, 1040, 1.25],
  [1.7, 560, 1060, 1.3],
  [2.0, 560, 1120, 1.2],
  [3.3, 640, 1180, 1.65],
  [4.95, 640, 1180, 1.65],
  [5.25, 760, 900, 1.3],
  [5.95, 760, 900, 1.35],
  [6.25, 640, 1000, 1.15],
  [7.2, 640, 1000, 1.15],
  [7.45, 330, 930, 1.35],
  [9.25, 330, 930, 1.5],
]
function camAt(k, t) {
  let i = CAM.findIndex((c) => c[0] > t)
  if (i < 0) return CAM.at(-1).slice(1)
  if (i === 0) return CAM[0].slice(1)
  const a = CAM[i - 1]
  const b = CAM[i]
  const p = k.ease.io2(k.clamp((t - a[0]) / Math.min(0.3, b[0] - a[0])))
  return [k.lerp(a[1], b[1], p), k.lerp(a[2], b[2], p), k.lerp(a[3], b[3], p)]
}

export default {
  DUR: 10.2,
  REWIND: T.REWIND,
  VOICES: [
    { clip: 'influ3', who: 'influenceuse', label: 'MAËLYS · EN DIRECT', at: 0.0 },
    { clip: 'gerard4', who: 'gerard', label: 'GÉRARD', at: 4.3 },
    { clip: 'influ4', who: 'influenceuse2', label: 'MAËLYS · EN DIRECT', at: T.PANIC },
  ],
  FLASHES: [],
  SHAKES: [[T.OPEN, 8], [T.CHAT, 10], [T.STICKER, 14], [T.HAND, 18]],
  shots: [
    {
      t1: 10.2,
      build(k, g) {
        const { svg, txt, bg, defs } = k
        bg(g, '#0a0a0c')
        // La scène filmée (tout ce qui bouge avec la caméra).
        const world = svg('g', {}, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 1700, fill: '#d8d2c4' }, world)
        for (let y = 0; y < 1300; y += 70) for (let x = (y / 70) % 2 ? -460 : -400; x < 1500; x += 120) svg('rect', { x, y, width: 116, height: 66, fill: '#ece8de', stroke: '#c9c2b2', 'stroke-width': 4 }, world)
        svg('rect', { x: -400, y: 1300, width: 1900, height: 1100, fill: '#7a7468' }, world)
        svg('rect', { x: 600, y: 1260, width: 520, height: 120, fill: '#c8a06a', stroke: '#8a6a40', 'stroke-width': 8 }, world)
        const gp = k.makePerson(world, GERARD)
        const m = k.makePerson(world, MAELYS)
        // L'enveloppe, puis les billets qui sortent un à un (12 × 500 €).
        const env = svg('g', {}, world)
        svg('rect', { x: -130, y: -80, width: 260, height: 160, rx: 10, fill: '#f2ead8', stroke: '#b8a888', 'stroke-width': 6 }, env)
        const flap = svg('path', { d: 'M -130 -80 L 0 10 L 130 -80', fill: '#efe5d0', stroke: '#b8a888', 'stroke-width': 6 }, env)
        svg('path', { d: heartD, fill: '#fe2c55', transform: 'translate(0 30) scale(0.5)' }, env)
        const bills = Array.from({ length: 12 }, () => {
          const b = svg('g', { opacity: 0 }, world)
          svg('rect', { x: -95, y: -50, width: 190, height: 100, rx: 8, fill: '#c9a8d8', stroke: '#6a4a7a', 'stroke-width': 5 }, b)
          txt(b, '500', { y: 18, 'font-size': 48, fill: '#4a2a5a' })
          return b
        })
        const count = svg('g', { opacity: 0 }, world)
        svg('rect', { x: -170, y: -60, width: 340, height: 120, rx: 20, fill: '#10121a', opacity: 0.85 }, count)
        const countT = txt(count, '', { y: 26, 'font-size': 76, fill: '#ffffff' })
        const ring = svg('ellipse', { rx: 300, ry: 190, fill: 'none', stroke: '#e5484d', 'stroke-width': 12, 'stroke-dasharray': '46 24', opacity: 0 }, world)
        // L'objectif de la caméra : la main qui le couvre.
        const hand = svg('g', { opacity: 0 }, g)
        svg('ellipse', { cx: 540, cy: 1060, rx: 760, ry: 900, fill: '#e8b896' }, hand)
        svg('ellipse', { cx: 380, cy: 860, rx: 260, ry: 340, fill: '#f2c8a6', opacity: 0.6 }, hand)
        // L'interface du live (fixe, par-dessus la caméra).
        const ui = svg('g', {}, g)
        svg('circle', { cx: 105, cy: 120, r: 38, fill: '#ff9ab0', stroke: '#ffffff', 'stroke-width': 6 }, ui)
        txt(ui, '@maelys.lifestyle', { x: 165, y: 112, 'font-size': 38, fill: '#ffffff', 'text-anchor': 'start', stroke: '#10121a', 'stroke-width': 6, 'paint-order': 'stroke fill' })
        const subs = txt(ui, '412 k abonnés', { x: 165, y: 152, 'font-size': 30, fill: '#ffffff', 'text-anchor': 'start', stroke: '#10121a', 'stroke-width': 5, 'paint-order': 'stroke fill' })
        svg('rect', { x: 760, y: 88, width: 120, height: 56, rx: 12, fill: '#fe2c55' }, ui)
        txt(ui, 'LIVE', { x: 820, y: 128, 'font-size': 36, fill: '#ffffff' })
        svg('rect', { x: 890, y: 88, width: 140, height: 56, rx: 12, fill: '#000', opacity: 0.5 }, ui)
        const views = txt(ui, '', { x: 960, y: 128, 'font-size': 34, fill: '#ffffff' })
        // Le widget épinglé de la cagnotte.
        const pin = svg('g', { transform: 'translate(540 260)' }, ui)
        const pinBox = svg('rect', { x: -330, y: -62, width: 660, height: 124, rx: 26, fill: '#ffffff', stroke: '#12a150', 'stroke-width': 6 }, pin)
        svg('path', { d: heartD, fill: '#fe2c55', transform: 'translate(-270 0) scale(0.7)' }, pin)
        txt(pin, 'CAGNOTTE POUR GÉRARD', { x: 20, y: -12, 'font-size': 34, fill: '#10121a' })
        txt(pin, '80 000 € récoltés', { x: 20, y: 36, 'font-size': 40, fill: '#12a150' })
        const hearts = Array.from({ length: 10 }, (_, i) => ({ el: svg('path', { d: heartD, fill: ['#fe2c55', '#ff9ab0', '#ffd166'][i % 3], opacity: 0 }, ui), d: i * 0.13, x: 940 + (i % 3) * 30 }))
        const msgs = [
          ['@lea.b', 'trop émouvant', '#ffffff'],
          ['@sam', 'la cagnotte c’est 80 000 €…', '#ffd166'],
          ['@kz', 'elle est bien fine l’enveloppe', '#ffd166'],
          ['@nono', 'attends… 6 000 ???', '#ff6b6b'],
          ['@jojo', 'IL Y A QUE 6 000 € !!!', '#ff6b6b'],
          ['@yanis', 'OÙ SONT LES 74 000 € ?', '#ff6b6b'],
          ['@inès', 'ARNAQUEUSE', '#ff6b6b'],
          ['@paul', 'j’ai donné 50 € pour ça', '#ffd166'],
          ['@mamie.jo', 'RENDS L’ARGENT', '#ff6b6b'],
        ].map(([w, m2, c]) => {
          const b = svg('g', { opacity: 0 }, ui)
          svg('rect', { x: 0, y: -40, width: 40 + 21 * (w.length + m2.length), height: 74, rx: 37, fill: c === '#ff6b6b' ? '#7a1018' : '#000', opacity: c === '#ffffff' ? 0.55 : 0.85 }, b)
          const t = txt(b, '', { x: 24, y: 12, 'font-size': 36, 'text-anchor': 'start' })
          svg('tspan', { fill: '#9fd0ff', 'font-weight': 900 }, t).textContent = `${w} `
          svg('tspan', { fill: c }, t).textContent = m2
          return b
        })
        // La fin du live.
        const endCard = svg('g', { opacity: 0 }, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#0a0a0c' }, endCard)
        txt(endCard, 'Le LIVE est terminé', { x: 540, y: 900, 'font-size': 70, fill: '#ffffff' })
        txt(endCard, '@maelys.lifestyle', { x: 540, y: 990, 'font-size': 44, fill: '#9aa6b4' })
        void defs
        return { world, gp, m, env, flap, bills, count, countT, ring, hand, subs, views, pinBox, hearts, msgs, endCard }
      },
      draw(k, s, t) {
        // La caméra (tenue à la main : un léger tremblement permanent).
        const [cx, cy, z] = camAt(k, t)
        const jx = 6 * Math.sin(t * 7.3) + 3 * Math.sin(t * 17)
        const jy = 5 * Math.sin(t * 6.1 + 1)
        s.world.setAttribute('transform', `translate(${540 + jx} ${960 + jy}) scale(${z}) translate(${-cx} ${-cy})`)
        // Maëlys : face caméra, le bras tendu (le téléphone) ; elle tend l'enveloppe ; puis panique.
        const panic = t > T.PANIC
        const give = k.ease.out3(k.clamp((t - (T.GIVE - 0.2)) / 0.4)) * (1 - k.ease.io2(k.clamp((t - T.TAKE) / 0.3)))
        s.m.update(t, { x: 300, y: 1150, scale: 0.95, mouth: k.mouth(panic ? 'influenceuse2' : 'influenceuse', t), brows: panic ? 'surprised' : 'neutral', look: panic ? [0.6, 0.2] : [0, 0], armL: [2.5, 0.7], armR: [k.lerp(0.4, 1.3, give), k.lerp(1.0, 0.2, give)], headTilt: panic ? -0.1 : 0.12, seed: 2 })
        // Gérard : il prend l'enveloppe, l'ouvre, compte ; ému aux larmes.
        const holding = t > T.TAKE
        s.gp.update(t, { x: 840, y: 1060, scale: 0.92, mouth: k.mouth('gerard', t), brows: t > T.COUNT_END ? 'sad' : 'surprised', look: t > T.COUNT && t < T.COUNT_END ? [-0.4, 0.6] : [-0.3, 0.1], armR: [0.5, 1.5], armL: holding ? [0.9, 1.0] : [0.3, 0.6], tearT: t > T.COUNT_END ? t - T.COUNT_END : -1, headTilt: 0.08 * Math.sin(t * 2), seed: 4 })
        const ex = holding ? k.lerp(560, 620, k.ease.io2(k.clamp((t - T.TAKE) / 0.35))) : k.lerp(470, 560, give)
        const ey = holding ? 1240 : 1250
        k.place(s.env, ex, ey, 1, holding ? 4 : -6)
        s.flap.setAttribute('transform', t > T.OPEN ? 'translate(0 -80) scale(1 -1) translate(0 80)' : '')
        // Les billets : un par un, en éventail au-dessus de l'enveloppe.
        const n = Math.min(12, Math.max(0, Math.floor((t - T.COUNT) / ((T.COUNT_END - T.COUNT) / 12)) + 1))
        s.bills.forEach((b, i) => {
          const on = t > T.COUNT && i < n
          b.setAttribute('opacity', on ? 1 : 0)
          if (on) {
            const a = (i - 5.5) * 7
            b.setAttribute('transform', `translate(${ex} ${ey - 40}) rotate(${a}) translate(0 -140)`)
          }
        })
        s.count.setAttribute('opacity', t > T.COUNT ? 1 : 0)
        s.countT.textContent = `${(n * 500).toLocaleString('fr-FR')} €`
        s.countT.setAttribute('fill', t > T.COUNT_END ? '#ff6b6b' : '#ffffff')
        k.place(s.count, ex + 120, ey - 350, 1 + (t > T.COUNT_END ? 0.15 * Math.exp(-(t - T.COUNT_END) * 6) : 0), 0)
        s.ring.setAttribute('opacity', t > T.STICKER ? 1 : 0)
        s.ring.setAttribute('transform', `translate(${ex} ${ey - 90}) rotate(${t * 20})`)
        // La main sur l'objectif, puis la fin du live.
        const hv = k.ease.in2(k.clamp((t - T.HAND) / 0.6))
        s.hand.setAttribute('opacity', hv > 0 ? 1 : 0)
        s.hand.setAttribute('transform', `translate(${k.lerp(-700, 0, hv)} ${k.lerp(900, 0, hv)}) rotate(${k.lerp(-25, 0, hv)} 540 960)`)
        s.endCard.setAttribute('opacity', t > T.END ? 1 : 0)
        // L'interface : spectateurs, cœurs, widget, commentaires, abonnés.
        s.views.textContent = `${(12.4 + t * 0.9 + (t > T.CHAT ? (t - T.CHAT) * 6 : 0)).toFixed(1).replace('.', ',')} k`
        s.pinBox.setAttribute('stroke', t > T.STICKER && Math.floor(t * 6) % 2 ? '#e5484d' : '#12a150')
        s.pinBox.setAttribute('stroke-width', t > T.STICKER ? 14 : 6)
        for (const h of s.hearts) {
          const u = ((t + h.d) % 1.3) / 1.3
          h.el.setAttribute('opacity', t < T.CHAT ? (Math.sin(Math.PI * u) * 0.9).toFixed(2) : 0)
          k.place(h.el, h.x + 20 * Math.sin(u * 8 + h.d * 9), 1300 - u * 500, 0.7, 0)
        }
        const times = [0.6, T.GIVE + 0.1, T.TAKE + 0.1, T.COUNT + 0.6, T.COUNT_END - 0.15, T.COUNT_END + 0.4, T.CHAT + 0.3, T.STICKER + 0.2, T.STICKER + 0.6]
        const shown = times.filter((a) => t >= a).length
        s.msgs.forEach((b, i) => {
          const a = times[i]
          const row = shown - 1 - i
          b.setAttribute('opacity', t >= a && row < 4 ? (1 - row * 0.12).toFixed(2) : 0)
          if (t >= a) k.place(b, 30, k.lerp(880, 700, k.ease.io2(k.clamp((t - T.STICKER) / 0.3))) - row * 82 + 30 * Math.exp(-(t - a) * 18), 0.98 + 0.15 * Math.exp(-(t - a) * 10), 0)
        })
        s.subs.textContent = `${Math.max(380, Math.round(412 - Math.max(0, t - T.STICKER) * 12))} k abonnés`
        s.subs.setAttribute('fill', t > T.STICKER ? '#ff6b6b' : '#ffffff')
      },
    },
  ],
  sound(a) {
    // L'ambiance : la rue, les applaudissements, un piano tendre (le faux happy end).
    a.sample('0621', 0, 0.3, { len: T.END })
    a.notif([0.6, 1.4])
    for (const [i, c] of [[60, 64, 67], [57, 60, 64], [53, 57, 60, 65], [55, 59, 62, 67], [60, 64, 67]].entries()) a.chord(i * 0.97, c, 1.05, 0.045)
    a.sample('2363', T.GIVE, 0.3, { len: 1.2 })
    a.rip(T.OPEN - 0.05, 0.25, 0.35)
    // Le comptage : un « tic » par billet, de plus en plus serré.
    for (let i = 0; i < 12; i++) a.notif([T.COUNT + i * ((T.COUNT_END - T.COUNT) / 12)])
    a.boom(T.COUNT_END, 0.35, 90, 40, 0.4)
    // Le chat comprend : le piano se tait, la tension monte.
    a.drone(T.CHAT - 0.1, T.END - T.CHAT, 0.07)
    a.riser(T.CHAT, T.PANIC - T.CHAT, 0.05)
    a.notif([T.GIVE + 0.1, T.TAKE + 0.1, T.COUNT + 0.6, T.COUNT_END - 0.15, T.COUNT_END + 0.4, T.CHAT + 0.3, T.STICKER + 0.2, T.STICKER + 0.6])
    a.boom(T.STICKER, 0.45, 80, 36, 0.5)
    for (let t = T.STICKER; t < T.END; t += 0.42) {
      a.boom(t, 0.3, 60, 38, 0.12)
      a.boom(t + 0.18, 0.2, 55, 35, 0.12)
    }
    // La main sur le micro, la coupure nette.
    a.sample('1035', T.HAND, 0.4, { len: 0.8 })
    a.boom(T.END, 0.6, 50, 26, 0.6)
    a.rewind(T.REWIND, 0.5)
  },
}
