/**
 * ============================================================================
 *  Pub « Plutôt Que Scroller » — 15 s, format vertical 1080 × 1920
 * ============================================================================
 *
 *  Mesures 1-2  Le scroll sans fin : « Tu scrolles. Encore. » puis arrêt net
 *               sur le bouton de l'app, « J'ai envie de scroller ».
 *  Mesures 3-5  Le bouton explose en couleurs : six humeurs, six passions,
 *               six vraies activités de la bibliothèque de l'app.
 *  Mesure 6     On recule : tout ça se passait dans l'app, qui montre la
 *               progression (série, envies transformées, temps récupéré).
 *  Mesure 7     « Scrolle moins. Crée plus. »
 *  Mesure 8     L'écran entier se replie en icône : la signature.
 *
 *  Tout est piloté par le temps (voir engine.js) : window.__promo.seek(t)
 *  affiche l'image de l'instant t. Les repères viennent de cues.js, partagés
 *  avec la bande-son.
 */

import { BEAT, DURATION, FPS, T, beat } from './cues.js'
import { clamp, ease, finalize, lerp, onFrame, prog, rng, seek, set, stagger, tw } from './engine.js'

// --------------------------------------------------------------- utilitaires

const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
const NNBSP = ' ' // espace fine insécable, avant « ? » et « ! »

function add(parent, markup) {
  parent.insertAdjacentHTML('beforeend', markup)
  return parent.lastElementChild
}

/** Découpe le texte d'un élément en lettres animables ; les mots restent insécables. */
function splitChars(el) {
  const words = el.textContent.split(' ')
  el.textContent = ''
  const chars = []
  words.forEach((word, i) => {
    if (i > 0) el.append(' ')
    const w = document.createElement('span')
    w.className = 'w'
    for (const c of word) {
      const s = document.createElement('span')
      s.className = 'ch'
      s.textContent = c
      w.append(s)
      chars.push(s)
    }
    el.append(w)
  })
  return chars
}

function splitWords(el) {
  const words = el.textContent.split(' ')
  el.textContent = ''
  return words.map((word, i) => {
    if (i > 0) el.append(' ')
    const w = document.createElement('span')
    w.className = 'w'
    w.textContent = word
    el.append(w)
    return w
  })
}

