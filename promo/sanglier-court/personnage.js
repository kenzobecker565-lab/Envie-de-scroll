/**
 * Personnage en motion design 2D (SVG) : buste, tête expressive, bras articulés.
 * Tout est dessiné avec des formes simples et des aplats, un côté ombré et un
 * liseré de lumière, comme dans les vidéos d'explication animées.
 *
 *   const p = makePerson(svgGroup, { robe: '#c0392b', hair: 'slick', ... })
 *   p.update(t, { mouth, brows: 'angry', look: [x, y], blink, armR: [épaule, coude], point: true })
 */

const NS = 'http://www.w3.org/2000/svg'
let UID = 0
function svg(tag, attrs = {}, parent = null) {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  if (parent) parent.append(el)
  return el
}

const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function makePerson(parent, o = {}) {
  const { skin = '#f1c6a0', robe = '#c0392b', jabot = true, hair = 'slick', hairColor = '#3b2416', beard = false, iris = '#3b2a1a', collar = null, female = false, vneck = null, mask = false, gloves = null, cap = null, suit = null, shirt = '#f7f4ee', tie = '#b3232b', tieStripe = null, pocket = null, trousers = null, shoes = '#17181d', legs = true } = o
  const handColor = gloves ?? skin
  const root = svg('g', {}, parent)
  const body = svg('g', {}, root)
  const ink = shade(skin, -0.55)

  // Ombre portée douce derrière le personnage.
  const uid = `p${++UID}`
  const defs = svg('defs', {}, root)
  const lin = (id, stops, attrs) => {
    const g = svg('linearGradient', { id: `${uid}-${id}`, ...attrs }, defs)
    for (const [off, c, a = 1] of stops) svg('stop', { offset: off, 'stop-color': c, 'stop-opacity': a }, g)
    return `url(#${uid}-${id})`
  }
  const standing = suit && legs
  svg('ellipse', { cx: 10, cy: standing ? 846 : 330, rx: standing ? 260 : 330, ry: standing ? 36 : 60, fill: '#000', opacity: standing ? 0.28 : 0.18 }, body)

  // Bras gauche (derrière), le torse, puis le bras droit (devant).
  const arm = (side) => {
    const g = svg('g', {}, body)
    const cloth = suit ?? robe
    const upper = svg('path', { fill: 'none', stroke: cloth, 'stroke-width': suit ? 84 : 92, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)
    const upperShade = svg('path', { fill: 'none', stroke: shade(cloth, -0.3), 'stroke-width': suit ? 34 : 40, 'stroke-linecap': 'round', opacity: 0.55 }, g)
    const cuff = svg('circle', { r: suit ? 36 : 40, fill: suit ? shirt : shade(robe, 0.55) }, g)
    const hand = svg('g', {}, g)
    svg('circle', { r: 44, fill: handColor }, hand)
    svg('circle', { r: 44, fill: ink, opacity: 0.12, cx: side * 8, cy: 8 }, hand)
    const finger = svg('rect', { x: -14, y: -96, width: 28, height: 70, rx: 14, fill: handColor }, hand)
    return { g, upper, upperShade, cuff, hand, finger, side }
  }
  const armL = arm(-1)
  const torso = svg('g', {}, body)
  if (suit) drawSuit()
  else {
    // Torse : robe aux épaules arrondies.
    svg('path', { d: 'M -260 340 C -270 160 -230 40 -150 10 L 150 10 C 230 40 270 160 260 340 Z', fill: robe }, torso)
    svg('path', { d: 'M 60 20 L 150 10 C 230 40 270 160 260 340 L 90 340 Z', fill: shade(robe, -0.22), opacity: 0.6 }, torso)
    svg('path', { d: 'M -240 300 C -250 170 -220 60 -150 20', fill: 'none', stroke: shade(robe, 0.35), 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.7 }, torso)
  }
  // Costume trois pièces : pantalon et chaussures, veste à revers crantés,
  // chemise, cravate, pochette. La lumière vient de la gauche.
  function drawSuit() {
    const tr = trousers ?? shade(suit, -0.08)
    const line = shade(suit, -0.45)
    if (legs) {
      const leg = svg('g', {}, torso)
      svg('path', { d: 'M -150 400 L 150 400 L 136 800 L 28 800 L 6 486 L -6 486 L -28 800 L -136 800 Z', fill: lin('tr', [[0, shade(tr, 0.1)], [0.55, tr], [1, shade(tr, -0.3)]], { x1: 0, y1: 0, x2: 1, y2: 0 }) }, leg)
      for (const sd of [-1, 1]) svg('path', { d: `M ${sd * 84} 470 L ${sd * 82} 796`, stroke: shade(tr, sd < 0 ? 0.2 : -0.4), 'stroke-width': 5, opacity: 0.7 }, leg)
      // Chaussures de ville, cirées.
      for (const sd of [-1, 1]) {
        svg('path', { d: `M ${sd * 28} 790 L ${sd * 140} 790 C ${sd * 176} 796 ${sd * 186} 822 ${sd * 176} 842 L ${sd * 22} 842 C ${sd * 16} 822 ${sd * 20} 800 ${sd * 28} 790 Z`, fill: shoes }, leg)
        svg('path', { d: `M ${sd * 104} 802 C ${sd * 142} 800 ${sd * 162} 810 ${sd * 166} 822`, fill: 'none', stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.35 }, leg)
        svg('rect', { x: sd < 0 ? -140 : 28, y: 784, width: 112, height: 12, rx: 4, fill: shade(tr, -0.35) }, leg)
      }
    }
    // Veste.
    const jacket = lin('jk', [[0, shade(suit, 0.16)], [0.42, suit], [1, shade(suit, -0.32)]], { x1: 0, y1: 0, x2: 1, y2: 0 })
    svg('path', { d: 'M -140 0 C -188 6 -220 34 -226 92 L -196 290 C -194 350 -198 400 -194 444 L 194 444 C 198 400 194 350 196 290 L 226 92 C 220 34 188 6 140 0 Z', fill: jacket }, torso)
    // Ouverture basse de la veste (on voit le pantalon entre les pans).
    svg('path', { d: 'M 2 330 C 12 380 44 420 84 446 L -84 446 C -44 420 -12 380 -2 330 Z', fill: shade(trousers ?? shade(suit, -0.08), -0.1) }, torso)
    svg('path', { d: 'M 2 330 C 12 380 44 420 84 446', fill: 'none', stroke: line, 'stroke-width': 5, opacity: 0.6 }, torso)
    svg('rect', { x: -46, y: -60, width: 92, height: 84, rx: 30, fill: skin }, torso)
    svg('rect', { x: -46, y: -14, width: 92, height: 34, rx: 14, fill: ink, opacity: 0.2 }, torso)
    // Chemise dans le V, col et cravate.
    svg('path', { d: 'M -70 -2 L 70 -2 L 2 258 Z', fill: shirt }, torso)
    svg('path', { d: 'M 20 -2 L 70 -2 L 2 258 Z', fill: shade(shirt, -0.12) }, torso)
    if (tie) {
      svg('path', { d: 'M -14 58 L 14 58 L 32 206 L 2 248 L -28 206 Z', fill: lin('tie', [[0, shade(tie, 0.15)], [0.5, tie], [1, shade(tie, -0.3)]], { x1: 0, y1: 0, x2: 1, y2: 0 }) }, torso)
      if (tieStripe) for (let k = 0; k < 5; k++) svg('path', { d: `M -30 ${96 + k * 30} L 30 ${70 + k * 30}`, stroke: tieStripe, 'stroke-width': 7, opacity: 0.8, 'clip-path': `url(#${uid}-tieclip)` }, torso)
      const clip = svg('clipPath', { id: `${uid}-tieclip` }, defs)
      svg('path', { d: 'M -14 58 L 14 58 L 32 206 L 2 248 L -28 206 Z' }, clip)
      svg('path', { d: 'M -22 18 L 22 18 L 15 60 L -13 60 Z', fill: shade(tie, -0.08) }, torso)
      svg('path', { d: 'M -14 26 L 10 26', stroke: shade(tie, 0.35), 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.7 }, torso)
    }
    for (const sd of [-1, 1]) svg('path', { d: `M ${sd * 70} -10 L ${sd * 6} 34 L ${sd * 40} 66 L ${sd * 84} 12 Z`, fill: sd < 0 ? shirt : shade(shirt, -0.08) }, torso)
    // Revers crantés.
    for (const sd of [-1, 1]) {
      const lap = `M ${sd * 72} -6 L ${sd * 2} 262 L ${sd * 52} 176 L ${sd * 128} 96 L ${sd * 104} 78 L ${sd * 118} 58 L ${sd * 96} 6 Z`
      svg('path', { d: lap, fill: sd < 0 ? shade(suit, 0.12) : shade(suit, -0.2) }, torso)
      svg('path', { d: `M ${sd * 2} 262 L ${sd * 52} 176 L ${sd * 128} 96 L ${sd * 104} 78 L ${sd * 118} 58`, fill: 'none', stroke: line, 'stroke-width': 5, 'stroke-linejoin': 'round', opacity: 0.55 }, torso)
    }
    // Boutons, poches, pochette.
    for (const y of [286, 344]) svg('circle', { cx: 4, cy: y, r: 9, fill: shade(suit, -0.5) }, torso)
    for (const sd of [-1, 1]) svg('path', { d: `M ${sd * 64} 372 L ${sd * 160} 366`, stroke: line, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.5 }, torso)
    svg('path', { d: 'M 92 164 L 160 158', stroke: line, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.5 }, torso)
    if (pocket) svg('path', { d: 'M 98 162 L 112 132 L 126 152 L 140 126 L 154 158 Z', fill: pocket }, torso)
    // Liseré de lumière à gauche, ombre à droite.
    svg('path', { d: 'M -198 290 L -224 100 C -220 44 -190 12 -150 6', fill: 'none', stroke: shade(suit, 0.45), 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.55 }, torso)
  }
  // Tenue de bloc : col en V.
  if (vneck) svg('path', { d: 'M -70 12 L 0 120 L 70 12 Z', fill: vneck }, torso)
  if (collar) {
    svg('path', { d: 'M -90 10 Q 0 70 90 10 L 70 0 Q 0 40 -70 0 Z', fill: collar }, torso)
  }
  // Cou.
  if (!suit) {
    svg('rect', { x: -48, y: -60, width: 96, height: 90, rx: 30, fill: skin }, torso)
    svg('rect', { x: -48, y: -20, width: 96, height: 40, rx: 16, fill: ink, opacity: 0.18 }, torso)
  }
  if (jabot && !suit) {
    for (const s of [-1, 1]) svg('path', { d: `M ${s * 4} 20 L ${s * 44} 26 L ${s * 34} 150 L ${s * 6} 140 Z`, fill: '#fbf7ef' }, torso)
    svg('path', { d: 'M -44 26 L 0 60 L 44 26', fill: 'none', stroke: '#e5ddd0', 'stroke-width': 6 }, torso)
  }
  const armR = arm(1)

  // Tête.
  const head = svg('g', {}, root)
  const face = svg('g', {}, head)
  if (hair === 'bun') svg('circle', { cx: 10, cy: -335, r: 74, fill: hairColor }, face)
  // Oreilles.
  for (const s of [-1, 1]) {
    svg('ellipse', { cx: s * 132, cy: -120, rx: 30, ry: 42, fill: skin }, face)
    svg('ellipse', { cx: s * 134, cy: -118, rx: 14, ry: 22, fill: ink, opacity: 0.2 }, face)
  }
  // Crâne : un ovale large et doux.
  svg('path', { d: 'M 0 -300 C 120 -300 150 -220 148 -130 C 146 -40 100 20 0 22 C -100 20 -146 -40 -148 -130 C -150 -220 -120 -300 0 -300 Z', fill: skin }, face)
  // Côté à l'ombre (la lumière vient de la gauche).
  svg('path', { d: 'M 40 -298 C 130 -290 150 -210 148 -130 C 146 -40 100 20 0 22 C 70 0 110 -60 112 -140 C 114 -220 90 -280 40 -298 Z', fill: ink, opacity: 0.14 }, face)
  // Joues.
  for (const s of [-1, 1]) svg('ellipse', { cx: s * 82, cy: -70, rx: 30, ry: 18, fill: '#ff7b6b', opacity: 0.28 }, face)
  // Barbe.
  if (beard) svg('path', { d: 'M -140 -110 C -140 -10 -80 40 0 42 C 80 40 140 -10 140 -110 C 120 -60 90 -30 60 -40 C 30 -50 -30 -50 -60 -40 C -90 -30 -120 -60 -140 -110 Z', fill: hairColor }, face)
  // Yeux.
  const eyes = [-1, 1].map((s) => {
    const g = svg('g', { transform: `translate(${s * 56} -140)` }, face)
    const inner = svg('g', {}, g)
    svg('ellipse', { rx: 34, ry: 38, fill: '#ffffff' }, inner)
    const pupil = svg('g', {}, inner)
    svg('circle', { r: 21, fill: iris }, pupil)
    svg('circle', { r: 11, fill: '#120c08' }, pupil)
    svg('circle', { r: 7, cx: 7, cy: -8, fill: '#ffffff' }, pupil)
    if (female) svg('path', { d: `M ${-s * 38} -16 Q 0 -52 ${s * 40} -20 L ${s * 50} -34`, fill: 'none', stroke: '#1d1410', 'stroke-width': 7, 'stroke-linecap': 'round' }, inner)
    return { g, inner, pupil }
  })
  // Sourcils.
  const browEls = [-1, 1].map(() => svg('path', { fill: 'none', stroke: hairColor, 'stroke-width': 20, 'stroke-linecap': 'round' }, face))
  // Nez.
  svg('path', { d: 'M -6 -112 Q -20 -70 -4 -62 Q 10 -58 22 -66', fill: 'none', stroke: ink, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.5 }, face)
  // Bouche.
  const mouthG = svg('g', { transform: 'translate(0 -24)' }, face)
  const mouthOpen = svg('path', { fill: '#5a1a1c' }, mouthG)
  const teeth = svg('rect', { x: -26, width: 52, height: 12, rx: 5, fill: '#fffaf2' }, mouthG)
  const tongue = svg('ellipse', { rx: 20, ry: 9, fill: '#e06a6e' }, mouthG)
  const mouthLine = svg('path', { fill: 'none', stroke: '#5a1a1c', 'stroke-width': 9, 'stroke-linecap': 'round' }, mouthG)
  // Masque chirurgical baissé sous le menton.
  if (mask) {
    svg('path', { d: 'M -118 -10 Q 0 30 118 -10 L 104 60 Q 0 96 -104 60 Z', fill: '#bfe3ff' }, face)
    for (const y of [10, 34]) svg('path', { d: `M -96 ${y} Q 0 ${y + 30} 96 ${y}`, fill: 'none', stroke: '#8cc4ea', 'stroke-width': 5 }, face)
    for (const sd of [-1, 1]) svg('path', { d: `M ${sd * 116} -6 Q ${sd * 150} -70 ${sd * 132} -120`, fill: 'none', stroke: '#e9f5ff', 'stroke-width': 6 }, face)
  }
  // Larme.
  const tear = svg('path', { d: 'M 0 0 C 10 14 12 24 0 28 C -12 24 -10 14 0 0 Z', fill: '#8fd3ff', opacity: 0 }, face)
  // Cheveux par-dessus.
  if (hair === 'slick') {
    svg('path', { d: 'M -150 -150 C -170 -270 -80 -330 10 -326 C 110 -322 170 -270 152 -150 C 140 -200 120 -230 60 -240 C 20 -200 -60 -210 -110 -230 C -130 -210 -140 -190 -150 -150 Z', fill: hairColor }, face)
    svg('path', { d: 'M -70 -300 C -20 -316 60 -310 100 -280', fill: 'none', stroke: shade(hairColor, 0.3), 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.6 }, face)
  } else if (hair === 'bun') {
    svg('path', { d: 'M -152 -120 C -170 -260 -90 -318 0 -318 C 90 -318 170 -260 152 -120 C 140 -190 110 -236 30 -246 C -20 -236 -80 -222 -120 -200 C -140 -180 -148 -150 -152 -120 Z', fill: hairColor }, face)
    for (const s of [-1, 1]) svg('path', { d: `M ${s * 140} -170 C ${s * 160} -110 ${s * 150} -60 ${s * 130} -40`, fill: 'none', stroke: hairColor, 'stroke-width': 26, 'stroke-linecap': 'round' }, face)
  } else if (hair === 'cap') {
    // Calot de chirurgien.
    svg('path', { d: 'M -156 -150 C -170 -290 -80 -336 0 -334 C 90 -336 172 -290 156 -150 C 120 -170 60 -178 0 -178 C -60 -178 -120 -170 -156 -150 Z', fill: cap ?? '#2aa198' }, face)
    svg('path', { d: 'M -150 -168 C -80 -196 80 -196 150 -168', fill: 'none', stroke: '#1b6f69', 'stroke-width': 10, opacity: 0.6 }, face)
    for (let i = 0; i < 5; i++) svg('circle', { cx: -90 + i * 45, cy: -270 + (i % 2) * 30, r: 9, fill: '#ffffff', opacity: 0.35 }, face)
  } else if (hair === 'bob') {
    // Carré mi-long avec une frange de côté.
    svg('path', { d: 'M -160 -120 C -180 -280 -90 -330 0 -328 C 100 -330 182 -280 162 -120 L 172 30 C 140 40 120 30 118 -10 C 140 -120 120 -200 70 -236 C 10 -200 -70 -196 -126 -206 C -140 -150 -132 -60 -116 -10 C -120 30 -140 40 -172 30 Z', fill: hairColor }, face)
    svg('path', { d: 'M -60 -300 C 0 -318 80 -306 120 -270', fill: 'none', stroke: shade(hairColor, 0.3), 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.6 }, face)
  } else if (hair === 'messy') {
    // Cheveux en bataille (l'ami épuisé).
    svg('path', { d: 'M -152 -140 C -176 -230 -150 -300 -80 -320 L -60 -350 L -20 -322 L 20 -356 L 50 -318 L 100 -340 L 104 -300 C 160 -280 176 -220 152 -140 C 140 -200 110 -232 40 -238 C -10 -214 -80 -220 -120 -228 C -136 -200 -146 -170 -152 -140 Z', fill: hairColor }, face)
  } else if (hair === 'short') {
    svg('path', { d: 'M -150 -160 C -160 -280 -70 -322 0 -320 C 80 -322 160 -280 150 -160 C 136 -220 110 -246 0 -250 C -110 -246 -136 -220 -150 -160 Z', fill: hairColor }, face)
  }

  const BROWS = { neutral: [0, 0], angry: [14, 0.3], sad: [-6, -0.32], determined: [6, 0.16], surprised: [-18, -0.05] }

  function update(t, st = {}) {
    const { x = 0, y = 0, scale = 1, lean = 0, headTilt = 0, headNod = 0, mouth = 0, brows = 'neutral', look = [0, 0], blink = null, armR: armR_ = [0.15, 0.4], armL: armL_ = [0.15, 0.4], point = false, tearT = -1, seed = 0, breathe = 1 } = st
    const br = Math.sin(t * 2.2 + seed) * 3 * breathe
    root.setAttribute('transform', `translate(${x} ${y}) scale(${scale}) rotate(${lean * 57.3})`)
    body.setAttribute('transform', `translate(0 ${br * 0.4}) scale(1 ${1 + br * 0.002})`)
    head.setAttribute('transform', `translate(${headTilt * 20} ${-br + headNod * 30}) rotate(${headTilt * 57.3 * 0.25 + Math.sin(t * 1.3 + seed) * 1.2})`)
    // Bras : angle de l'épaule (0 = le long du corps, π/2 = à l'horizontale vers
    // l'extérieur, au-delà : levé) et pliure du coude, dans le même sens.
    for (const [A, [sh, el]] of [[armL, armL_], [armR, armR_]]) {
      const s = A.side
      const sx = s * 200
      const sy = 70
      const a1 = Math.PI / 2 - s * sh
      const ex = sx + Math.cos(a1) * 170
      const ey = sy + Math.sin(a1) * 170
      const a2 = Math.PI / 2 - s * (sh + el)
      const hx = ex + Math.cos(a2) * 160
      const hy = ey + Math.sin(a2) * 160
      A.upper.setAttribute('d', `M ${sx} ${sy} L ${ex} ${ey} L ${hx} ${hy}`)
      A.upperShade.setAttribute('d', `M ${sx + 18 * s} ${sy + 10} L ${ex + 14 * s} ${ey}`)
      A.cuff.setAttribute('cx', hx)
      A.cuff.setAttribute('cy', hy)
      const deg = (a2 * 180) / Math.PI
      A.hand.setAttribute('transform', `translate(${hx + Math.cos(a2) * 34} ${hy + Math.sin(a2) * 34}) rotate(${deg + 90})`)
      A.finger.setAttribute('opacity', point && s === 1 ? 1 : 0)
    }
    // Sourcils : hauteur et inclinaison (positif = froncés vers le nez).
    const [bh, ba] = Array.isArray(brows) ? brows : BROWS[brows] ?? BROWS.neutral
    browEls.forEach((b, i) => {
      const s = i ? 1 : -1
      const yIn = -196 + bh + ba * 40
      const yOut = -204 + bh - ba * 40
      b.setAttribute('d', `M ${s * 20} ${yIn} Q ${s * 56} ${(yIn + yOut) / 2 - 10} ${s * 92} ${yOut}`)
    })
    // Clignements (toutes les ~3 s) ou paupières forcées.
    const period = 3.2 + (seed % 1)
    const ph = (t + seed * 1.7) % period
    const auto = ph < 0.13 ? Math.sin((ph / 0.13) * Math.PI) : 0
    const lid = Math.max(auto, blink ?? 0)
    for (const e of eyes) {
      e.inner.setAttribute('transform', `scale(1 ${Math.max(0.06, 1 - lid).toFixed(3)})`)
      e.pupil.setAttribute('transform', `translate(${look[0] * 12} ${look[1] * 12})`)
    }
    // Bouche.
    const m = Math.max(0, Math.min(1, mouth))
    const w = 64 + 10 * m
    const h = 4 + 52 * m
    const sad = brows === 'sad' ? 1 : 0
    if (m < 0.06) {
      mouthOpen.setAttribute('d', '')
      teeth.setAttribute('opacity', 0)
      tongue.setAttribute('opacity', 0)
      mouthLine.setAttribute('d', sad ? 'M -30 6 Q 0 -8 30 6' : 'M -30 0 Q 0 8 30 0')
    } else {
      mouthLine.setAttribute('d', '')
      mouthOpen.setAttribute('d', `M ${-w / 2} 0 Q 0 ${-h * 0.25} ${w / 2} 0 Q ${w * 0.35} ${h} 0 ${h} Q ${-w * 0.35} ${h} ${-w / 2} 0 Z`)
      teeth.setAttribute('y', -2)
      teeth.setAttribute('opacity', m > 0.25 ? 1 : 0)
      tongue.setAttribute('cy', h * 0.72)
      tongue.setAttribute('opacity', m > 0.4 ? 1 : 0)
    }
    // Larme qui coule.
    if (tearT >= 0) {
      tear.setAttribute('opacity', Math.min(1, tearT * 3) * (1 - Math.max(0, tearT - 1.5)))
      tear.setAttribute('transform', `translate(${-60} ${-110 + tearT * 70})`)
    } else tear.setAttribute('opacity', 0)
  }
  return { root, head, update }
}
