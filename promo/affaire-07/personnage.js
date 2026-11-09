/**
 * Personnage en motion design 2D (SVG), version 2 : plus fin, plus expressif,
 * et en vrai costume d'avocat français quand `gown` est vrai :
 * robe à plis avec sa rangée de petits boutons, manches larges, rabat blanc,
 * épitoge sur l'épaule gauche (bordée d'hermine pour les magistrats).
 *
 *   const p = makePerson(svgGroup, { robe: '#15171f', gown: true, hair: 'bun', female: true, ... })
 *   p.update(t, { mouth, brows: 'angry', look: [x, y], blink, armR: [épaule, coude], point: true })
 *
 * Même interface que la version 1 : les coordonnées de la tête et des bras ne
 * changent pas, les scènes existantes fonctionnent telles quelles.
 */

const NS = 'http://www.w3.org/2000/svg'
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

let uid = 0

export function makePerson(parent, o = {}) {
  const {
    skin = '#f1c6a0',
    robe = '#c0392b',
    jabot = true,
    gown = jabot,
    epitoge = 'black',
    hair = 'slick',
    hairColor = '#3b2416',
    beard = false,
    iris = '#3b2a1a',
    collar = null,
    female = false,
    glasses = false,
    lips = female ? '#c4545e' : shade(skin, -0.3),
  } = o
  const id = `p${uid++}`
  const root = svg('g', {}, parent)
  const body = svg('g', {}, root)
  const ink = shade(skin, -0.55)
  const line = '#20140f'
  const SHIRT = '#fbf8f1'

  // Dégradés propres au personnage : modelé du visage et lumière sur la robe.
  const defs = svg('defs', {}, root)
  const lg = (gid, stops, attrs) => {
    const g = svg('linearGradient', { id: `${id}${gid}`, ...attrs }, defs)
    for (const [off, col, a = 1] of stops) svg('stop', { offset: off, 'stop-color': col, 'stop-opacity': a }, g)
  }
  lg('face', [[0, shade(skin, 0.12)], [0.6, skin], [1, shade(skin, -0.12)]], { x1: 0, y1: 0, x2: 1, y2: 1 })
  lg('robe', [[0, shade(robe, 0.18)], [0.5, robe], [1, shade(robe, -0.3)]], { x1: 0, y1: 0, x2: 1, y2: 0 })
  lg('hair', [[0, shade(hairColor, 0.22)], [1, shade(hairColor, -0.2)]], { x1: 0, y1: 0, x2: 1, y2: 1 })
  const F = (g) => `url(#${id}${g})`

  svg('ellipse', { cx: 20, cy: 330, rx: 330, ry: 60, fill: '#000', opacity: 0.18 }, body)

  // Bras : manche large de robe (ou de veste), poignet de chemise, main.
  const arm = (side) => {
    const g = svg('g', {}, body)
    const upper = svg('path', { fill: 'none', stroke: robe, 'stroke-width': gown ? 104 : 90, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)
    const upperShade = svg('path', { fill: 'none', stroke: shade(robe, -0.3), 'stroke-width': 34, 'stroke-linecap': 'round', opacity: 0.5 }, g)
    const bell = svg('circle', { r: gown ? 70 : 50, fill: shade(robe, -0.08) }, g)
    const bellIn = svg('circle', { r: gown ? 50 : 36, fill: shade(robe, -0.45) }, g)
    const cuff = svg('ellipse', { rx: 40, ry: 30, fill: gown || collar ? SHIRT : shade(robe, 0.5) }, g)
    const hand = svg('g', {}, g)
    svg('path', { d: 'M -40 -6 C -40 -40 40 -40 40 -6 C 42 30 20 46 0 46 C -20 46 -42 30 -40 -6 Z', fill: skin, stroke: ink, 'stroke-width': 3, 'stroke-opacity': 0.35 }, hand)
    for (const fx of [-20, -6, 8, 22]) svg('path', { d: `M ${fx} 34 L ${fx} 46`, stroke: ink, 'stroke-width': 3, opacity: 0.25, 'stroke-linecap': 'round' }, hand)
    svg('ellipse', { cx: side * -34, cy: -6, rx: 14, ry: 24, fill: skin, transform: `rotate(${side * 25} ${side * -34} -6)` }, hand)
    const finger = svg('rect', { x: -12, y: -98, width: 24, height: 70, rx: 12, fill: skin, stroke: ink, 'stroke-width': 3, 'stroke-opacity': 0.3 }, hand)
    return { g, upper, upperShade, bell, bellIn, cuff, hand, finger, side }
  }
  const armL = arm(-1)

  // Torse.
  const torso = svg('g', {}, body)
  svg('path', { d: 'M -270 340 C -280 160 -236 40 -150 8 L 150 8 C 236 40 280 160 270 340 Z', fill: F('robe') }, torso)
  if (gown) {
    // Plis de la robe, qui partent de l'empiècement des épaules.
    for (const x of [-210, -165, -120, 120, 165, 210]) svg('path', { d: `M ${x * 0.82} 90 Q ${x * 0.95} 220 ${x} 340`, fill: 'none', stroke: shade(robe, -0.35), 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.7 }, torso)
    svg('path', { d: 'M -200 80 Q 0 112 200 80', fill: 'none', stroke: shade(robe, -0.35), 'stroke-width': 6, opacity: 0.6 }, torso)
    // Les deux pans du devant et la rangée de petits boutons.
    svg('path', { d: 'M -6 140 L -10 340 M 6 140 L 10 340', stroke: shade(robe, -0.45), 'stroke-width': 5 }, torso)
    for (let k = 0; k < 7; k++) svg('circle', { cx: 0, cy: 160 + k * 26, r: 6, fill: shade(robe, 0.25), stroke: shade(robe, -0.5), 'stroke-width': 2 }, torso)
  }
  // Liseré de lumière sur l'épaule (la lumière vient de la gauche).
  svg('path', { d: 'M -250 300 C -260 170 -226 60 -150 22', fill: 'none', stroke: shade(robe, 0.4), 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.6 }, torso)
  if (collar && !gown) svg('path', { d: 'M -92 8 Q 0 74 92 8 L 72 -2 Q 0 42 -72 -2 Z', fill: collar }, torso)
  // Cou, avec l'ombre du menton.
  svg('rect', { x: -44, y: -60, width: 88, height: 92, rx: 28, fill: skin }, torso)
  svg('path', { d: 'M -44 -30 Q 0 0 44 -30 L 44 -6 Q 0 22 -44 -6 Z', fill: ink, opacity: 0.22 }, torso)
  if (gown) {
    // Col de chemise blanc et rabat (deux bandes empesées, légèrement évasées).
    svg('path', { d: 'M -52 4 L -8 36 L -30 52 Z M 52 4 L 8 36 L 30 52 Z', fill: SHIRT, stroke: '#d9d2c4', 'stroke-width': 3 }, torso)
    for (const s of [-1, 1]) {
      svg('path', { d: `M ${s * 3} 30 L ${s * 36} 30 L ${s * 42} 150 L ${s * 5} 150 Z`, fill: SHIRT, stroke: '#d9d2c4', 'stroke-width': 3 }, torso)
      svg('path', { d: `M ${s * 20} 40 L ${s * 23} 145`, stroke: '#e4ddcf', 'stroke-width': 4 }, torso)
    }
    svg('rect', { x: -12, y: 22, width: 24, height: 18, rx: 6, fill: SHIRT, stroke: '#d9d2c4', 'stroke-width': 3 }, torso)
    // Épitoge sur l'épaule gauche : bande noire qui retombe devant, bordée d'hermine.
    const ep = svg('g', {}, torso)
    const band = epitoge === 'ermine' ? '#f7f3ea' : '#0d0e13'
    svg('path', { d: 'M 120 16 C 190 30 214 70 206 130 L 198 190 L 148 190 L 152 130 C 156 80 140 50 104 34 Z', fill: band, stroke: epitoge === 'ermine' ? '#cfc8b8' : '#4a4d5c', 'stroke-width': 4 }, ep)
    svg('path', { d: 'M 128 22 C 186 38 204 74 198 128', fill: 'none', stroke: '#ffffff', 'stroke-width': 4, opacity: 0.18, 'stroke-linecap': 'round' }, ep)
    svg('path', { d: 'M 148 190 L 198 190 L 194 250 L 150 250 Z', fill: '#f7f3ea', stroke: '#cfc8b8', 'stroke-width': 3 }, ep)
    // Mouchetures d'hermine.
    const dots = epitoge === 'ermine' ? [[170, 70], [182, 120], [168, 165], [162, 225], [184, 236]] : [[162, 225], [184, 236], [173, 208]]
    for (const [dx, dy] of dots) svg('path', { d: `M ${dx} ${dy - 8} L ${dx + 5} ${dy + 6} L ${dx - 5} ${dy + 6} Z`, fill: '#14151b' }, ep)
  }
  const armR = arm(1)

  // Tête.
  const head = svg('g', {}, root)
  const face = svg('g', {}, head)
  if (hair === 'bun') {
    svg('circle', { cx: 10, cy: -338, r: 70, fill: F('hair') }, face)
    svg('path', { d: 'M -30 -380 Q 10 -400 46 -370', fill: 'none', stroke: shade(hairColor, 0.35), 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.7 }, face)
  }
  if (hair === 'long' || hair === 'bob') {
    // Cheveux de derrière (encadrent le visage).
    svg('path', { d: hair === 'long' ? 'M -160 -150 C -190 -40 -180 120 -120 200 L 120 200 C 180 120 190 -40 160 -150 Z' : 'M -162 -150 C -184 -60 -176 20 -150 50 L 150 50 C 176 20 184 -60 162 -150 Z', fill: shade(hairColor, -0.15) }, face)
  }
  // Oreilles.
  for (const s of [-1, 1]) {
    svg('ellipse', { cx: s * 132, cy: -126, rx: 24, ry: 36, fill: skin }, face)
    svg('ellipse', { cx: s * 134, cy: -124, rx: 11, ry: 19, fill: ink, opacity: 0.2 }, face)
  }
  // Visage : ovale qui s'affine vers le menton, léger contour.
  svg('path', { d: 'M 0 -302 C 118 -302 144 -222 142 -142 C 140 -62 98 8 0 22 C -98 8 -140 -62 -142 -142 C -144 -222 -118 -302 0 -302 Z', fill: F('face'), stroke: ink, 'stroke-width': 5, 'stroke-opacity': 0.25 }, face)
  // Ombre de la joue droite et du dessous des pommettes.
  svg('path', { d: 'M 60 -290 C 136 -270 146 -200 142 -142 C 140 -62 98 8 0 22 C 76 -6 112 -70 116 -146 C 118 -220 100 -270 60 -290 Z', fill: ink, opacity: 0.1 }, face)
  for (const s of [-1, 1]) svg('ellipse', { cx: s * 84, cy: -72, rx: 26, ry: 14, fill: '#ff7b6b', opacity: 0.18 }, face)
  // Barbe (de quelques jours, plus courte et plus nette).
  if (beard) {
    svg('path', { d: 'M -138 -120 C -134 -20 -80 26 0 30 C 80 26 134 -20 138 -120 C 118 -70 92 -48 60 -52 C 30 -58 -30 -58 -60 -52 C -92 -48 -118 -70 -138 -120 Z', fill: hairColor, opacity: 0.92 }, face)
    svg('path', { d: 'M -46 -46 Q 0 -66 46 -46 Q 0 -54 -46 -46 Z', fill: hairColor }, face)
  }
  // Yeux en amande : blanc, iris cerclé, double reflet, paupière supérieure marquée.
  const eyes = [-1, 1].map((s) => {
    const g = svg('g', { transform: `translate(${s * 54} -142)` }, face)
    const inner = svg('g', {}, g)
    svg('path', { d: 'M -34 2 C -26 -30 26 -30 34 2 C 26 30 -26 30 -34 2 Z', fill: '#ffffff' }, inner)
    const pupil = svg('g', {}, inner)
    svg('circle', { r: 19, fill: iris }, pupil)
    svg('circle', { r: 19, fill: 'none', stroke: shade(iris, -0.5), 'stroke-width': 3 }, pupil)
    svg('circle', { r: 9, fill: '#0e0906' }, pupil)
    svg('circle', { r: 6, cx: 7, cy: -7, fill: '#ffffff' }, pupil)
    svg('circle', { r: 3, cx: -7, cy: 7, fill: '#ffffff', opacity: 0.7 }, pupil)
    svg('path', { d: 'M -36 2 C -28 -32 28 -32 36 2', fill: 'none', stroke: line, 'stroke-width': female ? 8 : 6, 'stroke-linecap': 'round' }, inner)
    if (female) for (const k of [0, 1]) svg('path', { d: `M ${s * (28 + k * 6)} ${-14 + k * 8} l ${s * 12} ${-8}`, stroke: line, 'stroke-width': 5, 'stroke-linecap': 'round' }, inner)
    svg('path', { d: 'M -26 22 Q 0 32 26 22', fill: 'none', stroke: ink, 'stroke-width': 3, opacity: 0.3 }, g)
    return { g, inner, pupil }
  })
  if (glasses) {
    for (const s of [-1, 1]) svg('rect', { x: s * 54 - 46, y: -180, width: 92, height: 72, rx: 22, fill: '#ffffff', 'fill-opacity': 0.08, stroke: '#1a1a1a', 'stroke-width': 7 }, face)
    svg('path', { d: 'M -8 -150 Q 0 -158 8 -150', fill: 'none', stroke: '#1a1a1a', 'stroke-width': 6 }, face)
  }
  // Sourcils plus fins.
  const browEls = [-1, 1].map(() => svg('path', { fill: 'none', stroke: shade(hairColor, -0.1), 'stroke-width': female ? 11 : 15, 'stroke-linecap': 'round' }, face))
  // Nez : arête douce et narines.
  svg('path', { d: 'M -4 -126 Q -16 -88 -4 -76 Q 8 -70 18 -78', fill: 'none', stroke: ink, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.45 }, face)
  svg('ellipse', { cx: 2, cy: -80, rx: 16, ry: 8, fill: ink, opacity: 0.08 }, face)
  // Bouche avec de vraies lèvres.
  const mouthG = svg('g', { transform: 'translate(0 -26)' }, face)
  const mouthOpen = svg('path', { fill: '#4a1518', stroke: lips, 'stroke-width': 6, 'stroke-linejoin': 'round' }, mouthG)
  const teeth = svg('rect', { x: -24, width: 48, height: 11, rx: 5, fill: '#fffaf2' }, mouthG)
  const tongue = svg('ellipse', { rx: 18, ry: 8, fill: '#d9606a' }, mouthG)
  const mouthLine = svg('path', { fill: 'none', stroke: shade(lips, -0.35), 'stroke-width': 7, 'stroke-linecap': 'round' }, mouthG)
  const lowerLip = svg('path', { fill: lips, opacity: female ? 0.9 : 0.45 }, mouthG)
  const tear = svg('path', { d: 'M 0 0 C 10 14 12 24 0 28 C -12 24 -10 14 0 0 Z', fill: '#8fd3ff', opacity: 0 }, face)

  // Cheveux par-dessus, avec un reflet.
  const H = (d, hl) => {
    svg('path', { d, fill: F('hair') }, face)
    if (hl) svg('path', { d: hl, fill: 'none', stroke: shade(hairColor, 0.38), 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.65 }, face)
  }
  if (hair === 'slick') H('M -150 -150 C -170 -270 -80 -332 10 -328 C 110 -324 170 -270 152 -150 C 140 -204 118 -232 60 -244 C 20 -206 -60 -214 -112 -232 C -132 -212 -142 -190 -150 -150 Z', 'M -70 -302 C -20 -318 60 -312 100 -282')
  else if (hair === 'bun') {
    H('M -152 -128 C -170 -262 -90 -320 0 -320 C 90 -320 170 -262 152 -128 C 140 -194 110 -238 30 -248 C -20 -238 -80 -224 -120 -204 C -140 -184 -148 -156 -152 -128 Z', 'M -40 -304 C 10 -316 70 -306 108 -276')
    for (const s of [-1, 1]) svg('path', { d: `M ${s * 138} -176 C ${s * 156} -118 ${s * 148} -70 ${s * 128} -48`, fill: 'none', stroke: hairColor, 'stroke-width': 16, 'stroke-linecap': 'round' }, face)
  } else if (hair === 'short') H('M -148 -164 C -158 -282 -70 -324 0 -322 C 80 -324 158 -282 148 -164 C 134 -222 108 -248 20 -252 C -60 -248 -134 -222 -148 -164 Z', 'M -60 -304 C 0 -318 60 -310 96 -288')
  else if (hair === 'bob' || hair === 'long') H('M -160 -120 C -180 -282 -90 -332 0 -330 C 100 -332 182 -282 162 -120 C 150 -200 120 -236 70 -240 C 10 -204 -70 -198 -126 -208 C -140 -170 -150 -150 -160 -120 Z', 'M -60 -302 C 0 -320 80 -308 120 -272')
  else if (hair === 'messy') H('M -152 -140 C -176 -230 -150 -300 -80 -320 L -60 -350 L -20 -322 L 20 -356 L 50 -318 L 100 -340 L 104 -300 C 160 -280 176 -220 152 -140 C 140 -200 110 -232 40 -238 C -10 -214 -80 -220 -120 -228 C -136 -200 -146 -170 -152 -140 Z')
  else if (hair === 'gray') H('M -150 -168 C -150 -262 -84 -300 0 -300 C 84 -300 150 -262 150 -168 C 138 -214 110 -236 60 -240 C 20 -226 -30 -228 -70 -238 C -110 -230 -140 -210 -150 -168 Z', 'M -50 -286 C 0 -296 50 -292 86 -276')

  const BROWS = { neutral: [0, 0], angry: [14, 0.3], sad: [-6, -0.32], determined: [6, 0.16], surprised: [-18, -0.05] }

  function update(t, st = {}) {
    const { x = 0, y = 0, scale = 1, lean = 0, headTilt = 0, headNod = 0, mouth = 0, brows = 'neutral', look = [0, 0], blink = null, armR: armR_ = [0.15, 0.4], armL: armL_ = [0.15, 0.4], point = false, tearT = -1, seed = 0, breathe = 1, smirk = 0 } = st
    const br = Math.sin(t * 2.2 + seed) * 3 * breathe
    root.setAttribute('transform', `translate(${x} ${y}) scale(${scale}) rotate(${lean * 57.3})`)
    body.setAttribute('transform', `translate(0 ${br * 0.4}) scale(1 ${1 + br * 0.002})`)
    head.setAttribute('transform', `translate(${headTilt * 20} ${-br + headNod * 30}) rotate(${headTilt * 57.3 * 0.25 + Math.sin(t * 1.3 + seed) * 1.2})`)
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
      // Manche évasée au bout de l'avant-bras, puis le poignet de chemise.
      A.bell.setAttribute('cx', hx - Math.cos(a2) * 6)
      A.bell.setAttribute('cy', hy - Math.sin(a2) * 6)
      A.bellIn.setAttribute('cx', hx + Math.cos(a2) * 6)
      A.bellIn.setAttribute('cy', hy + Math.sin(a2) * 6)
      const deg = (a2 * 180) / Math.PI
      A.cuff.setAttribute('transform', `translate(${hx + Math.cos(a2) * 14} ${hy + Math.sin(a2) * 14}) rotate(${deg + 90})`)
      A.hand.setAttribute('transform', `translate(${hx + Math.cos(a2) * 46} ${hy + Math.sin(a2) * 46}) rotate(${deg + 90})`)
      A.finger.setAttribute('opacity', point && s === 1 ? 1 : 0)
    }
    const [bh, ba] = Array.isArray(brows) ? brows : BROWS[brows] ?? BROWS.neutral
    browEls.forEach((b, i) => {
      const s = i ? 1 : -1
      const yIn = -198 + bh + ba * 40
      const yOut = -206 + bh - ba * 40 - (smirk && s === 1 ? 10 * smirk : 0)
      b.setAttribute('d', `M ${s * 22} ${yIn} Q ${s * 56} ${(yIn + yOut) / 2 - 12} ${s * 92} ${yOut}`)
    })
    const period = 3.2 + (seed % 1)
    const ph = (t + seed * 1.7) % period
    const auto = ph < 0.13 ? Math.sin((ph / 0.13) * Math.PI) : 0
    const lid = Math.max(auto, blink ?? 0)
    for (const e of eyes) {
      e.inner.setAttribute('transform', `scale(1 ${Math.max(0.06, 1 - lid).toFixed(3)})`)
      e.pupil.setAttribute('transform', `translate(${look[0] * 11} ${look[1] * 9})`)
    }
    const m = Math.max(0, Math.min(1, mouth))
    const w = 60 + 10 * m
    const h = 4 + 48 * m
    const sad = brows === 'sad' ? 1 : 0
    if (m < 0.06) {
      mouthOpen.setAttribute('d', '')
      teeth.setAttribute('opacity', 0)
      tongue.setAttribute('opacity', 0)
      const k = smirk * 10
      mouthLine.setAttribute('d', sad ? 'M -28 6 Q 0 -8 28 6' : `M -28 ${0 + k * 0.2} Q 0 ${8 - k * 0.3} 28 ${-k}`)
      lowerLip.setAttribute('d', sad ? '' : 'M -16 6 Q 0 18 16 6 Q 0 12 -16 6 Z')
    } else {
      mouthLine.setAttribute('d', '')
      lowerLip.setAttribute('d', '')
      mouthOpen.setAttribute('d', `M ${-w / 2} 0 Q 0 ${-h * 0.25} ${w / 2} 0 Q ${w * 0.35} ${h} 0 ${h} Q ${-w * 0.35} ${h} ${-w / 2} 0 Z`)
      teeth.setAttribute('y', -2)
      teeth.setAttribute('opacity', m > 0.25 ? 1 : 0)
      tongue.setAttribute('cy', h * 0.72)
      tongue.setAttribute('opacity', m > 0.4 ? 1 : 0)
    }
    if (tearT >= 0) {
      tear.setAttribute('opacity', Math.min(1, tearT * 3) * (1 - Math.max(0, tearT - 1.5)))
      tear.setAttribute('transform', `translate(${-60} ${-110 + tearT * 70})`)
    } else tear.setAttribute('opacity', 0)
  }
  return { root, head, update }
}