/** Courbe fermée et lisse passant par tous les points (Catmull-Rom → Bézier). */
function smoothClosed(p) {
  const n = p.length
  const f = (v) => v.toFixed(1)
  let d = `M${f(p[0][0])} ${f(p[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n]
    const p1 = p[i]
    const p2 = p[(i + 1) % n]
    const p3 = p[(i + 2) % n]
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return `${d}Z`
}

const fmtHM = (minutes) => {
  const m = Math.round(minutes)
  return `${Math.floor(m / 60)}${NNBSP}h${NNBSP}${String(m % 60).padStart(2, '0')}`
}

/** Petit « tremblement de caméra » amorti, déclenché à certains instants. */
function shake(t, hits) {
  let x = 0
  let y = 0
  for (const [t0, amp] of hits) {
    const d = t - t0
    if (d < 0 || d > 0.4) continue
    const a = amp * Math.exp(-d / 0.08)
    x += a * Math.sin(d * 97 + t0)
    y += a * Math.cos(d * 131 + t0)
  }
  return [x, y]
}

// ------------------------------------------------------------------ dessins

const svgIcon = (inner, stroke = 2) =>
  `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

const ICON = {
  sparkles: svgIcon(
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  ),
  heart: (filled) =>
    `<svg viewBox="0 0 24 24" width="50" height="50" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  comment: `<svg viewBox="0 0 24 24" width="50" height="50" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
  send: `<svg viewBox="0 0 24 24" width="50" height="50" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" width="50" height="50" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
  check: svgIcon('<path d="M20 6 9 17l-5-5"/>', 3.2),
  house: svgIcon(
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  ),
  chart: svgIcon('<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>'),
  user: svgIcon('<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>'),
}

/** Le crayon de l'icône de l'app (unités du logo : pointe en (8, 32), centre en (29.5, 32)). */
const PENCIL = `
  <rect x="17" y="27" width="27" height="10" rx="2" fill="#FFF7EE" stroke="#2A1F1A" stroke-width="0.9"/>
  <rect x="17.5" y="31.3" width="26" height="1.4" fill="#F3D9C2"/>
  <rect x="44" y="27" width="7" height="10" rx="2" fill="#F2B632" stroke="#2A1F1A" stroke-width="0.9"/>
  <path d="M17 27 L8 32 L17 37 Z" fill="#F3D9C2" stroke="#2A1F1A" stroke-width="0.9" stroke-linejoin="round"/>
  <path d="M11 30.3 L8 32 L11 33.7 Z" fill="#2A1F1A"/>`

/** Transform SVG plaçant la pointe du crayon en (x, y), incliné de `angle`, à l'échelle k. */
function pencilPose(x, y, angle, k) {
  const a = (angle * Math.PI) / 180
  const cx = x + 21.5 * k * Math.cos(a)
  const cy = y + 21.5 * k * Math.sin(a)
  return `translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${k.toFixed(4)}) translate(-29.5 -32)`
}

const APP_MARK = `<svg viewBox="0 0 64 64" width="100%" height="100%">
  <rect width="64" height="64" rx="18" fill="#C4401C"/>
  <g transform="rotate(-45 32 32) translate(2.5 0)">
    <rect x="17" y="27" width="27" height="10" rx="2" fill="#FFF7EE"/>
    <rect x="44" y="27" width="7" height="10" rx="2" fill="#F2B632"/>
    <path d="M17 27 L8 32 L17 37 Z" fill="#F3D9C2"/>
    <path d="M11 30.3 L8 32 L11 33.7 Z" fill="#2A1F1A"/>
  </g></svg>`

/** Étoile à quatre branches (étincelle). */
const spark = (r, color) =>
  `<path d="M0 ${-r} C${r * 0.12} ${-r * 0.12} ${r * 0.12} ${-r * 0.12} ${r} 0 C${r * 0.12} ${r * 0.12} ${r * 0.12} ${r * 0.12} 0 ${r} C${-r * 0.12} ${r * 0.12} ${-r * 0.12} ${r * 0.12} ${-r} 0 C${-r * 0.12} ${-r * 0.12} ${-r * 0.12} ${-r * 0.12} 0 ${-r}Z" fill="${color}"/>`

/** Étoile à cinq branches (note d'un film). */
function star5(R, r) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rad = i % 2 ? r : R
    pts.push(`${(Math.cos(a) * rad).toFixed(1)} ${(Math.sin(a) * rad).toFixed(1)}`)
  }
  return `M${pts.join(' L')}Z`
}

/** Le chat dessiné d'un seul trait (scène « Dessine. »). */
const CAT = {
  head: 'M -118 92 C -150 44 -152 -28 -116 -70 L -128 -168 L -52 -108 C -18 -120 18 -120 52 -108 L 128 -168 L 116 -70 C 152 -28 150 44 118 92 C 74 142 -74 142 -118 92',
  eyes: 'M -74 -8 Q -54 -38 -34 -8 M 34 -8 Q 54 -38 74 -8',
  nose: 'M -14 26 L 14 26 L 0 42 Z M 0 42 Q -8 64 -30 56 M 0 42 Q 8 64 30 56',
  whiskers: 'M -100 30 L -178 14 M -100 50 L -172 58 M 100 30 L 178 14 M 100 50 L 172 58',
}

// ------------------------------------------------------------------ données

/** Six humeurs → six passions → six vraies activités de src/data/activities. */
const SCENES = [
  { verb: 'Dessine', color: '#E4572E', emoji: '🥱', mood: 'Ennui', passion: 'Dessin', icon: '✏️', title: 'Croquis express', dur: 5 },
  { verb: 'Filme', color: '#9B5DE5', emoji: '👀', mood: 'Curiosité', passion: 'Cinéma', icon: '🎬', title: 'L’effet Koulechov', dur: 5 },
  { verb: 'Écris', color: '#3D7DD8', emoji: '🫥', mood: 'Page blanche', passion: 'Écriture', icon: '✍️', title: 'Dix titres', dur: 5 },
  { verb: 'Joue', color: '#13A89E', emoji: '💥', mood: 'Trop d’énergie', passion: 'Musique', icon: '🎸', title: 'Body percussion', dur: 5 },
  { verb: 'Bouge', color: '#F08A24', emoji: '😬', mood: 'Stress', passion: 'Sport', icon: '🏃', title: 'Secouer le stress', dur: 5 },
  { verb: 'Cuisine', color: '#C9971A', emoji: '🍃', mood: 'Besoin de calme', passion: 'Cuisine', icon: '🍳', title: 'Galettes à la poêle', dur: 15 },
]

const FAMILY_COLORS = ['#E4572E', '#9B5DE5', '#3D7DD8', '#13A89E', '#F08A24', '#C9971A', '#D6457A', '#4F9D69']

/** Position de l'icône finale : l'écran tomate se replie exactement dessus. */
const MARK = { cx: 540, cy: 620, size: 240 }

// =============================================================================
//  A · LE SCROLL SANS FIN (0 → 3,75 s)
// =============================================================================

const FEED_COLORS = [
  ['#ff4d8d', '#7b61ff'],
  ['#22c3e6', '#1b3f8c'],
  ['#ff8a3d', '#d6245e'],
  ['#7bd389', '#1f6f5c'],
  ['#b388ff', '#ff5c8a'],
  ['#ffd166', '#ef476f'],
  ['#06d6a0', '#118ab2'],
  ['#f15bb5', '#9b5de5'],
]
const POST_PITCH = 736

function postMarkup(i, R) {
  const [c1, c2] = FEED_COLORS[i % FEED_COLORS.length]
  const kind = ['photo', 'video', 'text', 'selfie'][(i * 3) % 4]
  let media = ''
  if (kind === 'photo') {
    media = `<div class="media" style="background:linear-gradient(170deg, ${c1}, ${c2})">
      <div style="position:absolute;left:${540 + Math.round(R() * 200)}px;top:${50 + Math.round(R() * 50)}px;width:118px;height:118px;border-radius:50%;background:rgb(255 244 214 / .9)"></div>
      <svg viewBox="0 0 896 440" width="896" height="440" style="position:absolute;left:0;top:0"><path d="M0 440V300l170-120 150 110 150-150 230 180 196-110v230z" fill="rgb(12 8 24 / .42)"/><path d="M0 440v-80l230-100 190 100 200-110 276 120v70z" fill="rgb(12 8 24 / .7)"/></svg></div>`
  } else if (kind === 'video') {
    media = `<div class="media" style="background:radial-gradient(circle at 30% 30%, ${c1}, ${c2} 72%)">
      <div style="position:absolute;left:50%;top:50%;width:150px;height:150px;margin:-75px;border-radius:50%;background:rgb(0 0 0 / .32);display:grid;place-items:center"><svg viewBox="0 0 24 24" width="74" height="74"><path d="M8 5v14l11-7z" fill="#fff"/></svg></div>
      <div style="position:absolute;left:30px;right:30px;bottom:26px;height:9px;border-radius:5px;background:rgb(255 255 255 / .3)"><div style="width:${30 + Math.round(R() * 50)}%;height:100%;border-radius:5px;background:#fff"></div></div></div>`
  } else if (kind === 'text') {
    media = `<div class="media" style="background:${c1};display:flex;flex-direction:column;justify-content:center;gap:28px;padding:0 70px;box-sizing:border-box">
      ${[0.92, 0.66, 0.84].map((w) => `<div style="height:46px;border-radius:23px;background:rgb(255 255 255 / .9);width:${Math.round(w * 100)}%"></div>`).join('')}</div>`
  } else {
    media = `<div class="media" style="background:linear-gradient(200deg, ${c2}, ${c1})">
      <div style="position:absolute;left:50%;top:92px;width:190px;height:190px;margin-left:-95px;border-radius:50%;background:rgb(255 236 220 / .85)"></div>
      <div style="position:absolute;left:50%;top:300px;width:420px;height:260px;margin-left:-210px;border-radius:210px 210px 0 0;background:rgb(255 236 220 / .7)"></div></div>`
  }
  const liked = R() < 0.45
  return `<div class="post" style="top:${80 + i * POST_PITCH}px">
    <div class="post-head">
      <div class="avatar" style="background:linear-gradient(135deg, ${c1}, ${c2})"></div>
      <div><div class="bar" style="width:${190 + Math.round(R() * 170)}px"></div><div class="bar sm" style="width:${110 + Math.round(R() * 90)}px"></div></div>
    </div>
    ${media}
    <div class="post-actions">
      <span style="display:flex;color:${liked ? '#ff4d6d' : 'inherit'}">${ICON.heart(liked)}</span>${ICON.comment}${ICON.send}
      <div class="bar" style="width:${110 + Math.round(R() * 90)}px"></div>
      <span style="display:flex;margin-left:auto">${ICON.bookmark}</span>
    </div>
  </div>`
}

/** Mouvement du fil : une série de « coups de pouce », de plus en plus forts. */
const FLICK_AMP = [650, 850, 1050, 1300, 1450, 1650]
const FLICK_TAU = 0.2
function feedMotion(t) {
  const tt = Math.min(t, T.stop)
  let y = 0
  let v = 0
  T.flicks.forEach((t0, k) => {
    if (tt < t0) return
    const e = Math.exp(-(tt - t0) / FLICK_TAU)
    y += FLICK_AMP[k] * (1 - e)
    v += (FLICK_AMP[k] / FLICK_TAU) * e
  })
  return { y, v: t < T.stop ? v : 0 }
}

function buildA() {
  const A = $('#A')
  A.innerHTML = `
    <div id="feedVP" class="layer"><div id="feed"></div></div>
    <div id="dim" class="layer" style="background:#0b0807"></div>
    <div id="screenTime" class="abs center-x"><div class="pill-dark">
      <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="#ff7a50" stroke-width="2.3" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/></svg>
      <span class="label">Temps d’écran</span><span id="stValue"></span></div></div>
    <div id="h1" class="hook display center-x">Tu scrolles.</div>
    <div id="encoreCol" class="layer"></div>
    <div id="question" class="hook display center-x">Cette envie-là${NNBSP}?</div>
    <div id="btnShake" class="layer"><div id="btn" class="abs">
      <div class="ring"></div><div class="ring"></div>
      <div id="btnCircle"></div>
      <div id="btnLabel"><span id="btnSpark" style="display:block;width:66px;height:66px">${ICON.sparkles}</span><div class="display">J’ai envie<br>de scroller</div></div>
    </div></div>
    <div id="transformTxt" class="hook display center-x">Transforme-la.</div>
    <div id="touch" class="abs"></div>
    <div id="tapRing" class="abs tap-ring"></div>
    <div id="flash" class="layer"></div>`

  // --- Le fil d'actualité
  const feed = $('#feed')
  const R = rng(7)
  for (let i = 0; i < 16; i++) add(feed, postMarkup(i, R))
  const blurNode = $('#mblurNode')
  onFrame((t) => {
    if (t > T.drop + 0.8) return
    const { y, v } = feedMotion(t)
    const d = Math.max(0, t - T.stop)
    const recoil = t >= T.stop ? 46 * Math.exp(-d / 0.09) * Math.sin(d * 34) : 0
    feed.style.transform = `translateY(${(-(y + recoil)).toFixed(2)}px)`
    blurNode.setAttribute('stdDeviation', `0 ${Math.min(34, v * 0.0034).toFixed(2)}`)
  })

  // Assombrissement progressif, puis arrêt net (gel en noir et blanc).
  tw('#dim', 0, 0.3, { opacity: [0.12, 0.34] })
  tw('#dim', T.encore, 0.2, { opacity: 0.5 })
  tw('#dim', T.stop, 0.25, { opacity: 0.8 }, ease.out2)
  tw('#feed', T.stop, 0.3, { gray: [0, 1], bright: [1, 0.55] }, ease.out2)
  tw('#feedVP', T.stop, 0.6, { scale: [1, 1.05] }, ease.out3)
  tw('#flash', T.stop, 0.3, { opacity: [0.45, 0] }, ease.out2)
  set('#flash', 0, { opacity: 0 })

  // --- Compteur de temps d'écran qui s'emballe
  const pill = $('#screenTime .pill-dark')
  const stValue = $('#stValue')
  stValue.__fmt = fmtHM
  tw(stValue, 0, T.stop, { text: [12, 298] }, ease.in2)
  tw(stValue, 1.1, 0.5, { color: ['#F5EBE0', '#FF7A50'] })
  tw(pill, 0, 0.35, { y: [-50, 0], opacity: [0, 1] })
  T.flicks.forEach((f) => {
    tw(pill, f, 0.06, { scale: 1.05 }, ease.out2)
    tw(pill, f + 0.06, 0.16, { scale: 1 }, ease.out2)
  })
  tw(pill, T.stop + 0.04, 0.25, { y: -70, opacity: 0 }, ease.in3)

  // --- « Tu scrolles. »
  const h1 = splitChars($('#h1'))
  stagger(h1, T.hook, 0.03, 0.42, { y: [130, 0], rot: [16, 0], scale: [0.5, 1], opacity: [0, 1] }, ease.back(1.9))
  tw('#h1', 0, T.encore, { scale: [1, 1.07] }, ease.linear)
  stagger(h1, T.encore - 0.08, 0.012, 0.16, { y: -170, opacity: 0 }, ease.in3)

  // --- « Encore. » … puis le mot lui-même se fait scroller.
  const col = $('#encoreCol')
  col.style.filter = 'url(#mblur2)'
  const encores = []
  for (let k = 0; k < 7; k++) {
    encores.push(add(col, `<div class="hook display center-x encore${k % 2 ? ' outline' : ''}" style="top:${760 + k * 205}px">Encore.</div>`))
  }
  tw(encores[0], T.encore, 0.22, { scale: [2.6, 1], opacity: [0, 1], blur: [26, 0] }, ease.out4)
  encores.slice(1).forEach((el, i) => {
    set(el, 0, { opacity: 0 })
    tw(el, T.encoreScroll + i * 0.015, 0.06, { opacity: [0, 1] })
  })
  const COL_TRAVEL = 1025
  tw(col, T.encoreScroll, T.stop - T.encoreScroll, { y: [0, -COL_TRAVEL] }, ease.in2)
  stagger([...encores].reverse(), T.stop + 0.02, 0.022, 0.2, { scale: 0, opacity: 0 }, ease.in3)
  const blurNode2 = $('#mblurNode2')
  onFrame((t) => {
    const D = T.stop - T.encoreScroll
    const p = clamp((t - T.encoreScroll) / D)
    const v = t > T.encoreScroll && t < T.stop ? (2 * COL_TRAVEL * p) / D : 0
    blurNode2.setAttribute('stdDeviation', `0 ${Math.min(26, v * 0.0034).toFixed(2)}`)
  })

  // --- Le geste du pouce : un balayage à chaque coup de scroll
  const touch = $('#touch')
  set(touch, 0, { opacity: 0, x: 770, y: 1580 })
  T.flicks.forEach((f) => {
    const s = Math.max(0, f - 0.12)
    set(touch, s, { x: 780, y: 1590, scale: 0.8 })
    tw(touch, s, 0.03, { opacity: [0, 0.85], scale: [0.8, 1] })
    tw(touch, s + 0.001, f - s, { y: 1180, x: 752 }, ease.in2)
    tw(touch, f, 0.06, { y: 1020, x: 740, opacity: 0 }, ease.out2)
  })
  // … puis le doigt vient appuyer sur le bouton.
  set(touch, T.fingerIn, { x: 940, y: 1740, scale: 1 })
  tw(touch, T.fingerIn, 0.1, { opacity: [0, 0.9] })
  tw(touch, T.fingerIn + 0.001, T.press - T.fingerIn - 0.03, { x: 560, y: 1010 }, ease.out3)
  tw(touch, T.press, 0.07, { scale: 0.76 }, ease.out2)
  tw(touch, T.press + 0.07, 0.16, { scale: 1 }, ease.out2)
  tw(touch, T.press + 0.25, 0.2, { opacity: 0, y: 1060 }, ease.in2)
  set('#tapRing', 0, { x: 560, y: 1010, opacity: 0 })
  tw('#tapRing', T.press, 0.45, { scale: [0.6, 3.4], opacity: [0.9, 0] }, ease.out2)

  // --- Le bouton « J'ai envie de scroller »
  const btn = $('#btn')
  set(btn, 0, { scale: 0 })
  tw(btn, T.button, 0.55, { scale: [0, 1], rot: [-14, 0] }, ease.back(2.1))
  tw(btn, T.press, 0.07, { scale: 0.88 }, ease.out2)
  tw(btn, T.press + 0.07, 0.4, { scale: 1.04 }, ease.back(3))
  tw(btn, T.charge, T.drop - T.charge, { scale: 1.14 }, ease.in2)
  $$('#btn .ring').forEach((ring, i) => {
    set(ring, 0, { opacity: 0 })
    for (let n = 0; n < 3; n++) {
      const t0 = T.button + 0.25 + i * 0.47 + n * 0.94
      if (t0 > T.charge - 0.1) break
      tw(ring, t0, 0.9, { scale: [1, 1.6], opacity: [0.6, 0] }, ease.out2)
    }
    tw(ring, T.charge + i * 0.18, 0.4, { scale: [1.9, 1], opacity: [0, 0.7] }, ease.in2)
    set(ring, T.drop, { opacity: 0 })
  })
  tw('#btnCircle', T.drop, 0.55, { scale: [1, 6] }, ease.expoOut)
  tw('#btnLabel', T.drop, 0.16, { scale: [1, 2.2], opacity: [1, 0] }, ease.out2)
  const btnShake = $('#btnShake')
  const btnSpark = $('#btnSpark')
  onFrame((t) => {
    const a = t > T.charge && t < T.drop ? 12 * prog(t, T.charge, T.drop - T.charge, ease.in2) : 0
    btnShake.style.transform = `translate(${(a * Math.sin(t * 120)).toFixed(2)}px, ${(a * Math.cos(t * 150)).toFixed(2)}px) rotate(${(a * 0.25 * Math.sin(t * 90)).toFixed(2)}deg)`
    const spin = t * 40 + (t > T.charge ? (t - T.charge) ** 2 * 2600 : 0)
    btnSpark.style.transform = `rotate(${spin.toFixed(1)}deg)`
  })

  // --- « Cette envie-là ? » / « Transforme-la. »
  const q = splitWords($('#question'))
  stagger(q, T.question, 0.09, 0.42, { y: [70, 0], opacity: [0, 1], rot: [-6, 0] }, ease.back(1.6))
  stagger(q, T.charge + 0.12, 0.04, 0.2, { y: -60, opacity: 0 }, ease.in2)
  const tr = splitChars($('#transformTxt'))
  stagger(tr, T.transform, 0.022, 0.4, { y: [90, 0], rot: [-10, 0], opacity: [0, 1], scale: [0.6, 1] }, ease.back(2))
  stagger(tr, T.drop - 0.14, 0.006, 0.12, { opacity: 0, scale: 1.4 }, ease.in2)

  // Secousses de caméra sur les temps forts.
  onFrame((t) => {
    if (t > T.drop + 0.5) return
    const [x, y] = shake(t, [
      [T.encore, 16],
      [T.stop, 24],
      [T.drop, 30],
    ])
    A.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`
  })
  set(A, T.drop + 0.7, { opacity: 0 })
}

