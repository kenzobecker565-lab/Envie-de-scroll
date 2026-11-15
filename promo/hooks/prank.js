/**
 * Hook prototype « Le prank » : un youtubeur en live simule l'enlèvement d'un
 * enfant dans un parc. Un passant surgit et le frappe. Le live tourne encore.
 */

const YT = { robe: '#fe2c55', jabot: false, collar: '#ffffff', hair: 'cap', cap: '#10121a', skin: '#f0c8a0', iris: '#3a5a7a' }
const YT_MASK = { ...YT, hair: 'short' }
/** La cagoule noire (fente pour les yeux, trou pour la bouche), sur la tête du personnage. */
const BALA = 'M 0 -334 C 132 -334 166 -232 161 -130 C 157 -28 106 34 0 36 C -106 34 -157 -28 -161 -130 C -166 -232 -132 -334 0 -334 Z M -114 -190 L 114 -190 Q 122 -142 114 -94 L -114 -94 Q -122 -142 -114 -190 Z M -48 -24 A 48 30 0 1 0 48 -24 A 48 30 0 1 0 -48 -24 Z'
const KID = { robe: '#ffd166', jabot: false, collar: '#3b82f6', hair: 'messy', hairColor: '#7a4a2a', skin: '#f6d0b0', iris: '#3a5a7a' }
const PASSANT = { robe: '#2a3a5a', jabot: false, collar: '#1a2440', hair: 'short', hairColor: '#1a120c', beard: true, skin: '#a8714e', iris: '#1a120c' }

/** Le décor du parc (ciel, arbres, allée). */
function park(k, g) {
  const { svg, bg } = k
  bg(g, 'url(#daySky)')
  for (const [x, y, r] of [[80, 760, 220], [330, 700, 260], [760, 740, 240], [1020, 780, 210]]) {
    svg('rect', { x: x - 22, y, width: 44, height: 360, fill: '#6a4a30' }, g)
    svg('circle', { cx: x, cy: y - 40, r, fill: '#4a8a3a' }, g)
    svg('circle', { cx: x - r * 0.3, cy: y - 90, r: r * 0.6, fill: '#5aa04a' }, g)
  }
  svg('rect', { x: -400, y: 1040, width: 1900, height: 1200, fill: 'url(#lawn)' }, g)
  svg('path', { d: 'M 380 1040 L 700 1040 L 1100 2100 L -100 2100 Z', fill: '#d8c8a4' }, g)
}
/** L'interface du live (pastille LIVE, spectateurs, messages). */
function liveUi(k, g, msgs) {
  const { svg, txt } = k
  const ui = svg('g', {}, g)
  svg('rect', { x: 50, y: 70, width: 150, height: 64, rx: 14, fill: '#fe2c55' }, ui)
  txt(ui, 'LIVE', { x: 125, y: 116, 'font-size': 40, fill: '#ffffff' })
  svg('rect', { x: 214, y: 70, width: 250, height: 64, rx: 14, fill: '#000', opacity: 0.5 }, ui)
  const views = txt(ui, '', { x: 339, y: 116, 'font-size': 38, fill: '#ffffff' })
  const chat = msgs.map(([who, m, c]) => {
    const b = svg('g', { opacity: 0 }, ui)
    svg('rect', { x: 0, y: -40, width: 30 + 23 * (who.length + m.length), height: 74, rx: 37, fill: '#000', opacity: 0.55 }, b)
    const t = txt(b, '', { x: 28, y: 10, 'font-size': 36, fill: '#ffffff', 'text-anchor': 'start' })
    const n = k.svg('tspan', { fill: c, 'font-weight': 900 }, t)
    n.textContent = `${who} `
    k.svg('tspan', {}, t).textContent = m
    return b
  })
  return { views, chat }
}
function drawChat(k, ui, t, t0, every = 0.35, base = 1240) {
  ui.chat.forEach((b, i) => {
    const a = t0 + i * every
    const on = t >= a
    const shown = ui.chat.filter((_, j) => t >= t0 + j * every).length
    b.setAttribute('opacity', on ? 1 : 0)
    if (on) b.setAttribute('transform', `translate(50 ${base - (shown - 1 - i) * 90 + 20 * Math.exp(-(t - a) * 16)})`)
  })
}

export default {
  DUR: 9.3,
  REWIND: 8.8,
  VOICES: [
    { clip: 'youtubeur', who: 'youtubeur', label: 'LE YOUTUBEUR', at: 0.25 },
    { clip: 'passant', who: 'passant', label: 'UN PASSANT', at: 6.4 },
  ],
  FLASHES: [7.75],
  SHAKES: [[5.5, 14], [7.75, 30]],
  shots: [
    {
      // S1 · Le selfie en live : « Les gars… expérience sociale. »
      t1: 2.3,
      build(k, g) {
        park(k, g)
        const yt = k.makePerson(g, YT)
        const ui = liveUi(k, g, [['@nono', 'trop hâte mdr', '#ffd166'], ['@lea.b', 'vas-y fais-le', '#7fd1ff'], ['@kz', 'AHAHAHA', '#ff9ab0']])
        return { yt, ui }
      },
      draw(k, s, t) {
        s.yt.update(t, { x: 540, y: 1260, scale: 1.3, mouth: k.mouth('youtubeur', t), brows: 'neutral', look: [0, 0.1], armR: [2.2, 0.9], armL: [0.3, 0.5], headTilt: 0.1, seed: 2 })
        s.ui.views.textContent = `${(12.4 + t * 0.3).toFixed(1).replace('.', ',')} k`
        drawChat(k, s.ui, t, 0.6, 0.45, 1250)
      },
    },
    {
      // S2 · La cible : un enfant seul sur un banc.
      t1: 3.6,
      build(k, g) {
        const { svg, txt } = k
        park(k, g)
        svg('rect', { x: 200, y: 1170, width: 680, height: 40, rx: 10, fill: '#8a5a30' }, g)
        svg('rect', { x: 200, y: 1080, width: 680, height: 30, rx: 10, fill: '#8a5a30' }, g)
        const kid = k.makePerson(g, KID)
        svg('rect', { x: 240, y: 1210, width: 30, height: 140, fill: '#3a3a3a' }, g)
        svg('rect', { x: 810, y: 1210, width: 30, height: 140, fill: '#3a3a3a' }, g)
        const aim = svg('g', {}, g)
        svg('circle', { r: 230, fill: 'none', stroke: '#ff2a3d', 'stroke-width': 12 }, aim)
        svg('circle', { r: 120, fill: 'none', stroke: '#ff2a3d', 'stroke-width': 8, 'stroke-dasharray': '30 20' }, aim)
        for (const a of [0, 90, 180, 270]) svg('path', { d: 'M 0 -300 L 0 -180', stroke: '#ff2a3d', 'stroke-width': 12, transform: `rotate(${a})` }, aim)
        const label = svg('g', { opacity: 0 }, g)
        svg('rect', { x: -170, y: -50, width: 340, height: 90, rx: 14, fill: '#ff2a3d' }, label)
        txt(label, 'LA CIBLE', { y: 22, 'font-size': 56, fill: '#ffffff' })
        const ui = liveUi(k, g, [['@jojo', 'NAN il va oser ??', '#ffd166'], ['@kz', 'MDRRR', '#ff9ab0']])
        return { kid, aim, label, ui }
      },
      draw(k, s, t, l) {
        s.kid.update(t, { x: 540, y: 960, scale: 0.62, mouth: 0.25, brows: 'neutral', look: [-0.3, 0.3], armR: [0.5, 1.4], armL: [0.5, 1.4], seed: 3 })
        const z = k.ease.out3(k.clamp(l / 0.4))
        k.place(s.aim, 540, 900, k.lerp(2.2, 1, z), t * 40)
        s.label.setAttribute('opacity', l > 0.35 ? 1 : 0)
        k.place(s.label, 540, 560, 1, -3)
        s.ui.views.textContent = '13,1 k'
        drawChat(k, s.ui, t, 2.6, 0.4, 1240)
      },
    },
    {
      // S3 · Il enfile la cagoule : « … et on regarde qui réagit. »
      t1: 5.45,
      build(k, g) {
        park(k, g)
        const yt = k.makePerson(g, YT)
        const ytm = k.makePerson(g, YT_MASK)
        k.svg('path', { d: BALA, 'fill-rule': 'evenodd', fill: '#14161c' }, ytm.head)
        const ui = liveUi(k, g, [['@sam', 'c chaud là', '#7fd1ff'], ['@nono', 'jsuis mort', '#ffd166']])
        const pop = k.burst(g, 'HÉ HÉ…', { fill: '#ffffff', ink: '#10121a', size: 90, r: 180 })
        return { yt, ytm, ui, pop }
      },
      draw(k, s, t, l) {
        const masked = l > 0.75
        k.show(s.yt.root, !masked)
        k.show(s.ytm.root, masked)
        const p = masked ? s.ytm : s.yt
        p.update(t, { x: 540, y: 1260, scale: 1.3, mouth: k.mouth('youtubeur', t), brows: masked ? 'angry' : 'neutral', look: [0.2, 0], armR: [2.2, 0.9], armL: masked ? [0.3, 0.5] : [2.6, 1.6], seed: 2 })
        s.ui.views.textContent = '13,8 k'
        drawChat(k, s.ui, t, 3.9, 0.5, 1250)
        k.burstAt(s.pop, t, 4.4, 5.45, 820, 420, 8, 1)
      },
    },
    {
      // S4 · Il attrape l'enfant, qui hurle : AU SECOURS !
      t1: 6.4,
      build(k, g) {
        const { svg, bg, speedLines } = k
        bg(g, '#c8322a')
        const lines = speedLines(g, 50, '#e05a4a')
        const kid = k.makePerson(g, KID)
        const arm = svg('g', {}, g)
        svg('path', { d: 'M -300 900 C 0 950 200 1100 360 1180', fill: 'none', stroke: '#10121a', 'stroke-width': 150, 'stroke-linecap': 'round' }, arm)
        svg('circle', { cx: 380, cy: 1190, r: 70, fill: '#f0c8a0' }, arm)
        const help = k.burst(g, 'AU SECOURS !', { fill: '#ffd166', ink: '#e5484d', size: 110, r: 280 })
        return { lines, kid, arm, help }
      },
      draw(k, s, t, l) {
        const sh = 14 * Math.sin(t * 40)
        s.lines.setAttribute('transform', `translate(540 900) rotate(${t * 30})`)
        s.kid.update(t, { x: 600 + sh, y: 1150, scale: 1.05, mouth: 1, brows: 'surprised', look: [-0.6, -0.2], armR: [2.4 + 0.3 * Math.sin(t * 30), 0.6], armL: [1.3, 0.2], tearT: l, headTilt: 0.2, lean: -0.08, seed: 3 })
        s.arm.setAttribute('transform', `translate(${sh * 0.6 - 40 * k.ease.out3(k.clamp(l / 0.2))} 0)`)
        k.burstAt(s.help, t, 5.5, 6.4, 540, 400, -6, 1)
      },
    },
    {
      // S5 · Un passant fonce : « LÂCHE-LE ! »
      t1: 7.6,
      build(k, g) {
        const { bg, speedLines } = k
        bg(g, '#1f3a7a')
        const lines = speedLines(g, 50, '#2f52a0')
        const p = k.makePerson(g, PASSANT)
        return { lines, p }
      },
      draw(k, s, t, l) {
        const run = Math.sin(t * 16)
        s.lines.setAttribute('transform', `translate(540 900) rotate(${-t * 25})`)
        s.p.update(t, { x: 540 + 18 * run, y: 1200 + 16 * Math.abs(run), scale: k.lerp(1.0, 1.4, k.ease.in2(k.clamp(l / 1.2))), mouth: k.mouth('passant', t), brows: 'angry', look: [0, 0], armR: [1.0 + 0.5 * run, 1.2], armL: [1.0 - 0.5 * run, 1.2], lean: 0.06 * run, seed: 4 })
      },
    },
    {
      // S6 · Le coup de poing : PAF !
      t1: 8.05,
      build(k, g) {
        const { svg, bg, speedLines, burst } = k
        bg(g, '#ffd166')
        const lines = speedLines(g, 60, '#ffffff')
        const fist = svg('g', {}, g)
        svg('path', { d: 'M -500 700 L -120 140', stroke: '#2a3a5a', 'stroke-width': 260, 'stroke-linecap': 'round' }, fist)
        svg('rect', { x: -230, y: -170, width: 330, height: 280, rx: 90, fill: '#a8714e', stroke: '#10121a', 'stroke-width': 12 }, fist)
        for (let i = 0; i < 4; i++) svg('path', { d: `M ${-200 + i * 75} -150 L ${-200 + i * 75} -60`, stroke: '#6a4430', 'stroke-width': 10, 'stroke-linecap': 'round' }, fist)
        const paf = burst(g, 'PAF !', { fill: '#ffffff', ink: '#e5484d', size: 230, r: 330, points: 18 })
        return { lines, fist, paf }
      },
      draw(k, s, t, l) {
        s.lines.setAttribute('transform', 'translate(540 960)')
        const z = k.ease.in3(k.clamp(l / 0.15))
        k.place(s.fist, k.lerp(900, 640, z), k.lerp(1500, 1080, z), k.lerp(0.6, 1.5, z), -20)
        k.burstAt(s.paf, t, 7.75, 8.05, 520, 640, -10, 1.1)
      },
    },
    {
      // S7 · Le téléphone par terre, l'écran fissuré : le live tourne toujours.
      t1: 9.3,
      build(k, g) {
        const { svg, bg, txt } = k
        bg(g, '#5a8a3a')
        for (let i = 0; i < 60; i++) svg('path', { d: `M ${(i * 137) % 1080} ${(i * 211) % 1920} l 8 -40 l 8 40`, fill: 'none', stroke: '#3a6a2a', 'stroke-width': 6 }, g)
        const ph = svg('g', { transform: 'translate(540 900) rotate(-8)' }, g)
        svg('rect', { x: -330, y: -620, width: 660, height: 1240, rx: 70, fill: '#10121a' }, ph)
        svg('rect', { x: -300, y: -590, width: 600, height: 1180, rx: 50, fill: '#8fc4ef' }, ph)
        svg('rect', { x: -300, y: 60, width: 600, height: 530, rx: 0, fill: '#4a8a3a' }, ph)
        svg('rect', { x: -270, y: -560, width: 110, height: 50, rx: 10, fill: '#fe2c55' }, ph)
        txt(ph, 'LIVE', { x: -215, y: -522, 'font-size': 32, fill: '#ffffff' })
        const views = txt(ph, '', { x: 20, y: -520, 'font-size': 36, fill: '#10121a' })
        const msgs = ['@kz : c’était un prank !!', '@lea.b : il bouge plus ?', '@jojo : APPELEZ LES SECOURS'].map((m, i) => {
          const b = svg('g', { opacity: 0 }, ph)
          svg('rect', { x: -280, y: -36, width: 560, height: 70, rx: 35, fill: '#000', opacity: 0.6 }, b)
          txt(b, m, { x: 0, y: 12, 'font-size': 32, fill: i === 2 ? '#ff6b6b' : '#ffffff' })
          return b
        })
        for (const d of ['M -40 -200 L 60 -40 L -20 120 L 90 300', 'M 60 -40 L 220 -120', 'M -20 120 L -200 200', 'M 90 300 L 40 520']) svg('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': 7 }, ph)
        return { views, msgs }
      },
      draw(k, s, t, l) {
        s.views.textContent = `${Math.round(14 + 34 * k.ease.in2(k.clamp(l / 0.8)))},${Math.floor(t * 7) % 10} k`
        s.msgs.forEach((m, i) => {
          const a = 8.15 + i * 0.25
          m.setAttribute('opacity', t >= a ? 1 : 0)
          m.setAttribute('transform', `translate(0 ${120 + i * 95 + 20 * Math.exp(-(t - a) * 14)})`)
        })
      },
    },
  ],
  sound(a) {
    a.sample('1660', 0, 0.35, { len: 5.5 })
    a.sample('1072', 0, 0.2, { len: 5.5 })
    a.notif([0.6, 1.05, 1.5, 2.6, 3.0, 3.9, 4.4])
    a.whoosh([2.3, 3.6, 5.45, 6.4, 7.6, 8.05])
    a.drone(3.6, 5.2, 0.05)
    a.scream(5.5, 0.85, 0.5)
    a.boom(5.48, 0.5, 100, 40, 0.3)
    a.steps(6.4, 1.2, 0.18)
    a.sample('0597', 7.73, 1.0, { len: 0.35 })
    a.boom(7.75, 0.8, 110, 34, 0.5)
    a.crash(7.76, 0.25)
    a.sample('0771', 8.0, 0.4, { len: 0.8 })
    a.notif([8.15, 8.4, 8.65])
    a.tinnitus(8.05, 0.75, 0.03)
    a.rewind(8.8, 0.5)
  },
}