// =============================================================================
//  EXPLOSION DE CONFETTIS (3,75 s)
// =============================================================================

function buildConfetti() {
  const fx = $('#fx')
  const R = rng(42)
  const colors = [...FAMILY_COLORS, '#F2B632', '#C4401C']
  const pieces = []
  for (let i = 0; i < 48; i++) {
    const c = colors[i % colors.length]
    const size = 24 + R() * 26
    const shapes = [
      `<circle r="${size / 2}" fill="${c}"/>`,
      `<rect x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" rx="5" fill="${c}"/>`,
      `<path d="M0 ${-size * 0.62} L${size * 0.56} ${size * 0.4} L${-size * 0.56} ${size * 0.4}Z" fill="${c}"/>`,
      `<circle r="${size / 2}" fill="none" stroke="${c}" stroke-width="8"/>`,
      `<path d="M${-size} 0 q${size / 4} ${-size / 2} ${size / 2} 0 t${size / 2} 0 t${size / 2} 0 t${size / 2} 0" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>`,
      spark(size * 0.75, c),
    ]
    const el = add(fx, `<svg class="abs" width="2" height="2" style="left:0;top:0;overflow:visible">${shapes[i % shapes.length]}</svg>`)
    const angle = R() * Math.PI * 2
    const speed = 1300 + R() * 1800
    pieces.push({
      el,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 350,
      spin: (R() - 0.5) * 1000,
      rot0: R() * 360,
      life: 0.95 + R() * 0.6,
      delay: R() * 0.05,
    })
  }
  const X0 = 540
  const Y0 = 1000
  const K = 2.3 // frottement de l'air
  const G = 2300 // gravité
  onFrame((t) => {
    for (const p of pieces) {
      const d = t - T.drop - p.delay
      if (d < 0 || d > p.life) {
        p.el.style.visibility = 'hidden'
        continue
      }
      const e = 1 - Math.exp(-K * d)
      const x = X0 + (p.vx / K) * e
      const y = Y0 + (G / K) * d + ((p.vy - G / K) / K) * e
      const s = Math.min(1, d / 0.06) * Math.min(1, (p.life - d) / 0.3)
      p.el.style.visibility = ''
      p.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(p.rot0 + p.spin * d).toFixed(1)}deg) scale(${s.toFixed(3)})`
    }
  })
}

// =============================================================================
//  B · SIX PASSIONS (3,75 → 9,4 s)
// =============================================================================

const BLOB_N = 10
const BLOB_SHAPES = SCENES.map((_, k) => {
  const R = rng(100 + k * 17)
  return Array.from({ length: BLOB_N }, () => 0.86 + R() * 0.26)
})

function sceneWindow(k) {
  const S = T.scenes[k] + (k === 0 ? 0.08 : 0)
  const E = k < SCENES.length - 1 ? T.scenes[k + 1] : T.dashboard + 0.6
  return [S, E]
}

function buildB() {
  const B = $('#B')
  B.innerHTML = `
    <div id="Bbg" class="layer dots" style="background-color:#f1e6d6"></div>
    <div id="world">
      <div id="worldBg" class="layer"></div>
      <div id="iris" class="abs"></div>
      <div id="worldDots" class="layer dots"></div>
      <div id="tint" class="layer"></div>
      <div id="montage" class="layer">
        <svg id="blobSvg" class="full" viewBox="0 0 1080 1920"><g id="bursts"></g><path id="blob"/></svg>
      </div>
      <div id="dash" class="layer"></div>
    </div>
    <div id="phone" class="abs"><div class="island"></div></div>
    <div id="progressTitle" class="abs display center-x"><div id="pt1">Chaque envie</div><div id="pt2" style="color:#C4401C">compte.</div></div>
    <svg class="full" style="pointer-events:none"><path id="ptUnder" fill="none" stroke="#C4401C" stroke-width="12" stroke-linecap="round"/></svg>
    <div id="stickers" class="layer"></div>`

  set(B, 0, { opacity: 0 })
  set(B, T.drop, { opacity: 1 })
  set('#Bbg', 0, { opacity: 0 })
  set('#Bbg', T.zoomOut, { opacity: 1 })
  set('#worldBg', 0, { opacity: 0 })
  set('#worldBg', T.drop + 0.55, { opacity: 1 })
  tw('#worldDots', T.drop + 0.5, 0.4, { opacity: [0, 1] })
  tw('#iris', T.drop + 0.03, 0.55, { scale: [0, 6] }, ease.expoOut)
  set('#iris', T.drop + 0.6, { opacity: 0 })

  buildMontage()
  buildDashboard()
  buildProgressExtras()
}

function buildMontage() {
  const montage = $('#montage')
  const blob = $('#blob')
  const bursts = $('#bursts')

  // --- La tache de couleur qui change de forme et de teinte à chaque passion
  set(blob, 0, { fill: SCENES[0].color })
  set('#tint', 0, { '--tint': SCENES[0].color, opacity: 0 })
  tw('#tint', T.drop + 0.3, 0.5, { opacity: 0.22 })
  SCENES.forEach((sc, k) => {
    if (k === 0) return
    tw(blob, T.scenes[k] - 0.06, 0.3, { fill: sc.color }, ease.io2)
    tw('#tint', T.scenes[k] - 0.06, 0.3, { '--tint': sc.color }, ease.io2)
  })
  onFrame((t) => {
    if (t < T.drop || t > T.slogan) return
    let m = 0
    T.scenes.forEach((s, k) => {
      if (k > 0) m += prog(t, s - 0.06, 0.32, ease.io3)
    })
    const k0 = Math.min(SCENES.length - 1, Math.floor(m))
    const k1 = Math.min(SCENES.length - 1, k0 + 1)
    const f = m - k0
    let last = T.scenes[0]
    for (const s of T.scenes) if (t >= s) last = s
    const s =
      last === T.scenes[0]
        ? ease.back(1.5)(clamp((t - (T.drop + 0.04)) / 0.55))
        : 0.9 + 0.1 * ease.elastic(0.4)(clamp((t - last) / 0.6))
    const pts = []
    for (let i = 0; i < BLOB_N; i++) {
      const th = (i / BLOB_N) * Math.PI * 2 + t * 0.35
      const r = lerp(BLOB_SHAPES[k0][i], BLOB_SHAPES[k1][i], f) + 0.035 * Math.sin(t * 3.1 + i * 1.7)
      pts.push([540 + Math.cos(th) * 385 * r * s, 1000 + Math.sin(th) * 345 * r * s])
    }
    blob.setAttribute('d', smoothClosed(pts))
  })

  // --- Traits d'éclat autour de la tache, à chaque changement de passion
  const burstLines = [-40, -15, 15, 40, 140, 165, 195, 220].map((deg) => {
    const a = (deg * Math.PI) / 180
    const [x1, y1, x2, y2] = [540 + Math.cos(a) * 455, 1000 + Math.sin(a) * 400, 540 + Math.cos(a) * 530, 1000 + Math.sin(a) * 465]
    return add(bursts, `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="14" stroke-linecap="round"/>`)
  })

  SCENES.forEach((sc, k) => {
    const [S, E] = sceneWindow(k)

    // Traits d'éclat
    burstLines.forEach((line, j) => {
      set(line, S, { stroke: sc.color, d0: 0 })
      tw(line, S + 0.02 + j * 0.008, 0.2, { d1: [0, 1] }, ease.out2)
      tw(line, S + 0.15 + j * 0.008, 0.22, { d0: [0, 1] }, ease.in2)
    })

    // Humeur (en haut)
    const chip = add(
      montage,
      `<div class="mood abs center-x"><div class="chip"><span class="emoji">${sc.emoji}</span><span>${sc.mood}${NNBSP}?</span></div></div>`,
    ).firstElementChild
    set(chip, 0, { opacity: 0 })
    tw(chip, S, 0.4, { scale: [0.3, 1], opacity: [0, 1], y: [40, 0] }, ease.back(2.2))
    if (k < SCENES.length - 1) tw(chip, E - 0.12, 0.12, { scale: 0.8, opacity: 0, y: -24 }, ease.in2)

    // Le verbe
    const verb = add(montage, `<div class="verb abs display center-x">${sc.verb}.</div>`)
    const chars = splitChars(verb)
    chars.at(-1).style.color = sc.color
    stagger(chars, 0, 0, 0, { opacity: 0 })
    stagger(chars, S + 0.03, 0.035, 0.42, { y: [180, 0], rot: [12, 0], scale: [0.6, 1], opacity: [0, 1] }, ease.back(1.7))
    if (k < SCENES.length - 1) stagger(chars, E - 0.15, 0.012, 0.13, { y: -160, opacity: 0 }, ease.in3)

    // L'illustration animée
    const il = add(montage, `<div class="illus abs" style="left:540px;top:1000px;width:0;height:0;transform-origin:0 0"></div>`)
    ILLUSTRATIONS[k](il, S, E)
    set(il, 0, { opacity: 0 })
    tw(il, S, 0.5, { scale: [0.2, 1], rot: [-14, 0], opacity: [0, 1] }, ease.back(1.7))
    if (k < SCENES.length - 1) tw(il, E - 0.11, 0.13, { scale: 0.5, rot: 12, opacity: 0 }, ease.in2)

    // La carte d'activité (comme dans l'app), qui se valide
    const card = add(
      montage,
      `<div class="card abs">
        <div class="bubble" style="background:color-mix(in oklab, ${sc.color} 18%, #fffdf9)">${sc.icon}</div>
        <div class="txt"><div class="title display">${sc.title}</div><div class="meta">${sc.passion} · ${sc.dur}${NNBSP}min</div></div>
        <div class="check"><div class="fill" style="color:#fff7ee"><span style="display:block;width:52px;height:52px">${ICON.check}</span></div></div>
      </div>`,
    )
    set(card, 0, { x: 1200 })
    tw(card, S + 0.1, 0.5, { x: [820, 0], rot: [10, 0] }, ease.back(1.25))
    if (k < SCENES.length - 1) tw(card, E - 0.12, 0.22, { x: -1000, rot: -9 }, ease.in3)
    const fill = $('.fill', card)
    set(fill, 0, { scale: 0 })
    tw(fill, S + 0.55, 0.32, { scale: [0, 1] }, ease.back(3))
  })
}

// ---------------------------------------------------------- les illustrations

function ilSvg(inner) {
  return `<svg class="il" viewBox="-400 -360 800 720" width="800" height="720" style="position:absolute;left:-400px;top:-360px;overflow:visible">${inner}</svg>`
}

/** « Dessine. » : un chat dessiné d'un seul trait, crayon en main. */
function illusDessine(il, S, E) {
  il.innerHTML = ilSvg(`
    <g transform="rotate(-4)">
      <rect x="-280" y="-215" width="560" height="430" rx="30" fill="#FFFDF9" filter="url(#paperShadow)"/>
      ${['head', 'eyes', 'nose', 'whiskers'].map((k) => `<path class="cat" d="${CAT[k]}" fill="none" stroke="#2A1F1A" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
      <ellipse class="blush" cx="-84" cy="46" rx="21" ry="12" fill="#F4A59A" data-pivot="-84 46"/>
      <ellipse class="blush" cx="84" cy="46" rx="21" ry="12" fill="#F4A59A" data-pivot="84 46"/>
    </g>
    <g class="pencil">${PENCIL}</g>`)
  const paths = $$('.cat', il)
  const lens = paths.map((p) => p.getTotalLength())
  // Instants de tracé de chaque partie : [début, durée]
  const times = [
    [S + 0.1, 0.27],
    [S + 0.39, 0.06],
    [S + 0.465, 0.055],
    [S + 0.535, 0.07],
  ]
  paths.forEach((p, i) => {
    set(p, 0, { d1: 0 })
    tw(p, times[i][0], times[i][1], { d1: [0, 1] }, i === 0 ? ease.io2 : ease.linear)
  })
  $$('.blush', il).forEach((b) => {
    set(b, 0, { scale: 0 })
    tw(b, S + 0.6, 0.3, { scale: [0, 1] }, ease.back(3))
  })
  const pencil = $('.pencil', il)
  const rad = (-4 * Math.PI) / 180
  const rotPt = (pt) => [pt.x * Math.cos(rad) - pt.y * Math.sin(rad), pt.x * Math.sin(rad) + pt.y * Math.cos(rad)]
  const at = (i, len) => rotPt(paths[i].getPointAtLength(len))
  const drawStart = times[0][0]
  const drawEnd = times[3][0] + times[3][1]
  onFrame((t) => {
    if (t < S - 0.05 || t > E) return
    let tip
    if (t < drawStart) {
      const p0 = at(0, 0)
      const q = ease.out3(clamp((t - S) / (drawStart - S)))
      tip = [lerp(p0[0] + 380, p0[0], q), lerp(p0[1] - 420, p0[1], q)]
    } else if (t <= drawEnd) {
      let i = times.findIndex(([t0, d]) => t <= t0 + d)
      if (i < 0) i = 3
      const [t0, d] = times[i]
      if (t < t0) {
        const a = at(i - 1, lens[i - 1])
        const b = at(i, 0)
        const prevEnd = times[i - 1][0] + times[i - 1][1]
        const q = ease.io2(clamp((t - prevEnd) / (t0 - prevEnd)))
        tip = [lerp(a[0], b[0], q), lerp(a[1], b[1], q) - 18 * Math.sin(Math.PI * q)]
      } else {
        const q = (i === 0 ? ease.io2 : ease.linear)(clamp((t - t0) / d))
        tip = at(i, q * lens[i])
      }
    } else {
      const pe = at(3, lens[3])
      const q = ease.in2(clamp((t - drawEnd) / 0.18))
      tip = [lerp(pe[0], pe[0] + 440, q), lerp(pe[1], pe[1] - 400, q)]
    }
    pencil.setAttribute('transform', pencilPose(tip[0], tip[1], -40 + 5 * Math.sin(t * 38), 6.2))
  })
}

/** « Filme. » : clap qui claque, pellicule qui défile, cinq étoiles. */
function illusFilme(il, S) {
  let holes = ''
  let frames = ''
  for (let x = -1500; x <= 1500; x += 64) holes += `<rect x="${x}" y="-88" width="32" height="24" rx="6" fill="#FBF5EC"/><rect x="${x}" y="64" width="32" height="24" rx="6" fill="#FBF5EC"/>`
  for (let x = -1500, i = 0; x <= 1500; x += 256, i++) frames += `<rect x="${x + 16}" y="-50" width="224" height="100" rx="12" fill="${i % 2 ? '#C8B0F5' : '#E6DAFC'}"/>`
  const stripes = (y) => {
    let s = ''
    for (let i = -1; i < 6; i++) {
      const x0 = -225 + i * 90
      s += `<polygon points="${x0},${y + 58} ${x0 + 34},${y} ${x0 + 79},${y} ${x0 + 45},${y + 58}" fill="#2A1F1A"/>`
    }
    return s
  }
  il.innerHTML = ilSvg(`
    <defs>
      <clipPath id="clapTop"><rect x="-225" y="-196" width="450" height="58" rx="10"/></clipPath>
      <clipPath id="clapBot"><rect x="-225" y="-138" width="450" height="58" rx="10"/></clipPath>
    </defs>
    <g transform="rotate(-10) translate(0 60)"><g class="strip"><rect x="-1500" y="-100" width="3000" height="200" fill="#2A1F1A"/>${frames}${holes}</g></g>
    <g transform="translate(0 -12)">
      <rect x="-225" y="-80" width="450" height="280" rx="26" fill="#2A1F1A"/>
      <g font-family="Figtree Variable" font-weight="700" font-size="34" fill="#FBF5EC" letter-spacing="2">
        <text x="-190" y="-12">SCÈNE</text><text x="30" y="-12">PRISE</text>
        <text x="-190" y="120" font-size="30" fill="#BCAA9C">PLUTÔT QUE SCROLLER</text>
      </g>
      <g font-family="Fraunces Variable" font-weight="700" font-size="64" fill="#FBF5EC"><text x="-190" y="62">1</text><text x="30" y="62">3</text></g>
      <path d="M-200 82 H200 M0 -44 V82" stroke="#5E4E44" stroke-width="4"/>
      <circle class="rec" cx="178" cy="-40" r="14" fill="#E4572E"/>
      <g clip-path="url(#clapBot)"><rect x="-225" y="-138" width="450" height="58" fill="#FBF5EC"/>${stripes(-138)}</g>
      <g class="arm" data-pivot="-225 -138">
        <g clip-path="url(#clapTop)"><rect x="-225" y="-196" width="450" height="58" fill="#FBF5EC"/>${stripes(-196)}</g>
        <rect x="-225" y="-196" width="450" height="58" rx="10" fill="none" stroke="#2A1F1A" stroke-width="5"/>
      </g>
      <g class="impact" stroke="#2A1F1A" stroke-width="10" stroke-linecap="round">
        <line x1="250" y1="-150" x2="300" y2="-170"/><line x1="252" y1="-120" x2="310" y2="-120"/><line x1="250" y1="-92" x2="300" y2="-72"/>
      </g>
    </g>
    <g transform="translate(0 290)">${[0, 1, 2, 3, 4].map((i) => `<g transform="translate(${-200 + i * 100} 0)"><path class="star" d="${star5(44, 20)}" fill="#F2B632" stroke="#2A1F1A" stroke-width="6" stroke-linejoin="round" data-pivot="0 0"/></g>`).join('')}</g>`)

  const clap = beat(10.75)
  const arm = $('.arm', il)
  set(arm, 0, { rot: 0 })
  tw(arm, S, 0.2, { rot: [0, -26] }, ease.out3)
  tw(arm, clap - 0.07, 0.07, { rot: 0 }, ease.in3)
  tw(arm, clap, 0.1, { rot: -5 }, ease.out2)
  tw(arm, clap + 0.1, 0.12, { rot: 0 }, ease.in2)
  $$('.impact line', il).forEach((line, j) => {
    set(line, 0, { d1: 0 })
    tw(line, clap + j * 0.015, 0.1, { d1: [0, 1] }, ease.out2)
    tw(line, clap + 0.12 + j * 0.015, 0.14, { d0: [0, 1] }, ease.in2)
  })
  $$('.star', il).forEach((star, i) => {
    set(star, 0, { scale: 0 })
    tw(star, beat(11) + i * 0.045, 0.4, { scale: [0, 1], rot: [-140, 0] }, ease.back(2.6))
  })
  const strip = $('.strip', il)
  const rec = $('.rec', il)
  onFrame((t) => {
    if (t < S - 0.1 || t > S + 1.2) return
    strip.setAttribute('transform', `translate(${(-((t - S) * 420) % 256).toFixed(1)} 0)`)
    rec.style.opacity = Math.floor(t / 0.16) % 2 ? '0.25' : '1'
  })
}

/** « Écris. » : un carnet où s'écrivent des titres d'histoires. */
function illusEcris(il, S, E) {
  const lines = ['1. Le chat qui votait', '2. Minuit au CDI', '3. ']
  il.innerHTML = `<div class="notebook" style="transform:rotate(3deg)"></div>`
  const nb = $('.notebook', il)
  const chars = []
  lines.forEach((text) => {
    const line = add(nb, '<div class="line"></div>')
    ;[...text].forEach((c, i) => {
      const s = add(line, `<span class="ch${i < 2 ? ' num' : ''}"></span>`)
      s.textContent = c
      chars.push(s)
    })
  })
  const caret = add(nb, '<div id="caret"></div>')
  const pen = add(
    nb,
    `<svg class="abs" width="300" height="300" viewBox="0 0 300 300" style="left:0;top:0;overflow:visible">
      <g transform="rotate(38)">
        <path d="M0 0 L22 -9 L22 9 Z" fill="#2A1F1A"/>
        <rect x="20" y="-15" width="46" height="30" rx="6" fill="#9DB8E8" stroke="#2A1F1A" stroke-width="4"/>
        <rect x="62" y="-19" width="200" height="38" rx="12" fill="#3D7DD8" stroke="#2A1F1A" stroke-width="4"/>
        <rect x="120" y="-27" width="120" height="12" rx="6" fill="#2A1F1A"/>
      </g></svg>`,
  )
  const start = S + 0.1
  const each = 0.016
  const typed = chars.map((_, i) => start + i * each)
  chars.forEach((c, i) => {
    set(c, 0, { opacity: 0 })
    tw(c, typed[i], 0.05, { opacity: [0, 1], y: [10, 0] }, ease.out2)
  })
  const typeEnd = typed.at(-1) + 0.05
  onFrame((t) => {
    if (t < S - 0.05 || t > E + 0.05) return
    let i = -1
    for (let j = 0; j < typed.length; j++) if (typed[j] <= t) i = j
    const ref = chars[Math.max(0, i)]
    const x = i < 0 ? ref.offsetLeft : ref.offsetLeft + ref.offsetWidth
    const y = ref.offsetTop + 10
    caret.style.transform = `translate(${x + 3}px, ${y}px)`
    caret.style.opacity = t < typeEnd || Math.floor((t - typeEnd) / 0.13) % 2 ? '1' : '0'
    const bob = t < typeEnd ? 7 * Math.abs(Math.sin(((t - start) * Math.PI) / each / 2)) : 0
    pen.style.transform = `translate(${x + 8}px, ${y + 48 - bob}px)`
  })
}

/** « Joue. » : égaliseur calé sur la musique, notes qui s'envolent. */
function illusJoue(il, S, E) {
  const barX = Array.from({ length: 7 }, (_, i) => -332 + i * 100)
  const note = (dbl, color) =>
    dbl
      ? `<g fill="${color}"><ellipse cx="-22" cy="30" rx="18" ry="13" transform="rotate(-22 -22 30)"/><ellipse cx="34" cy="20" rx="18" ry="13" transform="rotate(-22 34 20)"/><rect x="-8" y="-52" width="8" height="84"/><rect x="48" y="-62" width="8" height="84"/><path d="M-8 -52 L56 -62 L56 -44 L-8 -34Z"/></g>`
      : `<g fill="${color}"><ellipse cx="0" cy="36" rx="19" ry="14" transform="rotate(-22 0 36)"/><rect x="13" y="-50" width="8" height="84"/><path d="M21 -50 C 44 -40 50 -18 36 0 C 42 -18 36 -30 21 -32Z"/></g>`
  il.innerHTML = ilSvg(`
    <g class="root">
      <circle class="ring" r="200" fill="none" stroke="#FFFDF9" stroke-width="12"/>
      <circle class="ring" r="200" fill="none" stroke="#FFFDF9" stroke-width="12"/>
      ${barX.map((x) => `<rect class="eqbar" x="${x}" width="64" rx="32" fill="#FFFDF9"/>`).join('')}
      ${Array.from({ length: 8 }, (_, i) => `<g class="note">${note(i % 3 === 1, i % 2 ? '#2A1F1A' : '#FFFDF9')}</g>`).join('')}
    </g>`)
  const root = $('.root', il)
  const bars = $$('.eqbar', il)
  const rings = $$('.ring', il)
  const notes = $$('.note', il)
  const BOTTOM = 215
  const R = rng(9)
  const noteSpecs = notes.map((_, i) => ({
    t0: S + 0.04 + i * (BEAT / 4),
    x0: barX[(i * 3 + 1) % 7] + 32,
    vx: (R() - 0.5) * 520,
    vy: -760 - R() * 360,
    spin: (R() - 0.5) * 260,
  }))
  onFrame((t) => {
    if (t < S - 0.05 || t > E + 0.05) return
    const n = Math.floor(t / BEAT)
    const since = t - n * BEAT
    const env = Math.exp(-since / 0.22)
    const since8 = t - Math.floor(t / (BEAT / 2)) * (BEAT / 2)
    const env8 = Math.exp(-since8 / 0.1)
    bars.forEach((bar, i) => {
      const w = 0.35 + 0.65 * Math.abs(Math.sin(i * 1.9 + n * 2.3))
      const h = 96 + 300 * (0.22 + 0.58 * env * w + 0.2 * env8 * (1 - w))
      bar.setAttribute('y', (BOTTOM - h).toFixed(1))
      bar.setAttribute('height', h.toFixed(1))
    })
    root.setAttribute('transform', `translate(0 20) scale(${(1 + 0.045 * env).toFixed(4)})`)
    rings.forEach((ring, i) => {
      const k = n - i
      const d = t - k * BEAT
      const visible = k % 2 === 0 && d >= 0 && d < 0.5
      const q = clamp(d / 0.5)
      ring.setAttribute('r', (170 + 260 * ease.out2(q)).toFixed(1))
      ring.setAttribute('opacity', visible ? (0.75 * (1 - q)).toFixed(3) : '0')
    })
    notes.forEach((el, i) => {
      const sp = noteSpecs[i]
      const d = t - sp.t0
      if (d < 0 || d > 0.7) {
        el.setAttribute('opacity', '0')
        return
      }
      const x = sp.x0 + sp.vx * d
      const y = 40 + sp.vy * d + 900 * d * d
      el.setAttribute('opacity', Math.min(1, d / 0.05, (0.7 - d) / 0.2).toFixed(3))
      el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(sp.spin * d).toFixed(1)}) scale(${(0.6 + 0.6 * Math.min(1, d / 0.15)).toFixed(3)})`)
    })
  })
}

/** « Bouge. » : un petit personnage qui saute et secoue son stress. */
function illusBouge(il, S, E) {
  const scribble = (x, y) =>
    `<path d="M${x} ${y} c 18 -26 42 6 20 18 c -22 12 -34 -22 -6 -28 c 30 -6 32 30 8 30" fill="none" stroke="#2A1F1A" stroke-width="7" stroke-linecap="round"/>`
  il.innerHTML = ilSvg(`
    <ellipse class="shadow" cx="0" cy="250" rx="130" ry="20" fill="#2A1F1A" opacity="0.2"/>
    <g class="mlines" stroke="#FFFDF9" stroke-width="10" stroke-linecap="round" fill="none">
      <path d="M-230 -40 q -26 40 0 80"/><path d="M-270 -60 q -36 60 0 120"/>
      <path d="M230 -40 q 26 40 0 80"/><path d="M270 -60 q 36 60 0 120"/>
    </g>
    <g class="dude">
      <path class="legL" stroke="#2A1F1A" stroke-width="18" stroke-linecap="round"/>
      <path class="legR" stroke="#2A1F1A" stroke-width="18" stroke-linecap="round"/>
      <ellipse class="footL" rx="30" ry="14" fill="#2A1F1A"/><ellipse class="footR" rx="30" ry="14" fill="#2A1F1A"/>
      <path class="armL" stroke="#2A1F1A" stroke-width="18" stroke-linecap="round" fill="none"/>
      <path class="armR" stroke="#2A1F1A" stroke-width="18" stroke-linecap="round" fill="none"/>
      <ellipse cx="0" cy="30" rx="128" ry="138" fill="#FFFDF9" stroke="#2A1F1A" stroke-width="10"/>
      <path d="M-114 -30 Q 0 -96 114 -30" fill="none" stroke="#E4572E" stroke-width="24" stroke-linecap="round"/>
      <ellipse cx="-42" cy="10" rx="12" ry="16" fill="#2A1F1A"/><ellipse cx="42" cy="10" rx="12" ry="16" fill="#2A1F1A"/>
      <ellipse cx="-76" cy="54" rx="20" ry="11" fill="#F4A59A"/><ellipse cx="76" cy="54" rx="20" ry="11" fill="#F4A59A"/>
      <path d="M-40 56 Q 0 108 40 56 Z" fill="#2A1F1A"/><path d="M-18 84 Q 0 100 18 84 Q 0 76 -18 84Z" fill="#E4572E"/>
    </g>
    <g class="scrib">${scribble(-150, -190)}</g><g class="scrib">${scribble(20, -230)}</g><g class="scrib">${scribble(150, -180)}</g>`)
  const dude = $('.dude', il)
  const [legL, legR, footL, footR, armL, armR] = ['.legL', '.legR', '.footL', '.footR', '.armL', '.armR'].map((s) => $(s, il))
  const shadow = $('.shadow', il)
  const mlines = $('.mlines', il)
  const scribs = $$('.scrib', il)
  const jumps = [beat(16), beat(17)]
  onFrame((t) => {
    if (t < S - 0.05 || t > E + 0.05) return
    let h = 0
    let sx = 1
    let sy = 1
    let air = 0
    let land = 0
    for (const j of jumps) {
      const phi = (t - j) / BEAT
      if (phi < 0 || phi > 1) continue
      if (phi < 0.14) {
        const c = Math.sin((Math.PI * phi) / 0.28)
        sy = 1 - 0.16 * c
        sx = 1 + 0.1 * c
      } else if (phi < 0.62) {
        const q = (phi - 0.14) / 0.48
        h = 175 * Math.sin(Math.PI * q)
        air = Math.sin(Math.PI * q)
        sy = 1 + 0.08 * (1 - q)
        sx = 1 - 0.05 * (1 - q)
      } else {
        const q = (phi - 0.62) / 0.38
        land = Math.exp(-q * 5)
        sy = 1 - 0.17 * land * Math.cos(q * 9)
        sx = 1 + 0.12 * land * Math.cos(q * 9)
      }
    }
    const wob = (5 + 4 * (1 - air)) * Math.sin(t * 2 * Math.PI * 7.5)
    dude.setAttribute('transform', `translate(0 ${(-h).toFixed(1)}) translate(0 230) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(0 -230) rotate(${wob.toFixed(2)} 0 120)`)
    // Bras : en bas au repos, en l'air pendant le saut (et qui s'agitent)
    const armAng = lerp(55, -58, air) + 14 * Math.sin(t * 2 * Math.PI * 6.5)
    const arm = (sign) => {
      const a = (armAng * Math.PI) / 180
      const x0 = sign * 112
      const y0 = 30
      const x1 = x0 + sign * 70 * Math.cos(a)
      const y1 = y0 + 70 * Math.sin(a)
      const x2 = x1 + sign * 62 * Math.cos(a - sign * 0.5 * (1 - air))
      const y2 = y1 + 62 * Math.sin(a - 0.4)
      return `M${x0} ${y0} Q ${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
    }
    armL.setAttribute('d', arm(-1))
    armR.setAttribute('d', arm(1))
    const spread = 26 + 44 * air
    legL.setAttribute('d', `M-50 150 L${-50 - spread} 228`)
    legR.setAttribute('d', `M50 150 L${50 + spread} 228`)
    footL.setAttribute('cx', (-58 - spread).toFixed(1))
    footL.setAttribute('cy', '234')
    footR.setAttribute('cx', (58 + spread).toFixed(1))
    footR.setAttribute('cy', '234')
    const shrink = 1 - h / 360
    shadow.setAttribute('rx', (130 * shrink).toFixed(1))
    shadow.setAttribute('opacity', (0.22 * shrink).toFixed(3))
    mlines.setAttribute('opacity', (land * 0.95).toFixed(3))
    // Le stress s'envole en gribouillis
    scribs.forEach((g, i) => {
      const t0 = jumps[0] + 0.12 + i * 0.22
      const d = t - t0
      const q = clamp(d / 0.5)
      const dir = i === 0 ? -1 : i === 1 ? 0.2 : 1
      const x = dir * 260 * ease.out2(q)
      const y = -200 * ease.out2(q) - h * (d < 0 ? 1 : 0)
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(dir * 120 * q).toFixed(1)})`)
      g.setAttribute('opacity', d < 0 ? '1' : (1 - q).toFixed(3))
    })
  })
}

/** « Cuisine. » : une galette qui saute dans la poêle et se retourne. */
function illusCuisine(il, S, E) {
  il.innerHTML = ilSvg(`
    <g class="steam" stroke="#FFFDF9" stroke-width="12" stroke-linecap="round" fill="none">
      ${[-90, 0, 90].map((x) => `<path d="M${x} 0 c -24 -40 24 -70 0 -110 c -24 -40 24 -70 0 -110"/>`).join('')}
    </g>
    <g class="pan">
      <rect x="170" y="-28" width="290" height="56" rx="28" fill="#2A1F1A" transform="rotate(12)"/>
      <ellipse cx="0" cy="40" rx="232" ry="142" fill="#2A1F1A"/>
      <ellipse cx="0" cy="30" rx="200" ry="114" fill="#4A3B33"/>
      <ellipse cx="-60" cy="-8" rx="70" ry="18" fill="#6A5A50" opacity="0.6"/>
    </g>
    <g class="galette">
      <ellipse class="gal" cx="0" cy="0" rx="152" ry="88" stroke="#B87812" stroke-width="7"/>
      <g class="spots" fill="#C98516" opacity="0.75"><ellipse cx="-60" cy="-20" rx="16" ry="9"/><ellipse cx="40" cy="12" rx="20" ry="10"/><ellipse cx="70" cy="-34" rx="12" ry="7"/><ellipse cx="-20" cy="36" rx="13" ry="7"/></g>
    </g>
    <g class="sizzle" fill="#FFFDF9">${Array.from({ length: 8 }, (_, i) => `<circle r="9" data-a="${i}"/>`).join('')}</g>`)
  const pan = $('.pan', il)
  const gal = $('.galette', il)
  const galFill = $('.gal', il)
  const spots = $('.spots', il)
  const steam = $$('.steam path', il)
  const sizzle = $$('.sizzle circle', il)
  const flip = S + 0.26
  const AIR = 0.42
  const landT = flip + AIR
  onFrame((t) => {
    if (t < S - 0.05 || t > E + 0.05) return
    const q = clamp((t - flip) / AIR)
    const inAir = t > flip && t < landT
    const y = inAir ? -340 * Math.sin(Math.PI * q) : 0
    const theta = 540 * ease.io2(q)
    const c = Math.cos((theta * Math.PI) / 180)
    let sx = 1
    let sy = Math.abs(c) < 0.06 ? 0.06 : Math.abs(c)
    const dl = t - landT
    if (dl > 0) {
      const k = Math.exp(-dl / 0.07)
      sx = 1 + 0.2 * k * Math.cos(dl * 45)
      sy = 1 - 0.22 * k * Math.cos(dl * 45)
    }
    const underside = c < 0
    galFill.setAttribute('fill', underside ? '#D9892A' : '#F2C04A')
    spots.setAttribute('opacity', underside ? '0.95' : '0.55')
    gal.setAttribute('transform', `translate(0 ${(y + 26).toFixed(1)}) rotate(${(14 * Math.sin(Math.PI * q)).toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})`)
    const kick = t > flip - 0.06 && t < flip + 0.12 ? -34 * Math.sin((Math.PI * (t - flip + 0.06)) / 0.18) : 0
    const dip = dl > 0 && dl < 0.2 ? 14 * Math.sin((Math.PI * dl) / 0.2) : 0
    pan.setAttribute('transform', `translate(0 ${(kick + dip).toFixed(1)}) rotate(${(kick * 0.18).toFixed(2)})`)
    steam.forEach((p, i) => {
      const cyc = (t - S - i * 0.28) / 0.9
      if (cyc < 0) {
        p.setAttribute('opacity', '0')
        return
      }
      const f = cyc % 1
      p.setAttribute('transform', `translate(${(10 * Math.sin(t * 5 + i)).toFixed(1)} ${(-40 - 150 * f).toFixed(1)}) scale(0.8)`)
      p.setAttribute('opacity', (0.85 * Math.sin(Math.PI * f)).toFixed(3))
    })
    sizzle.forEach((dot, i) => {
      const a = (i / sizzle.length) * Math.PI * 2
      const d = clamp((t - landT) / 0.35)
      const on = t > landT && d < 1
      dot.setAttribute('cx', (Math.cos(a) * (170 + 120 * ease.out2(d))).toFixed(1))
      dot.setAttribute('cy', (26 + Math.sin(a) * (100 + 80 * ease.out2(d))).toFixed(1))
      dot.setAttribute('opacity', on ? (1 - d).toFixed(3) : '0')
    })
  })
}

const ILLUSTRATIONS = [illusDessine, illusFilme, illusEcris, illusJoue, illusBouge, illusCuisine]

// =============================================================================
//  C · LA PROGRESSION DANS L'APP (9,4 → 11,25 s)
// =============================================================================

const CAL_LEVELS = [
  [0, 1, 0, 1, 1, 0, 0],
  [1, 0, 1, 1, 0, 2, 1],
  [1, 2, 1, 0, 2, 2, 1],
  [2, 2, 3, 2, 2, 3, 2],
  [3, 3, -1, -1, -1, -1, -1],
]
const CAL_DAYS = [
  [31, 1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12, 13],
  [14, 15, 16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25, 26, 27],
  [28, 29, 30, 1, 2, 3, 4],
]
const CAL_STYLE = {
  '-1': 'background:transparent;border:3px solid #3a2e27;color:#5e4e44',
  0: 'background:#3a2e27;color:#8f7e71',
  1: 'background:#6b3322;color:#f5ebe0',
  2: 'background:#a8401f;color:#f5ebe0',
  3: 'background:#ff7a50;color:#1a100c',
}

const catThumb = `<svg viewBox="-230 -200 460 380" width="100%" height="100%"><g fill="none" stroke="#2A1F1A" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">${Object.values(CAT).map((d) => `<path d="${d}"/>`).join('')}</g><ellipse cx="-84" cy="46" rx="21" ry="12" fill="#F4A59A"/><ellipse cx="84" cy="46" rx="21" ry="12" fill="#F4A59A"/></svg>`
const cupThumb = `<svg viewBox="0 0 300 250" width="100%" height="100%"><g fill="none" stroke="#2A1F1A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M80 90 h120 v70 a50 50 0 0 1 -50 50 h-20 a50 50 0 0 1 -50 -50z"/><path d="M200 110 h18 a24 24 0 0 1 0 48 h-18"/><path d="M110 70 q-12 -18 0 -34 M140 66 q-12 -18 0 -34 M170 70 q-12 -18 0 -34"/><path d="M50 222 h200"/></g></svg>`
const monsterThumb = `<svg viewBox="0 0 300 250" width="100%" height="100%"><g stroke="#2A1F1A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M95 200 q-30 -110 55 -130 q85 20 55 130z" fill="#9ED3A8"/><path d="M150 70 l-14 -34 l30 8z" fill="#F2B632"/><circle cx="130" cy="120" r="9" fill="#2A1F1A"/><circle cx="172" cy="120" r="9" fill="#2A1F1A"/><path d="M128 160 q22 14 44 0" fill="none"/><path d="M95 150 l-30 -20 M205 150 l30 -20" fill="none"/><path d="M120 200 v22 M180 200 v22" fill="none"/></g></svg>`

function buildDashboard() {
  const dash = $('#dash')
  const tiles = [
    { emoji: '🔥', label: 'de série', to: 12, fmt: (n) => `${Math.round(n)} jours` },
    { emoji: '✨', label: 'envies transformées', to: 47, fmt: (n) => `${Math.round(n)}` },
    { emoji: '⏱️', label: 'récupérées', to: 700, fmt: fmtHM },
  ]
  dash.innerHTML = `
    <div class="status abs"><span>9:41</span><span style="display:flex;gap:14px;align-items:center">
      <svg width="50" height="30" viewBox="0 0 50 30"><rect x="0" y="18" width="8" height="12" rx="2" fill="#2A1F1A"/><rect x="13" y="12" width="8" height="18" rx="2" fill="#2A1F1A"/><rect x="26" y="6" width="8" height="24" rx="2" fill="#2A1F1A"/><rect x="39" y="0" width="8" height="30" rx="2" fill="#2A1F1A"/></svg>
      <svg width="62" height="30" viewBox="0 0 62 30"><rect x="1.5" y="1.5" width="52" height="27" rx="8" fill="none" stroke="#2A1F1A" stroke-width="3"/><rect x="6" y="6" width="36" height="18" rx="4" fill="#2A1F1A"/><rect x="56" y="10" width="5" height="10" rx="2" fill="#2A1F1A"/></svg></span></div>
    <div class="dash-title abs display">Ta progression</div>
    <div class="dash-sub abs">Ta série tient bon, continue${NNBSP}!</div>
    ${tiles.map((tile, i) => `<div class="tile abs" style="left:${60 + i * 332}px"><div class="emoji">${tile.emoji}</div><div class="value"></div><div class="label">${tile.label}</div></div>`).join('')}
    <div class="cal abs">
      <div class="cal-head"><span class="display">Tes 5 dernières semaines</span><span class="count">23 jours actifs</span></div>
      <div class="cal-days">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<span>${d}</span>`).join('')}</div>
    </div>
    <div class="gallery-title abs display">Tes dessins</div>
    ${[catThumb, cupThumb, monsterThumb].map((svg, i) => `<div class="thumb abs" style="left:${60 + i * 332}px">${svg}</div>`).join('')}
    <div class="abs" style="left:0;top:1790px;width:1080px;height:130px;background:#fffdf9;border-top:2px solid #eadfd0;display:flex;justify-content:space-around;align-items:center;font-size:30px;font-weight:600;color:#8c7b6f">
      <span style="display:flex;flex-direction:column;align-items:center;gap:6px"><span style="width:50px;height:50px">${ICON.house}</span>Accueil</span>
      <span style="display:flex;flex-direction:column;align-items:center;gap:6px;color:#c4401c"><span style="width:50px;height:50px;padding:6px 26px;border-radius:30px;background:#fce6db">${ICON.chart}</span>Progrès</span>
      <span style="display:flex;flex-direction:column;align-items:center;gap:6px"><span style="width:50px;height:50px">${ICON.user}</span>Profil</span>
    </div>`

  const cal = $('.cal', dash)
  const cells = []
  CAL_LEVELS.forEach((row, r) =>
    row.forEach((level, c) => {
      const today = r === 4 && c === 1
      const cell = add(cal, `<div class="cell" style="left:${48 + c * 124}px;top:${200 + r * 100}px;${CAL_STYLE[level]}${today ? ';box-shadow:0 0 0 5px #f5ebe0' : ''}">${CAL_DAYS[r][c]}</div>`)
      cells.push({ cell, r, c })
    }),
  )

  const T0 = T.dashboard
  set('#dash', 0, { x: 1080 })
  tw('#dash', T0, 0.45, { x: [1080, 0] }, ease.io3)
  tw('#montage', T0, 0.45, { x: [0, -1080] }, ease.io3)
  tw([$('.dash-title', dash), $('.dash-sub', dash)], T0 + 0.25, 0.4, { y: [30, 0], opacity: [0, 1] })
  $$('.tile', dash).forEach((tile, i) => {
    tw(tile, T0 + 0.3 + i * 0.07, 0.45, { scale: [0.6, 1], opacity: [0, 1] }, ease.back(1.8))
    const value = $('.value', tile)
    value.__fmt = tiles[i].fmt
    tw(value, T0 + 0.35, 0.85, { text: [0, tiles[i].to] }, ease.out3)
  })
  tw(cal, T0 + 0.35, 0.45, { y: [70, 0], opacity: [0, 1] })
  cells.forEach(({ cell, r, c }) => tw(cell, T0 + 0.48 + (r + c) * 0.024, 0.35, { scale: [0, 1] }, ease.back(2.4)))
  tw($('.gallery-title', dash), T0 + 0.7, 0.4, { y: [30, 0], opacity: [0, 1] })
  $$('.thumb', dash).forEach((thumb, i) => tw(thumb, T0 + 0.76 + i * 0.07, 0.45, { scale: [0.5, 1], rot: [i % 2 ? 8 : -8, 0], opacity: [0, 1] }, ease.back(2)))
}

function buildProgressExtras() {
  // On recule : le monde entier rentre dans l'écran d'un téléphone.
  tw('#world', T.zoomOut, 0.6, { scale: [1, 0.5556], y: [0, 80], radius: [0, 126] }, ease.io4)
  set('#phone', 0, { opacity: 0 })
  tw('#phone', T.zoomOut, 0.12, { opacity: [0, 1] })
  tw('#phone', T.zoomOut, 0.6, { scale: [1.8, 1] }, ease.io4)

  const w1 = splitWords($('#pt1'))
  stagger(w1, 0, 0, 0, { opacity: 0 })
  stagger(w1, T.zoomOut + 0.25, 0.08, 0.45, { y: [90, 0], opacity: [0, 1], rot: [8, 0] }, ease.back(1.7))
  const c2 = splitChars($('#pt2'))
  // Soulignement ondulé sous « compte. », mesuré sur le texte réel.
  const title = $('#progressTitle')
  const x0 = title.offsetLeft + c2[0].offsetLeft
  const x1 = title.offsetLeft + c2.at(-1).offsetLeft + c2.at(-1).offsetWidth
  const yU = title.offsetTop + $('#pt2').offsetTop + $('#pt2').offsetHeight + 6
  const step = (x1 - x0) / 4
  $('#ptUnder').setAttribute('d', `M${x0.toFixed(1)} ${yU} q ${step / 2} -16 ${step} 0 t ${step} 0 t ${step} 0 t ${step} 0`)
  stagger(c2, 0, 0, 0, { opacity: 0 })
  stagger(c2, T.stickers[0], 0.03, 0.4, { y: [90, 0], scale: [0.4, 1], opacity: [0, 1] }, ease.back(2.2))
  set('#ptUnder', 0, { d1: 0 })
  tw('#ptUnder', T.stickers[0] + 0.25, 0.3, { d1: [0, 1] }, ease.out2)

  const stickers = [
    { left: 56, top: 700, rot: -7, emoji: '🔥', to: 12, fmt: (n) => `${Math.round(n)} jours` },
    { left: 600, top: 985, rot: 6, emoji: '✨', to: 47, fmt: (n) => `${Math.round(n)} envies` },
    { left: 70, top: 1300, rot: -4, emoji: '⏱️', to: 700, fmt: fmtHM },
  ]
  const layer = $('#stickers')
  stickers.forEach((s, i) => {
    const wrap = add(layer, `<div class="abs" style="left:${s.left}px;top:${s.top}px"><div class="sticker"><span class="emoji">${s.emoji}</span><span class="num"></span></div></div>`)
    const sticker = wrap.firstElementChild
    const num = $('.num', sticker)
    num.__fmt = s.fmt
    set(sticker, 0, { opacity: 0 })
    tw(sticker, T.stickers[i], 0.5, { scale: [0.3, 1], rot: [s.rot * 4, s.rot], opacity: [0, 1] }, ease.back(2.2))
    tw(num, T.stickers[i], 0.7, { text: [0, s.to] }, ease.out3)
    onFrame((t) => {
      if (t < T.stickers[i] || t > T.slogan) return
      wrap.style.transform = `translateY(${(9 * Math.sin((t - T.stickers[i]) * 4.2 + i * 2)).toFixed(2)}px)`
    })
  })

  // La vague couleur tomate emporte le téléphone.
  tw('#B', T.wipe, T.slogan - T.wipe, { y: [0, -260] }, ease.in2)
  set('#B', T.slogan + 0.05, { opacity: 0 })
}

// =============================================================================
//  D1 · « SCROLLE MOINS. CRÉE PLUS. » (11,25 → 13,1 s)
// =============================================================================

const STRIKE_PATH = 'M150 646 Q 244 601 338 638 T 526 638 T 714 638 T 902 623'

function buildD1() {
  const D1 = $('#D1')
  D1.innerHTML = `
    <svg class="full" viewBox="0 0 1080 1920"><path id="wave" fill="#C4401C"/></svg>
    <div id="D1bg" class="layer"></div>
    <div id="sl1" class="abs display center-x slogan" style="top:520px">Scrolle</div>
    <div id="sl2" class="abs display center-x slogan" style="top:738px">moins.</div>
    <div id="sl3" class="abs display center-x slogan" style="top:1030px;font-size:178px"><span id="sl3a">Crée</span> <span id="sl3b" style="color:#F2B632">plus.</span></div>
    <svg id="slSparks" class="full" viewBox="0 0 1080 1920">
      <g transform="translate(905 1020)"><g class="spk">${spark(46, '#F2B632')}</g></g>
      <g transform="translate(975 1185)"><g class="spk">${spark(28, '#FFF7EE')}</g></g>
      <g transform="translate(130 1070)"><g class="spk">${spark(34, '#FFF7EE')}</g></g>
    </svg>`

  // La vague qui monte
  const wave = $('#wave')
  onFrame((t) => {
    if (t < T.wipe - 0.02 || t > T.slogan + 0.1) return
    const top = lerp(2000, -170, prog(t, T.wipe, T.slogan - T.wipe, ease.in2))
    let d = `M0 ${top.toFixed(1)}`
    for (let x = 0; x <= 1080; x += 30) d += ` L${x} ${(top + 48 * Math.sin((x / 1080) * Math.PI * 3 + t * 14)).toFixed(1)}`
    wave.setAttribute('d', `${d} L1080 2100 L0 2100Z`)
  })
  set('#D1bg', 0, { opacity: 0 })
  set('#D1bg', T.slogan, { opacity: 1 })

  const c1 = splitChars($('#sl1'))
  const c2 = splitChars($('#sl2'))
  const c3a = splitChars($('#sl3a'))
  const c3b = splitChars($('#sl3b'))
  for (const group of [c1, c2, c3a, c3b]) stagger(group, 0, 0, 0, { opacity: 0 })
  stagger(c1, T.slogan + 0.02, 0.03, 0.45, { y: [200, 0], rot: [14, 0], scale: [0.5, 1], opacity: [0, 1] }, ease.back(1.8))
  stagger(c2, T.slogan + 0.14, 0.03, 0.45, { y: [200, 0], rot: [14, 0], scale: [0.5, 1], opacity: [0, 1] }, ease.back(1.8))
  // Quand le crayon barre « Scrolle », les lettres encaissent le choc.
  c1.forEach((ch, i) => {
    const hit = T.strike + 0.03 + i * 0.03
    tw(ch, hit, 0.07, { y: 14, rot: i % 2 ? 7 : -7 }, ease.out2)
    tw(ch, hit + 0.07, 0.35, { y: 0, rot: 0 }, ease.back(3))
  })
  stagger(c3a, T.create, 0.035, 0.45, { scale: [0, 1], rot: [-25, 0], opacity: [0, 1] }, ease.back(2.4))
  stagger(c3b, T.create + 0.14, 0.035, 0.45, { scale: [0, 1], rot: [-25, 0], opacity: [0, 1] }, ease.back(2.4))
  $$('#slSparks .spk').forEach((s, i) => {
    set(s, 0, { scale: 0 })
    tw(s, T.create + 0.3 + i * 0.07, 0.25, { scale: [0, 1.2], rot: [-90, 0] }, ease.back(2))
    tw(s, T.create + 0.55 + i * 0.07, 0.3, { scale: 0, rot: 60 }, ease.in2)
  })
  // Préparation du repli : le texte se retire.
  stagger([...c1, ...c2, ...c3a, ...c3b], T.shrink - 0.12, 0.004, 0.18, { opacity: 0, scale: 0.7 }, ease.in2)
  // Tout l'écran se replie en icône d'app.
  const half = MARK.size / 2
  tw(
    '#D1',
    T.shrink,
    T.endcard - T.shrink,
    { ciT: [0, MARK.cy - half], ciR: [0, 1080 - MARK.cx - half], ciB: [0, 1920 - MARK.cy - half], ciL: [0, MARK.cx - half], ciRad: [0, (MARK.size * 18) / 64] },
    ease.io4,
  )
  set('#D1', 0, { opacity: 1 })
  set('#D1', T.endcard + 0.02, { opacity: 0 })
}

// =============================================================================
//  LE GRAND CRAYON (barre « Scrolle », puis devient le crayon de l'icône)
// =============================================================================

function buildBigPencil() {
  const svg = add($('#fx'), `<svg class="full" viewBox="0 0 1080 1920">
    <path id="strike" d="${STRIKE_PATH}" fill="none" stroke="#2A1F1A" stroke-width="26" stroke-linecap="round"/>
    <g id="bigPencil">${PENCIL}</g>
    <circle id="shock" class="tb" cx="${MARK.cx}" cy="${MARK.cy}" r="150" fill="none" stroke="#C4401C" stroke-width="10"/>
    <g id="iconSparks"></g>
  </svg>`)
  const strike = $('#strike', svg)
  const pencil = $('#bigPencil', svg)
  const L = strike.getTotalLength()
  const DRAW = 0.26
  set(strike, 0, { d1: 0 })
  tw(strike, T.strike, DRAW, { d1: [0, 1] }, ease.out2)
  tw(strike, T.shrink - 0.08, 0.2, { opacity: [1, 0] }) // en même temps que le mot barré

  const start = strike.getPointAtLength(0)
  const K1 = 10.5
  onFrame((t) => {
    let pose = null
    if (t >= T.strike - 0.2 && t < T.strike) {
      const q = ease.out3(prog(t, T.strike - 0.2, 0.2))
      pose = [lerp(start.x - 520, start.x, q), lerp(start.y + 240, start.y, q), -32, K1]
    } else if (t >= T.strike && t < T.strike + DRAW) {
      const q = ease.out2(prog(t, T.strike, DRAW))
      const p = strike.getPointAtLength(q * L)
      pose = [p.x, p.y, -32 + 6 * Math.sin(t * 40), K1]
    } else if (t >= T.strike + DRAW && t < T.strike + DRAW + 0.25) {
      const end = strike.getPointAtLength(L)
      const q = ease.in2(prog(t, T.strike + DRAW, 0.25))
      pose = [lerp(end.x, end.x + 700, q), lerp(end.y, end.y - 520, q), -32 - 20 * q, K1]
    } else if (t >= T.shrink - 0.05 && t < T.endcard + 0.12) {
      // Retour en vrille jusqu'à la place exacte du crayon de l'icône.
      const q = prog(t, T.shrink - 0.05, T.endcard - T.shrink + 0.05, ease.io3)
      const k = lerp(K1 * 0.9, MARK.size / 64, q)
      const angle = lerp(-45 - 360, -45, q)
      // Le centre du crayon finit au centre de l'icône ; on en déduit la pointe.
      const a = (angle * Math.PI) / 180
      const cx = lerp(1250, MARK.cx, q)
      const cy = lerp(260, MARK.cy, ease.out2(q))
      pose = [cx - 21.5 * k * Math.cos(a), cy - 21.5 * k * Math.sin(a), angle, k]
    }
    if (!pose) {
      pencil.setAttribute('visibility', 'hidden')
      return
    }
    pencil.setAttribute('visibility', 'visible')
    pencil.setAttribute('transform', pencilPose(...pose))
    pencil.setAttribute('opacity', t > T.endcard ? String(clamp(1 - (t - T.endcard) / 0.1)) : '1')
  })

  // Onde de choc et étincelles quand l'icône se pose.
  set('#shock', 0, { opacity: 0 })
  tw('#shock', T.endcard, 0.55, { scale: [0.8, 2.3], opacity: [0.9, 0] }, ease.out2)
  const sparks = $('#iconSparks', svg)
  const colors = ['#F2B632', '#E4572E', '#9B5DE5', '#13A89E', '#3D7DD8', '#F08A24', '#D6457A', '#4F9D69']
  colors.forEach((color, i) => {
    const a = (i / colors.length) * Math.PI * 2 + 0.3
    const r = 200 + (i % 2) * 60
    const g = add(sparks, `<g transform="translate(${(MARK.cx + Math.cos(a) * r).toFixed(1)} ${(MARK.cy + Math.sin(a) * r).toFixed(1)})"><g class="tb">${spark(22 + (i % 3) * 8, color)}</g></g>`).firstElementChild
    set(g, 0, { scale: 0 })
    tw(g, T.endcard + 0.02 + i * 0.02, 0.25, { scale: [0, 1], rot: [-90, 0] }, ease.back(2.2))
    tw(g, T.endcard + 0.35 + i * 0.02, 0.35, { scale: 0, rot: 90 }, ease.in2)
  })
}

// =============================================================================
//  D2 · LA SIGNATURE (13,1 → 15 s)
// =============================================================================

function buildD2() {
  const D2 = $('#D2')
  D2.innerHTML = `
    <div id="icon" class="abs" style="left:${MARK.cx - MARK.size / 2}px;top:${MARK.cy - MARK.size / 2}px;width:${MARK.size}px;height:${MARK.size}px;filter:drop-shadow(0 30px 40px rgb(196 64 28 / .35))">${APP_MARK}</div>
    <div id="logo1" class="abs display center-x logo-line" style="top:812px">plutôt que</div>
    <div id="logo2" class="abs display center-x logo-line" style="top:960px"><span id="scrollerWord" style="position:relative;display:inline-block">scroller</span></div>
    <div id="tagline" class="abs center-x tagline" style="top:1168px">Chaque envie de scroller<br>devient un moment créatif.</div>
    <div id="cta" class="abs"><div class="ring"></div><div class="ring"></div><div id="ctaPill"><span id="ctaSpark" style="display:block;width:48px;height:48px">${ICON.sparkles}</span><span class="display">J’ai envie de scroller</span></div></div>
    <div id="bubbles" class="layer"></div>`

  set(D2, 0, { opacity: 0 })
  set(D2, T.shrink - 0.01, { opacity: 1 })
  set('#icon', 0, { opacity: 0 })
  set('#icon', T.endcard, { opacity: 1 })
  tw('#icon', T.endcard, 0.1, { scale: [1, 1.12] }, ease.out2)
  tw('#icon', T.endcard + 0.1, 0.6, { scale: 1 }, ease.elastic(0.35))

  const l1 = splitChars($('#logo1'))
  const word = $('#scrollerWord')
  const l2 = splitChars(word)
  word.insertAdjacentHTML(
    'beforeend',
    `<svg viewBox="0 0 100 12" preserveAspectRatio="none" style="position:absolute;left:-4%;top:52%;width:108%;height:0.45em;transform:translateY(-50%);overflow:visible"><path id="logoStrike" d="M2 7 Q 14 1 26 6 T 50 6 T 74 6 T 98 4" fill="none" stroke="#C4401C" stroke-width="3.2" stroke-linecap="round"/></svg>`,
  )
  for (const group of [l1, l2]) stagger(group, 0, 0, 0, { opacity: 0 })
  stagger(l1, T.endcard + 0.08, 0.022, 0.4, { y: [80, 0], rot: [8, 0], opacity: [0, 1] }, ease.back(1.6))
  stagger(l2, T.endcard + 0.22, 0.022, 0.4, { y: [80, 0], rot: [8, 0], opacity: [0, 1] }, ease.back(1.6))
  set('#logoStrike', 0, { d1: 0 })
  tw('#logoStrike', T.logoStrike, 0.32, { d1: [0, 1] }, ease.out2)

  const tag = $('#tagline')
  const lines = tag.innerHTML.split('<br>')
  tag.innerHTML = lines.map((l) => `<div>${l}</div>`).join('')
  const words = $$('div', tag).flatMap((d) => splitWords(d))
  stagger(words, 0, 0, 0, { opacity: 0 })
  stagger(words, T.tagline, 0.035, 0.45, { y: [36, 0], opacity: [0, 1] }, ease.out3)

  set('#ctaPill', 0, { opacity: 0 })
  tw('#ctaPill', T.cta, 0.5, { scale: [0.4, 1], opacity: [0, 1] }, ease.back(2))
  $$('#cta .ring').forEach((ring, i) => {
    set(ring, 0, { opacity: 0 })
    tw(ring, T.cta + 0.4 + i * 0.47, 0.6, { sx: [1, 1.1], sy: [1, 1.55], opacity: [0.9, 0] }, ease.out2)
  })
  const ctaSpark = $('#ctaSpark')
  onFrame((t) => {
    if (t > T.cta) ctaSpark.style.transform = `rotate(${((t - T.cta) * 90).toFixed(1)}deg)`
  })

  // Les huit familles de passions flottent autour.
  const bubbles = [
    ['🎨', 160, 330],
    ['🎬', 920, 350],
    ['✍️', 105, 690],
    ['🎧', 975, 650],
    ['🤸', 110, 1250],
    ['🛠️', 970, 1270],
    ['🧩', 250, 1680],
    ['🌿', 830, 1660],
  ]
  const layer = $('#bubbles')
  bubbles.forEach(([emoji, x, y], i) => {
    const wrap = add(layer, `<div class="abs" style="left:${x - 70}px;top:${y - 70}px"><div class="float-bubble">${emoji}</div></div>`)
    const bubble = wrap.firstElementChild
    set(bubble, 0, { scale: 0 })
    tw(bubble, T.endcard + 0.12 + i * 0.05, 0.5, { scale: [0, 1], rot: [i % 2 ? 30 : -30, 0] }, ease.back(2.2))
    onFrame((t) => {
      if (t < T.endcard) return
      const d = t - T.endcard
      wrap.style.transform = `translate(${(6 * Math.sin(d * 1.7 + i)).toFixed(2)}px, ${(12 * Math.sin(d * 2.3 + i * 1.3)).toFixed(2)}px) rotate(${(4 * Math.sin(d * 1.9 + i)).toFixed(2)}deg)`
    })
  })
}

// =============================================================================
//  DÉMARRAGE
// =============================================================================

async function fontsReady() {
  await Promise.all([
    document.fonts.load('800 100px "Fraunces Variable"'),
    document.fonts.load('italic 800 100px "Fraunces Variable"'),
    document.fonts.load('600 40px "Figtree Variable"'),
    document.fonts.load('700 40px "Figtree Variable"'),
  ])
  await document.fonts.ready
}

/** Réduit la taille d'un texte sur une ligne s'il déborde de sa boîte. */
function fitWidth(el, max) {
  let size = parseFloat(getComputedStyle(el).fontSize)
  while (el.scrollWidth > max && size > 10) {
    size -= 1
    el.style.fontSize = `${size}px`
  }
}

async function start() {
  await fontsReady()
  buildA()
  buildConfetti()
  buildB()
  buildD1()
  buildBigPencil()
  buildD2()
  for (const title of $$('.card .title')) fitWidth(title, title.parentElement.clientWidth)
  finalize()
  seek(0)
}

const ready = start()
window.__promo = { ready, seek, duration: DURATION, fps: FPS }

// Aperçu interactif quand la page est ouverte directement dans un navigateur.
if (!new URLSearchParams(location.search).has('render')) {
  document.body.classList.add('preview')
  ready.then(() => {
    const scrub = $('#scrub')
    const clock = $('#clock')
    const play = $('#play')
    const audio = new Audio('build/audio.wav')
    let playing = false
    let t0 = 0
    let from = 0
    const show = (t) => {
      seek(t)
      scrub.value = String(t)
      clock.textContent = `${t.toFixed(2).replace('.', ',')} s`
    }
    const loop = (now) => {
      if (!playing) return
      const t = from + (now - t0) / 1000
      if (t >= DURATION) {
        playing = false
        play.textContent = 'Lecture'
        show(DURATION)
        return
      }
      show(t)
      requestAnimationFrame(loop)
    }
    play.addEventListener('click', () => {
      playing = !playing
      play.textContent = playing ? 'Pause' : 'Lecture'
      if (playing) {
        from = Number(scrub.value) >= DURATION ? 0 : Number(scrub.value)
        t0 = performance.now()
        audio.currentTime = from
        audio.play().catch(() => {})
        requestAnimationFrame(loop)
      } else {
        audio.pause()
      }
    })
    scrub.addEventListener('input', () => {
      playing = false
      audio.pause()
      play.textContent = 'Lecture'
      show(Number(scrub.value))
    })
  })
}
