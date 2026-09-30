/**
 * ============================================================================
 *  Pub Scroll-up — 30 s, format vertical 1080 × 1920, sans voix off
 * ============================================================================
 *
 *  0 → 4 s    La nuit, un fil sans fin. « 23h47. Encore un scroll ? » Le fil
 *             ralentit et se fige : « STOP. » Le sticker devient le bouton.
 *  4 → 8 s    L'accueil de l'app : « Ton pouce te démange ? » Un doigt appuie
 *             sur « J'ai envie de scroller ». Le bouton envahit l'écran.
 *  8 → 10 s   « On a reçu ton signal de détresse pré-scroll. On s'occupe de toi. »
 *  10 → 14 s  Humeur, temps, passion : trois taps.
 *  14 → 18 s  L'activité (« Dessine un objet de ton bureau. ») se dessine,
 *             puis l'écran recule sur les quatre passions.
 *  18 → 22 s  « Activité enregistrée. » Cinq pièces d'or tombent, une par minute.
 *  22 → 26 s  La galerie, dans les quatre thèmes de l'app.
 *  26 → 30 s  La signature : logo, promesse, @scrollup_bot sur Telegram.
 *
 *  Tout est une fonction du temps (voir ../engine.js) : window.__promo.seek(t)
 *  affiche l'image de l'instant t. Les repères viennent de cues.js, partagés
 *  avec la bande-son (audio.mjs).
 */

import { ease, finalize, onFrame, prog, rng, seek, set, tw } from '../engine.js'
import { BEAT, DURATION, FPS, T } from './cues.js'
import { ICONS } from './icons.js'

// --------------------------------------------------------------- utilitaires

const $ = (selector, root = document) => root.querySelector(selector)
const NB = ' ' // espace fine insécable, avant « ? », « ! » et « : »
const INK = '#151515'

function add(parent, markup) {
  parent.insertAdjacentHTML('beforeend', markup)
  return parent.lastElementChild
}

/** Découpe le texte d'un élément en mots animables. */
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

/** Découpe le texte d'un élément en lettres (pour l'écriture à la main). */
function splitChars(el) {
  const text = el.textContent
  el.textContent = ''
  return [...text].map((c) => {
    const s = document.createElement('span')
    s.textContent = c
    el.append(s)
    return s
  })
}

const icon = (name, size, stroke = 2.4) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" stroke-width="${stroke}">${ICONS[name]}</svg>`

/** Visible seulement entre t0 et t1. */
function between(el, t0, t1) {
  set(el, 0, { opacity: 0 })
  set(el, t0, { opacity: 1 })
  if (t1 !== undefined) set(el, t1, { opacity: 0 })
}

/** Sticker qui se colle : il arrive gros, dépasse, et se pose. */
function slap(el, t, { from = 1.7, dur = 0.18, rot } = {}) {
  tw(el, t, 0.001, { opacity: [0, 1] })
  tw(el, t, dur, { scale: [from, 1] }, ease.back(1.3))
  if (rot) tw(el, t, dur + 0.1, { rot }, ease.out3)
}

/** Apparition « pop » : de rien à sa taille, avec un rebond. */
function popIn(el, t, { dur = 0.4, rot, from = 0, s = 2.2 } = {}) {
  tw(el, t, 0.001, { opacity: [0, 1] })
  tw(el, t, dur, { scale: [from, 1] }, ease.back(s))
  if (rot) tw(el, t, dur, { rot }, ease.out3)
}

/** Les mots arrivent un par un, en sautant. */
function wordsIn(el, t, { step = 0.045, dur = 0.4, dy = 60 } = {}) {
  const words = splitWords(el)
  words.forEach((w, i) => {
    tw(w, t + i * step, 0.001, { opacity: [0, 1] })
    tw(w, t + i * step, dur, { y: [dy, 0], rot: [5, 0] }, ease.back(1.7))
  })
  return words
}

/** Appui « dans l'ombre » : l'élément glisse sur son ombre, puis revient. */
function press(el, t, { d = 13, sh = 16, hold = 0.25 } = {}) {
  tw(el, t, 0.06, { x: [0, d], y: [0, d], '--sh': [sh, 2] }, ease.out2)
  tw(el, t + hold, 0.35, { x: [d, 0], y: [d, 0], '--sh': [2, sh] }, ease.back(2.4))
}

/** Onde de toucher : deux cercles cernés d'encre qui s'élargissent. */
function ripple(parent, x, y, t, { size = 240 } = {}) {
  for (let k = 0; k < 2; k++) {
    const r = add(
      parent,
      `<div class="abs pill" style="left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;border:8px solid var(--outline);box-sizing:border-box;z-index:30"></div>`,
    )
    set(r, 0, { opacity: 0 })
    tw(r, t + k * 0.09, 0.001, { opacity: [0, 1] })
    tw(r, t + k * 0.09, 0.5, { scale: [0.25, 1.5] }, ease.out3)
    tw(r, t + k * 0.09 + 0.12, 0.35, { opacity: [1, 0] }, ease.linear)
  }
}

// --------------------------------------------------------------- les dessins

const coinSVG = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:block;overflow:visible"><circle cx="12" cy="12" r="10" fill="var(--warm)" stroke="var(--on-color)" stroke-width="2"/><path d="M8.6 10a4 4 0 0 1 3.2-2.6" fill="none" stroke="var(--on-color)" stroke-width="1.8" stroke-linecap="round"/></svg>`

const brandSVG = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 64 64" style="display:block;overflow:visible"><rect x="3" y="3" width="58" height="58" rx="16" fill="var(--accent)" stroke="var(--outline)" stroke-width="5"/><rect x="22" y="13" width="20" height="38" rx="5" fill="var(--surface-200)" stroke="var(--on-color)" stroke-width="4"/><path d="M13 51 51 13" stroke="var(--on-color)" stroke-width="5" stroke-linecap="round"/></svg>`

/** Le petit téléphone du bouton, dont le fil défile sans fin. */
function scrollPhone(parent, width, style = '') {
  const lines = Array.from(
    { length: 16 },
    (_, i) => `<rect x="6" y="${7 + i * 6}" width="${i % 2 ? 9 : 14}" height="3" rx="1.5" fill="${INK}" opacity="${i % 3 === 0 ? 0.95 : 0.55}"/>`,
  ).join('')
  const el = add(
    parent,
    `<svg width="${width}" height="${(width * 40) / 26}" viewBox="0 0 26 40" style="display:block;${style}"><defs><clipPath id="sp${parent.id || Math.round(width)}"><rect x="4" y="5" width="18" height="30" rx="2"/></clipPath></defs><rect x="1.5" y="1.5" width="23" height="37" rx="6" fill="none" stroke="${INK}" stroke-width="2"/><g clip-path="url(#sp${parent.id || Math.round(width)})"><g class="feed">${lines}</g></g></svg>`,
  )
  const feed = el.querySelector('.feed')
  onFrame((t) => feed.setAttribute('transform', `translate(0 ${-((t * 30) % 36).toFixed(2)})`))
  return el
}

/** La main (index tendu), en sticker : le bout du doigt est à (88, 10). */
const HAND_TIP = [88, 10]
function handSVG(sleeve = 'var(--lilac)') {
  const S = `stroke="${INK}" stroke-width="9" stroke-linejoin="round"`
  const skin = '#fffdf7'
  return `<svg viewBox="-10 -10 280 440" width="280" height="440" style="display:block;overflow:visible">
    <rect x="112" y="118" width="50" height="104" rx="25" fill="${skin}" ${S}/>
    <rect x="158" y="136" width="46" height="94" rx="23" fill="${skin}" ${S}/>
    <rect x="200" y="160" width="40" height="80" rx="20" fill="${skin}" ${S}/>
    <rect x="46" y="0" width="64" height="240" rx="32" fill="${skin}" ${S}/>
    <rect x="52" y="182" width="190" height="162" rx="64" fill="${skin}" ${S}/>
    <rect x="8" y="192" width="62" height="128" rx="31" fill="${skin}" ${S} transform="rotate(-32 39 256)"/>
    <rect x="72" y="318" width="178" height="104" rx="24" fill="${sleeve}" ${S}/>
    <path d="M100 350v50M130 350v50M160 350v50M190 350v50M220 350v50" stroke="${INK}" stroke-width="6" stroke-linecap="round" opacity="0.25"/>
    <rect x="60" y="14" width="36" height="42" rx="15" fill="#ffd9cf" stroke="${INK}" stroke-width="6"/>
  </svg>`
}

/** Place une main dont le bout du doigt est en (x, y) quand x = y = 0. */
function makeHand(parent, x, y, { scale = 1.15, rot = -14, sleeve } = {}) {
  const el = add(
    parent,
    `<div class="abs" style="left:${x - HAND_TIP[0]}px;top:${y - HAND_TIP[1]}px;width:280px;height:440px;transform-origin:${HAND_TIP[0]}px ${HAND_TIP[1]}px;z-index:40;filter:drop-shadow(14px 14px 0 rgba(21,21,21,0.9))">${handSVG(sleeve)}</div>`,
  )
  set(el, 0, { scale, rot })
  return el
}

/** Le crayon qui dessine (pointe en (36, 306)). */
const PENCIL_TIP = [36, 306]
const pencilSVG = `<svg viewBox="-6 -6 72 312" width="72" height="312" style="display:block;overflow:visible">
  <rect x="6" y="0" width="48" height="40" rx="12" fill="var(--accent)" stroke="${INK}" stroke-width="6"/>
  <rect x="6" y="34" width="48" height="20" fill="#e9e1cf" stroke="${INK}" stroke-width="6"/>
  <rect x="6" y="54" width="48" height="182" fill="var(--warm)" stroke="${INK}" stroke-width="6"/>
  <path d="M22 60v170M38 60v170" stroke="${INK}" stroke-width="4" opacity="0.2"/>
  <path d="M6 236 L54 236 L30 300 Z" fill="#f5e4b3" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M21 276 L39 276 L30 300 Z" fill="${INK}"/>
</svg>`

/** Le dessin de la tasse (dans l'ordre du tracé). */
const MUG = [
  { d: 'M150 150 L150 380 Q150 432 202 432 L358 432 Q410 432 410 380 L410 150', w: 11 },
  { d: 'M150 150 C150 116 410 116 410 150 C410 184 150 184 150 150 Z', w: 11 },
  { d: 'M410 205 C505 200 505 345 410 340', w: 11 },
  { d: 'M410 238 C458 238 458 306 410 304', w: 9 },
  { d: 'M150 418 Q108 424 88 446 Q280 500 472 446 Q452 424 410 418', w: 10 },
  { d: 'M252 268 C252 244 282 242 290 262 C298 242 328 244 328 268 C328 296 290 312 290 322 C290 312 252 296 252 268 Z', w: 8 },
  { d: 'M348 214 L398 176', w: 7 },
  { d: 'M348 262 L398 224', w: 7 },
  { d: 'M348 310 L398 272', w: 7 },
  { d: 'M348 358 L398 320', w: 7 },
  { d: 'M230 104 C205 76 252 60 228 26', w: 8 },
  { d: 'M282 96 C257 68 304 52 280 18', w: 8 },
  { d: 'M334 104 C309 76 356 60 332 26', w: 8 },
]
const mugSVG = (width, cls = '') =>
  `<svg class="${cls}" viewBox="60 0 480 500" width="${width}" height="${(width * 500) / 480}" style="display:block;overflow:visible">${MUG.map(
    (p) => `<path d="${p.d}" fill="none" stroke="${INK}" stroke-width="${p.w}" stroke-linecap="round" stroke-linejoin="round"/>`,
  ).join('')}</svg>`

/** Étincelle à quatre branches, cernée d'encre. */
const sparkleSVG = (size, color) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:block;overflow:visible"><path d="M12 2 C13 8 16 11 22 12 C16 13 13 16 12 22 C11 16 8 13 2 12 C8 11 11 8 12 2 Z" fill="${color}" stroke="var(--outline)" stroke-width="1.6" stroke-linejoin="round"/></svg>`

/** Les petits stickers du décor, à cheval sur les bords (comme dans l'app). */
const SHAPES = {
  dot: (c) => `<svg viewBox="0 0 20 20" width="100%" height="100%" style="overflow:visible"><circle cx="10" cy="10" r="8" fill="${c}" stroke="var(--outline)" stroke-width="2"/></svg>`,
  star: (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%" style="overflow:visible"><path d="M12 2 C13 8 16 11 22 12 C16 13 13 16 12 22 C11 16 8 13 2 12 C8 11 11 8 12 2 Z" fill="${c}" stroke="var(--outline)" stroke-width="2" stroke-linejoin="round"/></svg>`,
  squiggle: () => `<svg viewBox="0 0 36 20" width="100%" height="100%" style="overflow:visible"><path d="M3 12 C 8 2, 12 2, 14 10 S 22 18, 25 10 S 31 2, 33 8" fill="none" stroke="var(--outline)" stroke-width="3" stroke-linecap="round"/></svg>`,
  plus: () => `<svg viewBox="0 0 20 20" width="100%" height="100%" style="overflow:visible"><path d="M10 3v14M3 10h14" fill="none" stroke="var(--outline)" stroke-width="3" stroke-linecap="round"/></svg>`,
}
function backdrop(parent, seed, colors = ['var(--accent)', 'var(--sky)', 'var(--warm)', 'var(--good)', 'var(--lilac)']) {
  const r = rng(seed)
  const kinds = ['dot', 'star', 'squiggle', 'dot', 'plus', 'star']
  for (let i = 0; i < 10; i++) {
    const kind = kinds[i % kinds.length]
    const size = 34 + Math.round(r() * 22)
    const w = kind === 'squiggle' ? size * 1.8 : kind === 'star' ? size * 1.3 : size
    const left = i % 2 === 0 ? -w * 0.35 + r() * 26 : 1080 - w * 0.65 - r() * 26
    const top = 80 + (i / 10) * 1780 + r() * 90
    const el = add(parent, `<div class="abs" style="left:${left}px;top:${top}px;width:${w}px;height:${size}px">${SHAPES[kind](colors[i % colors.length])}</div>`)
    const speed = 14 + r() * 16
    const phase = r() * 6
    onFrame((t) => {
      el.style.transform = `translateY(${(-t * speed).toFixed(1)}px) rotate(${(9 * Math.sin(t * 1.3 + phase)).toFixed(2)}deg)`
    })
  }
}

// ------------------------------------------------------ caméra et secousses

const SHAKES = [
  [T.stop, 22],
  [T.drop, 14],
  [T.press, 7],
  [T.signal2, 8],
  [T.passionTap, 5],
  [T.stamp, 18],
  [T.burst, 10],
  ...T.themes.map((t) => [t, 9]),
  [T.wordmark, 10],
  [T.ctaPress, 7],
  [T.final, 12],
]
function shake(t) {
  let x = 0
  let y = 0
  for (const [t0, amp] of SHAKES) {
    const d = t - t0
    if (d < 0 || d > 0.45) continue
    const a = amp * Math.exp(-d / 0.08)
    x += a * Math.sin(d * 97 + t0 * 7)
    y += a * Math.cos(d * 131 + t0 * 3)
  }
  return [x, y]
}

// ==================================================================== scènes

/* ------------------------------------------------ 1 · la nuit (0 → 4 s) --- */

const DULL = ['#2c2f40', '#353849', '#2a3244', '#3a3447', '#2e393e', '#37394d', '#30323f']
const DULL_SHAPE = ['#4b4f67', '#575168', '#465a68', '#5b566f', '#4d5f60', '#555a73', '#50526a']
const POST_SHAPES = [
  (c) => `<circle cx="50" cy="50" r="38" fill="${c}" stroke="#06070a" stroke-width="3.5"/><circle cx="36" cy="42" r="6" fill="#06070a" opacity="0.35"/>`,
  (c) => `<rect x="16" y="16" width="68" height="68" rx="12" fill="${c}" stroke="#06070a" stroke-width="3.5" transform="rotate(12 50 50)"/>`,
  (c) => `<path d="M50 10 L90 84 L10 84 Z" fill="${c}" stroke="#06070a" stroke-width="3.5" stroke-linejoin="round"/>`,
  (c) => `<path d="M50 6 C54 36 64 46 94 50 C64 54 54 64 50 94 C46 64 36 54 6 50 C36 46 46 36 50 6 Z" fill="${c}" stroke="#06070a" stroke-width="3.5" stroke-linejoin="round"/>`,
  (c) => `<circle cx="50" cy="56" r="32" fill="${c}" stroke="#06070a" stroke-width="3.5"/><path d="M24 36 L30 8 L46 28 Z M76 36 L70 8 L54 28 Z" fill="${c}" stroke="#06070a" stroke-width="3.5" stroke-linejoin="round"/>`,
  (c) => `<path d="M8 60 C20 30 34 30 44 52 S 70 76 92 40" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"/><path d="M8 60 C20 30 34 30 44 52 S 70 76 92 40" fill="none" stroke="#06070a" stroke-width="3" stroke-linecap="round" opacity="0.6"/>`,
]
const COUNTS = ['12,4 k', '3 k', '98 k', '1,2 M', '640', '27 k', '5,1 k']

function buildS1() {
  const S = $('#S1')
  between(S, 0, T.drop)

  const hook = add(S, `<div class="abs display" style="left:0;right:0;top:120px;text-align:center;font-size:190px;color:#ece8f4">23h47.</div>`)
  slap(hook, T.hook, { from: 1.35, dur: 0.22 })
  const hook2 = add(S, `<div class="abs display" style="left:0;right:0;top:330px;text-align:center;font-size:84px;color:#a19db5">Encore un scroll${NB}?</div>`)
  wordsIn(hook2, T.hook2, { step: 0.09 })

  // Le téléphone et son fil.
  const phone = add(S, `<div class="abs phone"><div class="screen"><div class="strip abs" style="left:0;top:0;width:100%;filter:url(#mblur)"></div></div></div>`)
  const strip = $('.strip', phone)
  const r = rng(11)
  for (let i = 0; i < 16; i++) {
    const bg = DULL[i % DULL.length]
    const shape = POST_SHAPES[(i * 5) % POST_SHAPES.length](DULL_SHAPE[(i * 3) % DULL_SHAPE.length])
    const caption = [0.62 + r() * 0.25, 0.35 + r() * 0.25]
    add(
      strip,
      `<div class="post" style="top:${i * 1300}px;background:${bg}">
        <svg class="abs" viewBox="0 0 100 100" style="left:70px;top:250px;width:420px;height:420px;overflow:visible">${shape}</svg>
        <div class="abs" style="right:30px;top:600px;display:flex;flex-direction:column;align-items:center;gap:40px;color:#b9b6c8;font:700 30px var(--font-sans)">
          <div class="center" style="flex-direction:column;gap:8px">${icon('heart', 70, 2)}${COUNTS[i % COUNTS.length]}</div>
          <div class="center" style="flex-direction:column;gap:8px">${icon('message-circle', 66, 2)}${COUNTS[(i + 3) % COUNTS.length]}</div>
          <div class="center" style="flex-direction:column;gap:8px">${icon('bookmark', 64, 2)}</div>
          <div class="center" style="flex-direction:column;gap:8px">${icon('send', 64, 2)}</div>
        </div>
        <div class="abs" style="left:40px;bottom:120px;width:440px">
          <div style="display:flex;align-items:center;gap:18px;margin-bottom:26px"><div class="pill" style="width:64px;height:64px;background:#5d6078;border:4px solid #06070a"></div><div class="pill" style="width:${160 + r() * 90}px;height:26px;background:#64677e"></div></div>
          <div class="pill" style="width:${caption[0] * 100}%;height:22px;background:#4f5268;margin-bottom:16px"></div>
          <div class="pill" style="width:${caption[1] * 100}%;height:22px;background:#4f5268"></div>
        </div>
        <div class="abs" style="left:0;right:0;bottom:0;height:8px;background:#23252f"><div style="height:100%;width:${20 + r() * 60}%;background:#6f7390"></div></div>
      </div>`,
    )
  }
  // Barre d'état par-dessus le fil.
  add(
    $('.screen', phone),
    `<div class="abs" style="left:0;right:0;top:0;height:110px;display:flex;align-items:center;justify-content:space-between;padding:0 64px;color:#dcd9e8;font:700 38px var(--font-sans);background:linear-gradient(#0e0f15cc,#0e0f1500)"><span>23:47</span><span style="display:flex;gap:10px;align-items:center"><span style="width:58px;height:28px;border:4px solid #dcd9e8;border-radius:9px;box-sizing:border-box;padding:3px"><span style="display:block;width:24%;height:100%;background:#ff6a4d;border-radius:3px"></span></span></span></div>`,
  )

  /** Position du fil, en nombre de posts. */
  const V = 13 // posts par seconde, au plus fort du défilement
  const RAMP = 0.15
  const feedPos = (t) => {
    let p = 0
    for (const s of T.swipes) p += 0.14 * prog(t, s, 0.1, ease.out2) + 0.86 * prog(t, s + 0.1, 0.26, ease.out3)
    if (t > T.frenzy) {
      const tt = Math.min(t, T.slow) - T.frenzy
      p += tt < RAMP ? (V * tt * tt) / (2 * RAMP) : V * (RAMP / 2 + (tt - RAMP))
    }
    if (t > T.slow) {
      const L = T.stop - T.slow
      const q = Math.min(1, (t - T.slow) / L)
      p += (V * L * (1 - (1 - q) ** 2.6)) / 2.6
    }
    return p
  }
  const blurNode = $('#mblurNode')
  onFrame((t) => {
    const p = feedPos(t)
    strip.style.transform = `translateY(${(-p * 1300).toFixed(1)}px)`
    const v = ((feedPos(t + 0.004) - feedPos(t - 0.004)) / 0.008) * 1300
    blurNode.setAttribute('stdDeviation', `0 ${Math.min(70, Math.abs(v) / 220).toFixed(2)}`)
  })

  // Le doigt : un coup par post, puis il s'affole, puis se fige avec le fil.
  const hand = makeHand(S, 610, 1400, { sleeve: '#3b3f55' })
  const phase = (t) => {
    if (t < T.frenzy) return 0
    if (t < T.slow) return 7 * (t - T.frenzy)
    const L = T.stop - T.slow
    const q = Math.min(1, (t - T.slow) / L)
    return 7 * (T.slow - T.frenzy) + (7 * L * (1 - (1 - q) ** 2.6)) / 2.6
  }
  onFrame((t) => {
    let y = 0
    let x = 0
    for (const s of T.swipes) {
      const up = prog(t, s - 0.07, 0.17, ease.io2) - prog(t, s + 0.12, 0.26, ease.io2)
      y -= 430 * up
      x += 30 * Math.sin(Math.PI * prog(t, s + 0.12, 0.26))
    }
    if (t > T.frenzy) {
      const ph = phase(t)
      y -= 330 * (0.5 - 0.5 * Math.cos(Math.PI * 2 * ph))
    }
    hand.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(-14deg) scale(1.15)`
  })

  // STOP : tout se fige, l'écran s'assombrit.
  const dim = add(S, `<div class="abs" style="inset:0;background:#06070a"></div>`)
  set(dim, 0, { opacity: 0 })
  tw(dim, T.stop, 0.05, { opacity: [0, 0.45] })

  // La couleur envahit l'écran, depuis le sticker.
  const flood = add(S, `<div class="abs" style="inset:0;background:#fff3d1;clip-path:circle(calc(var(--r) * 1px) at 540px 1000px)"></div>`)
  set(flood, 0, { '--r': 0 })
  tw(flood, T.morph, 0.45, { '--r': [0, 1450] }, ease.in3)

  // Le sticker STOP, qui devient le gros bouton de l'accueil.
  const stop = add(
    S,
    `<div class="abs sk bg-accent center" style="--sh:16;left:140px;top:835px;width:800px;height:330px;border-radius:40px;overflow:hidden"><span class="display on-color" style="font-size:230px;line-height:1">STOP.</span></div>`,
  )
  set(stop, 0, { opacity: 0, rot: -6, left: 140, top: 835, w: 800, h: 330, radius: 40 })
  tw(stop, T.stop, 0.001, { opacity: [0, 1] })
  tw(stop, T.stop, 0.16, { scale: [2.6, 1] }, ease.out3)
  tw(stop, T.stop + 0.16, 0.25, { rot: [-6, -8] }, ease.back(3))
  tw(stop, T.morph, 0.5, { left: [140, 72], top: [835, 760], w: [800, 936], h: [330, 780], rot: [-8, -1.5], radius: [40, 76] }, ease.io3)
  const stopText = $('span', stop)
  tw(stopText, T.morph, 0.18, { opacity: [1, 0], scale: [1, 0.6] }, ease.in2)
}

/* ------------------------------------------------ 2 · le bouton (4 → 8 s) -- */

function buildS2() {
  const S = $('#S2')
  S.classList.add('scene')
  between(S, T.drop, T.signal)
  backdrop(S, 3)

  // En-tête de l'app : logo, thème, pièces.
  const header = add(S, `<div class="abs" style="left:72px;right:72px;top:110px;height:120px;display:flex;align-items:center;justify-content:space-between"></div>`)
  const word = add(header, `<div class="sk bg-accent display on-color center" style="--sh:8;height:100px;padding:0 34px;border-radius:var(--r-sm);font-size:48px;transform:rotate(-3deg)">scroll-up</div>`)
  const right = add(header, `<div style="display:flex;gap:26px;align-items:center"></div>`)
  const themeBtn = add(right, `<div class="sk bg-surface pill center" style="--sh:8;width:118px;height:118px">${icon('palette', 54, 2.6)}</div>`)
  const coins = add(right, `<div class="sk bg-warm pill center on-color" style="--sh:8;height:118px;padding:0 38px 0 22px;gap:14px">${coinSVG(66)}<span class="display" style="font-size:48px">123</span></div>`)
  ;[word, themeBtn, coins].forEach((el, i) => popIn(el, T.drop + 0.12 + i * 0.08, { dur: 0.35 }))

  const h1 = add(S, `<div class="abs display" style="left:72px;width:940px;top:300px;font-size:126px">Ton pouce te démange${NB}?</div>`)
  wordsIn(h1, T.headline, { step: 0.07 })
  const p = add(S, `<div class="abs sans" style="left:72px;width:900px;top:572px;font-size:46px;color:var(--ink-soft);font-weight:500">Appuie ici, on s’occupe du reste.</div>`)
  tw(p, T.headline + 0.35, 0.3, { opacity: [0, 1], y: [30, 0] }, ease.out3)

  // Le gros bouton (même dessin que HomeCta, ×2,7).
  const btn = add(
    S,
    `<div class="abs sk bg-accent" style="--sh:16;left:72px;top:760px;width:936px;height:780px;border-radius:76px;padding:62px;display:flex;flex-direction:column;justify-content:space-between;color:var(--on-color)">
      <div class="top" style="display:flex;align-items:flex-start;justify-content:space-between">
        <div class="glyph center" style="width:151px;height:151px;border:7px solid var(--on-color);border-radius:var(--r-md);background:var(--paper);box-sizing:border-box;transform:rotate(-6deg)"></div>
        <div class="center pill" style="width:151px;height:151px;flex:none;border:7px solid var(--on-color);background:var(--paper);box-sizing:border-box;margin-top:170px">${icon('arrow-right', 72, 2.8)}</div>
      </div>
      <div class="bottom display" style="font-size:136px">J’ai envie<br/>de scroller</div>
    </div>`,
  )
  scrollPhone($('.glyph', btn), 70)
  set(btn, 0, { rot: -1.5 })
  tw(btn, T.drop, 0.25, { scale: [1.06, 1] }, ease.out3)

  // Les stickers des passions, collés autour.
  const STICKERS = [
    { icon: 'pencil', bg: 'bg-sky', left: 792, top: 706, size: 151, rot: 12 },
    { icon: 'feather', bg: 'bg-lilac', left: 374, top: 717, size: 119, rot: 8 },
    { icon: 'headphones', bg: 'bg-good', left: 910, top: 1019, size: 130, rot: -10 },
  ]
  STICKERS.forEach((s, i) => {
    const el = add(S, `<div class="abs pill center ${s.bg}" style="left:${s.left}px;top:${s.top}px;width:${s.size}px;height:${s.size}px;border:7px solid var(--outline);box-sizing:border-box">${icon(s.icon, s.size * 0.45, 2.4)}</div>`)
    set(el, 0, { opacity: 0 })
    popIn(el, T.stickers[i], { rot: [0, s.rot], s: 3 })
    onFrame((t) => {
      if (t < T.stickers[i] + 0.4 || t > T.zoom - 0.15) return
      el.style.transform = `translateY(${(9 * Math.sin((t - T.stickers[i]) * 2.2 + i)).toFixed(1)}px) rotate(${s.rot}deg)`
    })
    // Ils s'envolent quand le bouton grossit.
    const dx = (s.left + s.size / 2 - 540) * 1.4
    const dy = (s.top + s.size / 2 - 1150) * 1.4
    tw(el, T.zoom - 0.15, 0.35, { x: [0, dx], y: [0, dy], scale: [1, 0.2], opacity: [1, 0] }, ease.in3)
  })

  // Le doigt arrive, appuie, repart.
  const hand = makeHand(S, 610, 1400)
  set(hand, 0, { opacity: 0 })
  tw(hand, T.fingerIn, 0.001, { opacity: [0, 1] })
  tw(hand, T.fingerIn, 0.55, { x: [520, 0], y: [700, 0] }, ease.out3)
  tw(hand, T.press - 0.08, 0.08, { x: [0, 12], y: [0, 12], scale: [1.15, 1.08] }, ease.in2)
  tw(hand, T.release, 0.2, { x: [12, 0], y: [12, -20], scale: [1.08, 1.15] }, ease.out3)
  tw(hand, T.release + 0.2, 0.35, { x: [0, 520], y: [-20, 800] }, ease.in3)
  press(btn, T.press, { hold: T.release - T.press })
  ripple(S, 610, 1400, T.press)

  // Le bouton se ramasse, puis envahit l'écran.
  tw(btn, T.release + 0.2, 0.25, { scale: [1, 0.94] }, ease.in2)
  tw(btn, T.zoom, 0.5, { scale: [0.94, 3.6], rot: [-1.5, 0] }, ease.in3)
  tw($('.top', btn), T.zoom, 0.12, { opacity: [1, 0] })
  tw($('.bottom', btn), T.zoom, 0.12, { opacity: [1, 0] })
  tw([h1, p, header], T.zoom - 0.05, 0.3, { y: [0, -120], opacity: [1, 0] }, ease.in3)
}

/* ------------------------------------------------ 3 · le signal (8 → 10 s) - */

const BUOY = [540, 760]

function buildS3() {
  const S = $('#S3')
  S.classList.add('scene')
  between(S, T.signal - 0.01, T.mood)
  backdrop(S, 5)
  const group = add(S, `<div class="abs" style="inset:0"></div>`)

  // Les ondes du signal.
  for (let k = 0; k < 3; k++) {
    const ring = add(group, `<div class="abs pill" style="left:${BUOY[0] - 216}px;top:${BUOY[1] - 216}px;width:432px;height:432px;border:8px solid var(--outline);box-sizing:border-box"></div>`)
    onFrame((t) => {
      const start = T.signal + 0.2 + k * 0.37
      if (t < start) {
        ring.style.visibility = 'hidden'
        return
      }
      const p = ((t - start) % 1.1) / 1.1
      ring.style.visibility = ''
      ring.style.transform = `scale(${(0.35 + 0.85 * p).toFixed(3)})`
      ring.style.opacity = (0.85 * (1 - p)).toFixed(3)
    })
  }
  // Des éclats venus de partout convergent vers la bouée.
  const COLORS = ['var(--warm)', 'var(--sky)', 'var(--good)', 'var(--lilac)']
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const size = i % 3 === 0 ? 50 : 34
    const sp = add(group, `<div class="abs" style="left:${BUOY[0] - size / 2}px;top:${BUOY[1] - size / 2}px">${sparkleSVG(size, COLORS[i % 4])}</div>`)
    onFrame((t) => {
      const start = T.signal + 0.1 + i * 0.1
      if (t < start) {
        sp.style.visibility = 'hidden'
        return
      }
      const p = ((t - start) % 1.2) / 1.2
      const d = 420 * (1 - ease.in2(p))
      sp.style.visibility = ''
      sp.style.opacity = Math.sin(Math.PI * p).toFixed(3)
      sp.style.transform = `translate(${(Math.cos(a) * d).toFixed(1)}px, ${(Math.sin(a) * d).toFixed(1)}px) scale(${(1 - 0.6 * p).toFixed(3)}) rotate(${(p * 180).toFixed(1)}deg)`
    })
  }

  const buoy = add(group, `<div class="abs sk bg-accent pill center on-color" style="--sh:16;left:${BUOY[0] - 130}px;top:${BUOY[1] - 130}px;width:260px;height:260px"><div class="lb">${icon('life-buoy', 126, 2.2)}</div></div>`)
  set(buoy, 0, { opacity: 0 })
  set(buoy, T.signal + 0.28, { opacity: 1 })
  tw(buoy, T.signal + 0.28, 0.4, { scale: [0.85, 1], rot: [-30, 0] }, ease.back(2.5))
  const lb = $('.lb', buoy)
  onFrame((t) => (lb.style.transform = `rotate(${(t * 50).toFixed(1)}deg)`))

  const text = add(group, `<div class="abs display balance" style="left:72px;width:936px;top:1070px;text-align:center;font-size:96px">On a reçu ton signal de détresse pré-scroll.</div>`)
  wordsIn(text, T.signal + 0.3, { step: 0.06 })
  const care = add(
    group,
    `<div class="abs" style="left:0;right:0;top:1440px;display:flex;justify-content:center"><div class="sk bg-warm display on-color" style="--sh:11;padding:20px 50px 28px;border-radius:var(--r-md);font-size:92px;transform:rotate(-2deg)">On s’occupe de toi.</div></div>`,
  )
  slap(care.firstElementChild, T.signal2, { from: 1.8 })
  set(care.firstElementChild, 0, { rot: -2 })

  // On pousse l'écran vers la gauche.
  tw(group, T.signalOut, 0.25, { x: [0, -1080] }, ease.in3)
}

/* ------------------------------------------------ 4 · les choix (10 → 14 s) */

function buildS4() {
  const S = $('#S4')
  S.classList.add('scene')
  between(S, T.signalOut, T.activity)
  backdrop(S, 9)
  const wrap = add(S, `<div class="abs" style="inset:0"></div>`)
  tw(wrap, T.signalOut, 0.25, { x: [1080, 0] }, ease.out3)

  // Progression : 1/3, 2/3, 3/3.
  const step = add(wrap, `<div class="abs" style="left:72px;right:72px;top:120px;height:100px;display:flex;align-items:center;gap:30px"></div>`)
  const count = add(step, `<div class="display on-color center" style="height:84px;padding:0 24px;border:7px solid var(--outline);border-radius:22px;background:var(--warm);font-size:46px;transform:rotate(-4deg);box-sizing:border-box">1/3</div>`)
  const bar = add(step, `<div class="pill" style="flex:1;height:40px;border:7px solid var(--outline);background:var(--surface-200);overflow:hidden;box-sizing:border-box"><div class="fill" style="height:100%;background:var(--accent);transform-origin:0 50%"></div></div>`)
  const fill = $('.fill', bar)
  set(fill, 0, { sx: 0 })
  tw(fill, T.mood + 0.1, 0.5, { sx: [0, 1 / 3] }, ease.out3)
  tw(fill, T.time + 0.1, 0.5, { sx: [1 / 3, 2 / 3] }, ease.out3)
  tw(fill, T.passion + 0.1, 0.5, { sx: [2 / 3, 1] }, ease.out3)
  onFrame((t) => (count.textContent = t < T.time ? '1/3' : t < T.passion ? '2/3' : '3/3'))

  const title = (parent, text, sub) => {
    add(parent, `<div class="abs display" style="left:72px;top:280px;font-size:150px">${text}</div>`)
    add(parent, `<div class="abs sans" style="left:72px;width:936px;top:450px;font-size:46px;font-weight:500;color:var(--ink-soft)">${sub}</div>`)
  }
  const screen = (t0, t1) => {
    const g = add(wrap, `<div class="abs" style="inset:0"></div>`)
    set(g, 0, { opacity: 0 })
    set(g, t0 - 0.2, { opacity: 1 })
    if (t0 > T.mood) tw(g, t0 - 0.2, 0.22, { x: [1080, 0] }, ease.out3)
    if (t1) tw(g, t1, 0.22, { x: [0, -1080] }, ease.in3)
    return g
  }

  // Humeur
  const mood = screen(T.mood, T.time - 0.22)
  title(mood, `Ton humeur${NB}?`, 'Pas de mauvaise réponse. Un tap, et on continue.')
  const MOODS = [
    { icon: 'hourglass', label: 'Je m’ennuie', left: 72, top: 640, rot: -1.5 },
    { icon: 'snail', label: 'Je procrastine', left: 190, top: 870, rot: 1.5 },
    { icon: 'cloud-lightning', label: 'Je suis stressé·e', left: 100, top: 1100, rot: -0.5 },
    { icon: 'wind', label: 'J’ai besoin de souffler', left: 72, top: 1330, rot: 1 },
  ]
  MOODS.forEach((m, i) => {
    const chip = add(
      mood,
      `<div class="abs sk bg-surface pill" style="--sh:10;left:${m.left}px;top:${m.top}px;height:176px;padding:0 64px 0 46px;display:flex;align-items:center;gap:30px;font:700 60px var(--font-sans);color:var(--ink)">${icon(m.icon, 70, 2.5)}${m.label}</div>`,
    )
    set(chip, 0, { rot: m.rot })
    popIn(chip, T.mood + 0.05 + i * 0.11, { from: 0.4, s: 2.6, dur: 0.35 })
    if (i === 1) {
      tw(chip, T.moodTap, 0.1, { bg: ['#fffdf7', '#ff6a4d'] })
      press(chip, T.moodTap, { d: 10, sh: 10, hold: 0.12 })
      tw(chip, T.moodTap + 0.12, 0.3, { rot: [1.5, -3] }, ease.back(3))
      const check = add(mood, `<div class="abs sk bg-good pill center on-color" style="--sh:6;left:${m.left + 600}px;top:${m.top - 46}px;width:110px;height:110px;border-width:7px">${icon('check', 60, 3.4)}</div>`)
      set(check, 0, { opacity: 0 })
      popIn(check, T.moodTap + 0.1, { rot: [-40, -8], s: 3 })
      ripple(mood, m.left + 360, m.top + 88, T.moodTap)
    }
  })

  // Temps
  const time = screen(T.time, T.passion - 0.22)
  title(time, `Ton temps${NB}?`, 'On adapte l’activité à ton créneau.')
  ;[5, 15, 30].forEach((minutes, i) => {
    const top = 640 + i * 300
    const card = add(
      time,
      `<div class="abs sk bg-surface" style="--sh:11;left:72px;top:${top}px;width:936px;height:250px;border-radius:var(--r-lg);display:flex;align-items:center;gap:44px;padding:0 40px;box-sizing:border-box">
        <div style="position:relative;width:196px;height:196px;flex:none">
          <svg viewBox="0 0 80 80" width="196" height="196" style="position:absolute;inset:0;overflow:visible">
            <circle class="dots" cx="40" cy="40" r="37" fill="none" stroke="var(--ink-soft)" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round" style="transform-origin:40px 40px"/>
            <circle class="disc" cx="40" cy="40" r="30" fill="#fffdf7" stroke="var(--outline)" stroke-width="2.5"/>
            <circle class="arc" cx="40" cy="40" r="24" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" transform="rotate(-90 40 40)"/>
          </svg>
          <div class="abs center" style="inset:0;flex-direction:column;line-height:0.9"><span class="display" style="font-size:62px">${minutes}</span><span class="display" style="font-size:26px">min</span></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <span class="display" style="font-size:78px">${minutes} minutes</span>
          <span class="sans" style="font-size:42px;font-weight:600;color:var(--ink-soft)">${['Une petite pause', 'Un vrai moment', 'Une vraie plongée'][i]}</span>
        </div>
      </div>`,
    )
    set(card, 0, { rot: [-1, 1, -0.5][i] })
    popIn(card, T.time - 0.05 + i * 0.1, { from: 0.5, s: 2.2, dur: 0.35 })
    const arc = $('.arc', card)
    set(arc, 0, { d0: 0, d1: 0.001 })
    tw(arc, T.time + 0.15 + i * 0.1, 0.5, { d1: [0.001, minutes / 60] }, ease.out3)
    const dots = $('.dots', card)
    onFrame((t) => (dots.style.transform = `rotate(${(t * (18 - i * 4)).toFixed(1)}deg)`))
    if (minutes === 5) {
      tw($('.disc', card), T.timeTap, 0.12, { fill: ['#fffdf7', '#ffd23f'] })
      tw(card, T.timeTap, 0.1, { bg: ['#fffdf7', '#ffd23f'] })
      press(card, T.timeTap, { d: 10, sh: 11, hold: 0.12 })
      tw(card, T.timeTap + 0.12, 0.3, { rot: [-1, -2.5] }, ease.back(3))
      ripple(time, 560, top + 125, T.timeTap)
    }
  })

  // Passion
  const passion = screen(T.passion, null)
  title(passion, `Ta passion${NB}?`, 'Laquelle te tente maintenant ?')
  const PASSIONS = [
    { icon: 'pencil', label: 'Dessin', bg: 'bg-sky' },
    { icon: 'feather', label: 'Écriture', bg: 'bg-lilac' },
    { icon: 'headphones', label: 'Musique', bg: 'bg-good' },
    { icon: 'clapperboard', label: 'Cinéma', bg: 'bg-warm' },
  ]
  const others = []
  PASSIONS.forEach((pa, i) => {
    const cx = i % 2 === 0 ? 310 : 770
    const cy = i < 2 ? 800 : 1240
    const disc = add(passion, `<div class="abs sk pill center on-color ${pa.bg}" style="--sh:14;left:${cx - 150}px;top:${cy - 150}px;width:300px;height:300px">${icon(pa.icon, 130, 2.3)}</div>`)
    const label = add(passion, `<div class="abs display" style="left:${cx - 200}px;width:400px;top:${cy + 175}px;text-align:center;font-size:62px">${pa.label}</div>`)
    const rot = [-6, 5, 4, -5][i]
    set(disc, 0, { rot })
    slap(disc, T.passion + i * 0.125, { from: 1.9, rot: [rot * 4, rot] })
    slap(label, T.passion + i * 0.125 + 0.06, { from: 1.4 })
    if (i === 0) {
      press(disc, T.passionTap, { d: 10, sh: 14, hold: 0.14 })
      ripple(passion, cx, cy, T.passionTap, { size: 320 })
      tw(label, T.passionZoom, 0.15, { opacity: [1, 0] })
      tw(disc, T.passionZoom, 0.2, { scale: [1, 1.12] }, ease.out2)
    } else {
      others.push(disc, label)
    }
  })
  others.forEach((el, k) => tw(el, T.passionZoom + k * 0.02, 0.22, { scale: [1, 0], opacity: [1, 0] }, ease.in3))
  tw(step, T.passionZoom, 0.25, { y: [0, -200] }, ease.in3)
}

/* ------------------------------------------------ 5 · créer (14 → 18 s) ---- */

function buildS5() {
  const S = $('#S5')
  between(S, T.passionZoom, T.reward + 0.06)
  // Le ciel s'ouvre depuis le sticker « Dessin ».
  const main = add(S, `<div class="abs" style="inset:0;transform-origin:0 0;clip-path:circle(calc(var(--r) * 1px) at 310px 800px)"></div>`)
  set(main, 0, { '--r': 150 })
  tw(main, T.passionZoom, 0.45, { '--r': [150, 2400] }, ease.in3)
  add(main, `<div class="abs bg-sky" style="inset:0;background-image:radial-gradient(#ffffff55 5px, transparent 6px);background-size:60px 60px"></div>`)

  const card = add(main, `<div class="abs sk bg-paper" style="--sh:16;left:72px;top:230px;width:936px;height:1440px;border-radius:var(--r-lg)"></div>`)
  tw(card, T.activity - 0.12, 0.001, { opacity: [0, 1] })
  tw(card, T.activity - 0.12, 0.4, { y: [1500, 0], rot: [8, 0] }, ease.out3)
  const badges = add(card, `<div class="abs" style="left:56px;top:56px;display:flex;gap:22px"></div>`)
  const b1 = add(badges, `<div class="badge bg-sky" style="transform:rotate(-2deg)">${icon('pencil', 44, 2.6)}Dessin</div>`)
  const b2 = add(badges, `<div class="badge bg-warm" style="transform:rotate(2deg)">5 min</div>`)
  popIn(b1, T.activity + 0.15, { s: 3, dur: 0.3 })
  popIn(b2, T.activity + 0.25, { s: 3, dur: 0.3 })
  const eyebrow = add(card, `<div class="abs eyebrow" style="left:60px;top:196px">Ton activité</div>`)
  tw(eyebrow, T.activity + 0.2, 0.25, { opacity: [0, 1] })
  const prompt = add(card, `<div class="abs display" style="left:56px;width:820px;top:256px;font-size:104px">Dessine un objet de ton bureau.</div>`)
  wordsIn(prompt, T.activity + 0.25, { step: 0.05 })

  // La feuille, le dessin, le crayon.
  const sheet = add(card, `<div class="abs" style="left:56px;right:56px;top:600px;height:760px;border:6px dashed #d8c89b;border-radius:var(--r-md);background:var(--surface-100)"></div>`)
  tw(sheet, T.draw - 0.15, 0.25, { opacity: [0, 1], scale: [0.95, 1] }, ease.out3)
  const drawing = add(sheet, `<div class="abs" style="left:150px;top:90px">${mugSVG(520)}</div>`)
  const paths = [...drawing.querySelectorAll('path')]
  const lens = paths.map((path) => path.getTotalLength())
  const total = lens.reduce((a, b) => a + b, 0)
  const span = T.drawEnd - T.draw
  let acc = 0
  const segs = paths.map((path, i) => {
    const t0 = T.draw + (acc / total) * span
    acc += lens[i]
    const t1 = T.draw + (acc / total) * span
    set(path, 0, { d0: 0, d1: 0.0001 })
    tw(path, t0, t1 - t0, { d1: [0.0001, 1] }, ease.linear)
    return { path, t0, t1, len: lens[i] }
  })
  const scale = 520 / 480
  const pencil = add(sheet, `<div class="abs" style="left:0;top:0;width:72px;height:312px;transform-origin:${PENCIL_TIP[0]}px ${PENCIL_TIP[1]}px;z-index:5;filter:drop-shadow(10px 10px 0 rgba(21,21,21,0.9))">${pencilSVG}</div>`)
  const tipAt = (t) => {
    let seg = segs[0]
    for (const s of segs) if (s.t0 <= t) seg = s
    const p = Math.min(1, Math.max(0, (t - seg.t0) / (seg.t1 - seg.t0)))
    const pt = seg.path.getPointAtLength(p * seg.len)
    return [150 + (pt.x - 60) * scale, 90 + pt.y * scale]
  }
  onFrame((t) => {
    if (t < T.draw - 0.35 || t > T.drawEnd + 0.6) {
      pencil.style.visibility = 'hidden'
      return
    }
    pencil.style.visibility = ''
    const [x, y] = tipAt(Math.min(Math.max(t, T.draw), T.drawEnd))
    const inP = 1 - prog(t, T.draw - 0.35, 0.35, ease.out3)
    const outP = prog(t, T.drawEnd + 0.05, 0.5, ease.in3)
    const wob = 6 * Math.sin(t * 40)
    const px = x - PENCIL_TIP[0] + 500 * inP + 600 * outP
    const py = y - PENCIL_TIP[1] + 400 * inP + 500 * outP
    pencil.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) rotate(${(28 + wob).toFixed(2)}deg)`
  })

  // L'écran recule : il devient la première case d'une grille de 2 × 2.
  tw(main, T.grid, 0.3, { scale: [1, 0.5] }, ease.io3)
  const frame = add(S, `<div class="abs" style="left:0;top:0;width:540px;height:960px;border:8px solid var(--outline);box-sizing:border-box;z-index:3"></div>`)
  between(frame, T.grid + 0.28)

  const tile = (left, top, cls) =>
    add(S, `<div class="abs ${cls}" style="left:${left}px;top:${top}px;width:540px;height:960px;border:8px solid var(--outline);box-sizing:border-box;overflow:hidden;z-index:2"></div>`)
  // Écriture
  const [tWrite, tMusic, tCine] = T.quads
  const qW = tile(540, 0, 'bg-lilac')
  set(qW, 0, { opacity: 0 })
  tw(qW, tWrite + 0.05, 0.001, { opacity: [0, 1] })
  tw(qW, tWrite + 0.05, 0.3, { x: [560, 0] }, ease.out3)
  add(qW, `<div class="abs badge bg-paper" style="left:44px;top:60px;transform:rotate(-3deg)">${icon('feather', 44, 2.6)}Écriture</div>`)
  const note = add(qW, `<div class="abs sk bg-paper" style="--sh:11;left:44px;top:230px;width:440px;height:560px;border-radius:var(--r-md);padding:44px;transform:rotate(2deg)"><div class="display txt" style="font-size:58px;line-height:1.08">Dehors, quelqu’un rit. Je respire un peu mieux.</div></div>`)
  const chars = splitChars($('.txt', note))
  chars.forEach((c, i) => tw(c, tWrite + 0.3 + (i / chars.length) * 1.2, 0.001, { opacity: [0, 1] }))
  const quill = add(qW, `<div class="abs sk pill center bg-warm on-color" style="--sh:8;left:380px;top:700px;width:120px;height:120px">${icon('pencil', 58, 2.5)}</div>`)
  onFrame((t) => (quill.style.transform = `translate(${(8 * Math.sin(t * 9)).toFixed(1)}px, ${(6 * Math.cos(t * 11)).toFixed(1)}px) rotate(-8deg)`))

  // Musique
  const qM = tile(0, 960, 'bg-good')
  set(qM, 0, { opacity: 0 })
  tw(qM, tMusic + 0.05, 0.001, { opacity: [0, 1] })
  tw(qM, tMusic + 0.05, 0.3, { y: [980, 0] }, ease.out3)
  add(qM, `<div class="abs badge bg-paper" style="left:44px;top:60px;transform:rotate(2deg)">${icon('headphones', 44, 2.6)}Musique</div>`)
  const phones = add(qM, `<div class="abs sk pill center bg-paper on-color" style="--sh:14;left:140px;top:230px;width:260px;height:260px">${icon('headphones', 140, 2.2)}</div>`)
  onFrame((t) => {
    const k = Math.max(0, 1 - ((t % BEAT) / BEAT) * 3)
    phones.style.transform = `scale(${(1 + 0.07 * k).toFixed(3)}) rotate(${(-4 + 3 * Math.sin(t * 4)).toFixed(2)}deg)`
  })
  const EQ = ['var(--accent)', 'var(--warm)', 'var(--sky)', 'var(--lilac)', 'var(--paper)']
  EQ.forEach((c, i) => {
    const barEl = add(qM, `<div class="abs" style="left:${72 + i * 82}px;bottom:130px;width:62px;height:240px;border:7px solid var(--outline);border-radius:14px;background:${c};box-sizing:border-box;transform-origin:50% 100%"></div>`)
    onFrame((t) => {
      const k = Math.max(0, 1 - ((t + i * 0.12) % BEAT) / BEAT)
      const h = 0.25 + 0.75 * k * (0.6 + 0.4 * Math.sin(i * 1.7 + t * 3))
      barEl.style.transform = `scaleY(${h.toFixed(3)})`
    })
  })
  for (let i = 0; i < 3; i++) {
    const n = add(qM, `<div class="abs" style="left:${360 + i * 50}px;top:420px;color:var(--ink)">${icon('music', 70, 2.6)}</div>`)
    onFrame((t) => {
      const p = ((t - tMusic + i * 0.4) % 1.2) / 1.2
      n.style.opacity = Math.sin(Math.PI * p).toFixed(3)
      n.style.transform = `translate(${(30 * Math.sin(p * 6 + i)).toFixed(1)}px, ${(-260 * p).toFixed(1)}px) rotate(${(15 * Math.sin(p * 8)).toFixed(1)}deg)`
    })
  }

  // Cinéma
  const qC = tile(540, 960, 'bg-warm')
  set(qC, 0, { opacity: 0 })
  tw(qC, tCine + 0.05, 0.001, { opacity: [0, 1] })
  tw(qC, tCine + 0.05, 0.3, { x: [560, 0], y: [300, 0] }, ease.out3)
  add(qC, `<div class="abs badge bg-paper" style="left:44px;top:60px;transform:rotate(-2deg)">${icon('clapperboard', 44, 2.6)}Cinéma</div>`)
  const clap = add(
    qC,
    `<svg class="abs" viewBox="0 0 200 180" width="340" height="306" style="left:100px;top:230px;overflow:visible">
      <rect x="10" y="62" width="180" height="110" rx="14" fill="var(--paper)" stroke="${INK}" stroke-width="8"/>
      <path d="M30 100h140M30 130h90" stroke="${INK}" stroke-width="7" stroke-linecap="round" opacity="0.35"/>
      <g class="arm" style="transform-origin:14px 58px">
        <rect x="10" y="30" width="180" height="32" rx="8" fill="${INK}" stroke="${INK}" stroke-width="8"/>
        <path d="M40 30 L62 62 M84 30 L106 62 M128 30 L150 62" stroke="var(--paper)" stroke-width="12"/>
      </g>
    </svg>`,
  )
  const arm = $('.arm', clap)
  onFrame((t) => {
    // Le clap s'ouvre, puis claque sur les temps.
    let a = -24
    for (const hit of [tCine + 0.25, tCine + 0.75]) {
      if (t >= hit - 0.08 && t <= hit + 0.4) a = -24 * (1 - prog(t, hit - 0.08, 0.08, ease.in2) + prog(t, hit + 0.12, 0.25, ease.out3))
    }
    arm.style.transform = `rotate(${a.toFixed(2)}deg)`
  })
  const film = add(qC, `<div class="abs" style="left:-40px;bottom:120px;width:1400px;height:150px;background:${INK};display:flex;gap:26px;align-items:center;padding-left:26px"></div>`)
  for (let i = 0; i < 14; i++) add(film, `<div style="flex:none;width:92px;height:92px;border-radius:14px;background:${['#ffd23f', '#86c8ff', '#ff6a4d', '#93e5b8', '#cdb8ff'][i % 5]}"></div>`)
  onFrame((t) => (film.style.transform = `translateX(${(-((t * 240) % 236)).toFixed(1)}px) rotate(-3deg)`))

  // « Crée au lieu de scroller. »
  const instead = add(S, `<div class="abs" style="left:0;right:0;top:830px;display:flex;justify-content:center;z-index:6"><div class="sk bg-paper display" style="--sh:16;padding:26px 50px 34px;border-radius:var(--r-md);font-size:92px;text-align:center;transform:rotate(-3deg)">Crée au lieu<br/>de scroller.</div></div>`)
  slap(instead.firstElementChild, T.instead, { from: 1.9 })
  set(instead.firstElementChild, 0, { rot: -3 })

  // On pousse vers le haut.
  tw(S, T.reward - 0.15, 0.2, { y: [0, -1920] }, ease.in3)
}

/* ------------------------------------------------ 6 · la récompense -------- */

function buildS6() {
  const S = $('#S6')
  S.classList.add('scene')
  between(S, T.reward - 0.15, T.gallery)
  tw(S, T.reward - 0.15, 0.2, { y: [1920, 0] }, ease.out3)
  backdrop(S, 13)

  const rays = add(S, `<div class="abs pill" style="left:-110px;top:670px;width:1300px;height:1300px;background:repeating-conic-gradient(var(--warm) 0deg 9deg, transparent 9deg 22.5deg);-webkit-mask-image:radial-gradient(closest-side, #000 25%, transparent 100%);mask-image:radial-gradient(closest-side, #000 25%, transparent 100%)"></div>`)
  set(rays, 0, { opacity: 0 })
  tw(rays, T.burst, 0.4, { opacity: [0, 1], scale: [0.4, 1] }, ease.out3)
  onFrame((t) => (rays.style.rotate = `${(t * 14).toFixed(1)}deg`))

  // Le dessin, rangé comme une photo, et le tampon.
  const polaroid = add(
    S,
    `<div class="abs sk bg-paper" style="--sh:16;left:250px;top:150px;width:580px;height:660px;border-radius:var(--r-sm);padding:34px;box-sizing:border-box">
      <div style="height:470px;border-radius:18px;background:var(--sky);border:6px solid var(--outline);box-sizing:border-box" class="center">${mugSVG(330)}</div>
      <div class="display" style="margin-top:28px;font-size:48px;text-align:center">Un objet de mon bureau</div>
    </div>`,
  )
  set(polaroid, 0, { rot: 3 })
  tw(polaroid, T.reward, 0.001, { opacity: [0, 1] })
  tw(polaroid, T.reward, 0.32, { y: [-900, 0], rot: [-10, 3] }, ease.back(1.4))
  const stamp = add(S, `<div class="abs sk bg-accent pill center on-color" style="--sh:11;left:730px;top:100px;width:200px;height:200px">${icon('check', 118, 3.4)}</div>`)
  set(stamp, 0, { rot: -12 })
  tw(stamp, T.stamp, 0.001, { opacity: [0, 1] })
  tw(stamp, T.stamp, 0.1, { scale: [2.8, 1] }, ease.in2)
  tw(stamp, T.stamp + 0.1, 0.3, { scale: [0.9, 1] }, ease.back(3))

  const saved = add(S, `<div class="abs display" style="left:0;right:0;top:890px;text-align:center;font-size:100px">Activité enregistrée.</div>`)
  wordsIn(saved, T.saved, { step: 0.08 })
  const plus = add(S, `<div class="abs" style="left:0;right:0;top:1030px;display:flex;justify-content:center;align-items:center;gap:22px"></div>`)
  const plusBadge = add(plus, `<div class="sk bg-good display on-color center" style="--sh:8;height:104px;padding:0 34px;border-radius:999px;font-size:60px;transform:rotate(-3deg)">+5 minutes</div>`)
  const plusText = add(plus, `<div class="sans" style="font-size:50px;font-weight:600;color:var(--ink-soft)">ajoutées à ton total.</div>`)
  popIn(plusBadge, T.plus, { s: 3, dur: 0.35 })
  tw(plusText, T.plus + 0.1, 0.3, { opacity: [0, 1], x: [40, 0] }, ease.out3)

  // Le compteur de pièces d'or, à rouleaux.
  const counter = add(
    S,
    `<div class="abs sk bg-warm on-color" style="--sh:16;left:72px;top:1190px;width:936px;height:290px;border-radius:var(--r-lg);display:flex;align-items:center;gap:40px;padding:0 60px;box-sizing:border-box">
      <div class="coin">${coinSVG(150)}</div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="digits" style="display:flex;gap:14px"></div>
        <div class="sans" style="font-size:40px;font-weight:800">pièces d’or au total</div>
      </div>
    </div>`,
  )
  popIn(counter, T.plus + 0.2, { from: 0.6, s: 2, dur: 0.35 })
  const digits = $('.digits', counter)
  const strips = []
  ;['0', '1', '2', '3'].forEach((d, i) => {
    const box = add(digits, `<div style="position:relative;width:96px;height:128px;border:6px solid var(--outline);border-radius:22px;background:var(--surface-200);overflow:hidden;box-sizing:border-box"></div>`)
    const strip = add(box, `<div class="abs display" style="left:0;right:0;top:0;text-align:center;font-size:84px;line-height:116px;color:${i === 0 ? 'var(--ink-faint)' : 'var(--ink)'}">${'0123456789'.split('').map((n) => `<div>${n}</div>`).join('')}</div>`)
    set(strip, 0, { y: -Number(d) * 116 })
    strips.push(strip)
  })
  const coinEl = $('.coin', counter)
  T.coins.forEach((tc, i) => {
    tw(strips[3], tc, 0.25, { y: [-(3 + i) * 116, -(4 + i) * 116] }, ease.back(1.6))
    tw(coinEl, tc, 0.25, { scale: [1.25, 1], rot: [i % 2 ? 12 : -12, 0] }, ease.back(3))
    // Une pièce tombe dans le compteur.
    const drop = add(S, `<div class="abs" style="left:${150 + (i % 2 ? 30 : -20)}px;top:1260px;z-index:5">${coinSVG(120)}</div>`)
    set(drop, 0, { opacity: 0 })
    tw(drop, tc - 0.32, 0.001, { opacity: [0, 1] })
    onFrame((t) => {
      if (t < tc - 0.32 || t > tc) return
      drop.style.transform = `translateY(${(-1500 * (1 - ease.in2((t - tc + 0.32) / 0.32))).toFixed(1)}px) scaleX(${Math.cos((t - tc) * 18).toFixed(3)})`
    })
    set(drop, tc, { opacity: 0 })
  })

  // La fête : confettis et pluie de pièces.
  confetti(S, T.burst, [[0, 1700, 1], [1080, 1700, -1]], 70, 21)
  coinRain(S, T.burst + 0.05, 18, 33)

  const rule = add(S, `<div class="abs" style="left:0;right:0;top:1560px;display:flex;justify-content:center;z-index:6"><div class="sk bg-sky display on-color" style="--sh:11;padding:18px 44px 26px;border-radius:var(--r-md);font-size:72px;transform:rotate(2deg)">1 minute = 1 pièce d’or</div></div>`)
  slap(rule.firstElementChild, T.rule, { from: 1.8 })
  set(rule.firstElementChild, 0, { rot: 2 })

  tw(S, T.gallery - 0.25, 0.25, { y: [0, -1920] }, ease.in3)
}

/** Confettis cernés d'encre, lancés depuis des points [x, y, direction]. */
function confetti(parent, t0, origins, count, seed) {
  const r = rng(seed)
  const COLORS = ['#ff6a4d', '#ffd23f', '#86c8ff', '#93e5b8', '#cdb8ff', '#fffdf7']
  const pieces = []
  for (let i = 0; i < count; i++) {
    const [ox, oy, dir] = origins[i % origins.length]
    const kind = i % 3
    const w = kind === 0 ? 34 : kind === 1 ? 26 : 46
    const h = kind === 0 ? 20 : kind === 1 ? 26 : 14
    const el = add(
      parent,
      `<div class="abs" style="left:${ox - w / 2}px;top:${oy - h / 2}px;width:${w}px;height:${h}px;background:${COLORS[i % COLORS.length]};border:5px solid ${INK};border-radius:${kind === 1 ? '50%' : '5px'};box-sizing:border-box;z-index:8;visibility:hidden"></div>`,
    )
    const angle = dir === 0 ? r() * Math.PI * 2 : -Math.PI / 2 + dir * (0.15 + r() * 0.75)
    const speed = dir === 0 ? 900 + r() * 900 : 1500 + r() * 1300
    pieces.push({ el, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, spin: (r() - 0.5) * 1400, flip: 4 + r() * 10, delay: r() * 0.08 })
  }
  onFrame((t) => {
    for (const p of pieces) {
      const d = t - t0 - p.delay
      if (d < 0 || d > 1.9) {
        p.el.style.visibility = 'hidden'
        continue
      }
      const drag = 1 - Math.exp(-d * 2.2)
      const x = (p.vx / 2.2) * drag + 30 * Math.sin(d * 5)
      const y = (p.vy / 2.2) * drag + 900 * d * d * 0.55
      p.el.style.visibility = ''
      p.el.style.opacity = String(Math.min(1, (1.9 - d) / 0.3))
      p.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(p.spin * d).toFixed(1)}deg) scaleY(${Math.cos(d * p.flip).toFixed(3)})`
    }
  })
}

/** Pluie de pièces d'or qui tournent sur elles-mêmes. */
function coinRain(parent, t0, count, seed) {
  const r = rng(seed)
  const coins = []
  for (let i = 0; i < count; i++) {
    const size = 70 + r() * 60
    const el = add(parent, `<div class="abs" style="left:${40 + r() * 1000 - size / 2}px;top:${-size - 20}px;z-index:7;visibility:hidden">${coinSVG(size)}</div>`)
    coins.push({ el, delay: r() * 1.0, speed: 1500 + r() * 900, spin: 8 + r() * 10, sway: r() * 6 })
  }
  onFrame((t) => {
    for (const c of coins) {
      const d = t - t0 - c.delay
      if (d < 0 || d > 1.8) {
        c.el.style.visibility = 'hidden'
        continue
      }
      c.el.style.visibility = ''
      c.el.style.transform = `translate(${(20 * Math.sin(d * 4 + c.sway)).toFixed(1)}px, ${(c.speed * d + 400 * d * d).toFixed(1)}px) scaleX(${Math.cos(d * c.spin).toFixed(3)})`
    }
  })
}

/* ------------------------------------------------ 7 · galerie et thèmes ---- */

const THEMES = ['pop', 'nuit', 'bd', 'memphis']
const THEME_NAMES = { nuit: 'Pop Nuit', bd: 'BD', memphis: 'Memphis' }

function buildS7() {
  const S = $('#S7')
  S.classList.add('scene')
  between(S, T.gallery - 0.25, T.end)
  tw(S, T.gallery - 0.25, 0.25, { y: [1920, 0] }, ease.out3)
  const themeAt = (t) => (t < T.themes[0] ? 'pop' : t < T.themes[1] ? 'nuit' : t < T.themes[2] ? 'bd' : 'memphis')
  onFrame((t) => (S.dataset.theme = themeAt(t)))

  const inner = add(S, `<div class="abs" style="inset:0"></div>`)
  T.themes.forEach((ts) => tw(inner, ts, 0.3, { scale: [1.07, 1], rot: [-1.2, 0] }, ease.out3))

  // Décors propres à chaque thème.
  const nuitDeco = add(inner, `<div class="abs deco deco-nuit" style="inset:0"></div>`)
  ;[[60, 520, 60, 'var(--warm)'], [960, 760, 46, 'var(--sky)'], [40, 1660, 54, 'var(--good)'], [980, 1720, 40, 'var(--lilac)'], [930, 400, 34, 'var(--accent)']].forEach(([x, y, s, c], i) => {
    const sp = add(nuitDeco, `<div class="abs" style="left:${x}px;top:${y}px">${sparkleSVG(s, c)}</div>`)
    onFrame((t) => (sp.style.transform = `scale(${(0.8 + 0.3 * Math.sin(t * 6 + i)).toFixed(3)}) rotate(${(t * 40).toFixed(1)}deg)`))
  })
  const bdDeco = add(inner, `<div class="abs deco deco-bd" style="inset:0"></div>`)
  const burst = (cx, cy, size, color) => {
    const pts = Array.from({ length: 28 }, (_, k) => {
      const rad = k % 2 === 0 ? 50 : 36
      const a = (Math.PI * 2 * k) / 28
      return `${(50 + rad * Math.cos(a)).toFixed(1)},${(50 + rad * Math.sin(a)).toFixed(1)}`
    }).join(' ')
    const el = add(bdDeco, `<svg class="abs" viewBox="-4 -4 108 108" width="${size}" height="${size}" style="left:${cx - size / 2}px;top:${cy - size / 2}px;overflow:visible"><polygon points="${pts}" fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></svg>`)
    onFrame((t) => (el.style.transform = `rotate(${(t * 20).toFixed(1)}deg)`))
  }
  burst(990, 440, 260, 'var(--warm)')
  burst(60, 1700, 220, 'var(--accent)')
  const memDeco = add(inner, `<div class="abs deco deco-memphis" style="inset:0"></div>`)
  add(memDeco, `<svg class="abs" viewBox="0 0 64 58" width="170" height="154" style="left:900px;top:410px;overflow:visible"><path d="M32 4 L60 54 L4 54 Z" fill="var(--good)" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/></svg>`)
  add(memDeco, `<svg class="abs" viewBox="0 0 120 40" width="300" height="100" style="left:-40px;top:1700px;overflow:visible"><path d="M5 25 Q20 5 35 25 T65 25 T95 25 T125 25" fill="none" stroke="var(--accent)" stroke-width="9" stroke-linecap="round"/></svg>`)
  add(memDeco, `<div class="abs pill" style="left:930px;top:1660px;width:200px;height:200px;background-image:radial-gradient(${INK} 5px, transparent 6px);background-size:26px 26px"></div>`)
  add(memDeco, `<div class="abs pill" style="left:-60px;top:560px;width:150px;height:150px;background:var(--warm);border:7px solid ${INK};box-sizing:border-box"></div>`)

  const title1 = add(inner, `<div class="abs display" style="left:72px;top:150px;font-size:var(--fs-title)">Ta galerie</div>`)
  const title2 = add(inner, `<div class="abs display" style="left:72px;top:150px;font-size:var(--fs-title)">Ton style.</div>`)
  const sub1 = add(inner, `<div class="abs sans" style="left:72px;width:936px;top:325px;font-size:48px;font-weight:600;color:var(--ink-soft)">Pas de calendrier. Pas de culpabilité.</div>`)
  const sub2 = add(inner, `<div class="abs sans" style="left:72px;width:936px;top:325px;font-size:48px;font-weight:600;color:var(--ink-soft)">4 thèmes au choix, change quand tu veux.</div>`)
  wordsIn(title1, T.gallery, { step: 0.08 })
  tw(sub1, T.noGuilt, 0.3, { opacity: [0, 1], y: [30, 0] }, ease.out3)
  set(title1, T.themes[0], { opacity: 0 })
  set(sub1, T.themes[0], { opacity: 0 })
  between(title2, T.themes[0])
  between(sub2, T.themes[0])

  // L'étiquette du thème, qui se recolle à chaque changement.
  const tag = add(inner, `<div class="abs sk bg-accent pill on-color" style="--sh:8;right:56px;top:400px;height:110px;padding:0 40px 0 30px;display:flex;align-items:center;gap:18px;font:800 46px var(--font-sans);z-index:4">${icon('palette', 52, 2.6)}<span class="name"></span></div>`)
  const tagName = $('.name', tag)
  onFrame((t) => (tagName.textContent = THEME_NAMES[themeAt(t)] ?? ''))
  set(tag, 0, { opacity: 0, rot: 5 })
  T.themes.forEach((ts, i) => {
    set(tag, ts, { opacity: 1 })
    tw(tag, ts, 0.2, { scale: [1.8, 1], rot: [i % 2 ? -14 : 14, i % 2 ? -4 : 5] }, ease.back(1.5))
  })

  // La grosse carte des pièces.
  const coinCard = add(
    inner,
    `<div class="abs coincard" style="left:72px;top:450px;width:936px;height:290px">
      <div class="stripes"></div>
      <div class="face sk bg-warm on-color" style="--sh:16;display:flex;align-items:center;gap:36px;padding:0 56px">
        ${coinSVG(150)}
        <div style="display:flex;flex-direction:column"><span style="font-family:var(--font-numbers);font-weight:var(--display-weight);font-style:var(--display-style);letter-spacing:var(--display-spacing);font-size:170px;line-height:0.9">128</span><span class="sans" style="font-size:42px;font-weight:800">pièces d’or</span></div>
      </div>
    </div>`,
  )
  set(coinCard, 0, { rot: -1 })
  popIn(coinCard, T.gallery + 0.05, { from: 0.6, s: 2, dur: 0.4 })
  const month = add(inner, `<div class="abs badge bg-sky" style="--sh:8;right:90px;top:640px;transform:rotate(4deg);z-index:3">9 activités ce mois-ci</div>`)
  popIn(month, T.gallery + 0.3, { s: 3, dur: 0.3 })

  // Les créations.
  const CARDS = [
    { cls: 'bg-sky', icon: 'pencil', label: 'Dessin', body: `<div style="height:220px;border-radius:18px;border:6px solid var(--outline);background:var(--paper);box-sizing:border-box" class="center">${mugSVG(190)}</div>` },
    { cls: 'bg-lilac', icon: 'feather', label: 'Écriture', body: `<div class="quote">« Dehors, quelqu’un rit. Je respire un peu mieux. »</div>` },
    { cls: 'bg-good', icon: 'headphones', label: 'Musique', body: `<div class="quote">Un album de jazz, en entier, les yeux fermés.</div>` },
    { cls: 'bg-warm', icon: 'clapperboard', label: 'Cinéma', body: `<div class="quote">Un court métrage d’animation.</div>` },
  ]
  CARDS.forEach((c, i) => {
    const left = i % 2 === 0 ? 72 : 552
    const top = i < 2 ? 800 : 1210
    const rot = [-1.5, 1.5, 1, -1][i]
    const card = add(
      inner,
      `<div class="gcard" style="left:${left}px;top:${top}px">
        <div class="stripes"></div>
        <div class="face sk ${c.cls}" style="--sh:14">
          ${c.body}
          <div class="badge bg-paper" style="height:78px;font-size:36px;align-self:flex-start;--sh:0;gap:12px">${icon(c.icon, 38, 2.6)}${c.label}</div>
        </div>
      </div>`,
    )
    set(card, 0, { rot })
    tw(card, T.gallery - 0.1 + i * 0.08, 0.001, { opacity: [0, 1] })
    tw(card, T.gallery - 0.1 + i * 0.08, 0.45, { y: [700, 0], rot: [rot * 8, rot] }, ease.back(1.3))
  })

  // Tout se replie dans l'icône de l'app.
  tw(inner, T.galleryOut, 0.25, { scale: [1, 0.12], rot: [0, 12], opacity: [1, 0] }, ease.in3)
  inner.style.transformOrigin = '540px 640px'
}

/* ------------------------------------------------ 8 · la signature --------- */

function buildS8() {
  const S = $('#S8')
  S.classList.add('scene')
  between(S, T.galleryOut, DURATION + 1)
  backdrop(S, 17)

  const rays = add(S, `<div class="abs pill" style="left:-10px;top:90px;width:1100px;height:1100px;background:repeating-conic-gradient(var(--warm) 0deg 9deg, transparent 9deg 22.5deg);-webkit-mask-image:radial-gradient(closest-side, #000 30%, transparent 100%);mask-image:radial-gradient(closest-side, #000 30%, transparent 100%)"></div>`)
  set(rays, 0, { opacity: 0 })
  tw(rays, T.end, 0.5, { opacity: [0, 1], scale: [0.3, 1] }, ease.out3)
  tw(rays, T.final, 0.5, { scale: [1.25, 1] }, ease.out3)
  onFrame((t) => (rays.style.rotate = `${(t * 16 + 30 * prog(t, T.final, 0.6, ease.out3)).toFixed(1)}deg`))

  const logo = add(S, `<div class="abs" style="left:380px;top:480px;width:320px;height:320px;filter:drop-shadow(18px 18px 0 ${INK})">${brandSVG(320)}</div>`)
  set(logo, 0, { opacity: 0 })
  tw(logo, T.end, 0.001, { opacity: [0, 1] })
  tw(logo, T.end, 0.45, { scale: [0.1, 1], rot: [-40, -6] }, ease.back(2.2))
  tw(logo, T.final, 0.4, { scale: [1.18, 1] }, ease.back(3))
  onFrame((t) => {
    if (t < T.end + 0.45) return
    logo.style.translate = `0 ${(10 * Math.sin((t - T.end) * 3)).toFixed(1)}px`
  })

  const word = add(S, `<div class="abs" style="left:0;right:0;top:850px;display:flex;justify-content:center"><div class="sk bg-accent display on-color center" style="--sh:16;height:210px;padding:0 64px 16px;border-radius:var(--r-sm);font-size:156px">scroll-up</div></div>`)
  const w = word.firstElementChild
  set(w, 0, { rot: -3 })
  slap(w, T.wordmark, { from: 2, rot: [-12, -3] })
  tw(w, T.final, 0.45, { rot: [3, -3] }, ease.elastic(0.3))

  const tagline = add(S, `<div class="abs display balance" style="left:72px;width:936px;top:1120px;text-align:center;font-size:80px">Transforme ton envie de scroller en <span class="hl" style="position:relative;white-space:nowrap">5 minutes de création.</span></div>`)
  const hl = $('.hl', tagline)
  const mark = document.createElement('span')
  mark.style.cssText = 'position:absolute;left:-10px;right:-10px;bottom:4px;height:34px;background:var(--warm);z-index:-1;border-radius:8px;transform-origin:0 50%;transform:skewX(-8deg)'
  hl.style.zIndex = '0'
  hl.style.isolation = 'isolate'
  hl.prepend(mark)
  // Les mots d'abord, puis le surlignage passe dessous.
  const words = []
  for (const node of [...tagline.childNodes]) {
    if (node === hl) continue
    if (node.nodeType === 3) {
      const span = document.createElement('span')
      span.textContent = node.textContent
      tagline.replaceChild(span, node)
      words.push(...splitWords(span))
    }
  }
  const hlWords = []
  for (const node of [...hl.childNodes]) {
    if (node.nodeType === 3) {
      const span = document.createElement('span')
      span.textContent = node.textContent
      hl.replaceChild(span, node)
      hlWords.push(...splitWords(span))
    }
  }
  ;[...words, ...hlWords].forEach((wd, i) => {
    tw(wd, T.tagline + i * 0.055, 0.001, { opacity: [0, 1] })
    tw(wd, T.tagline + i * 0.055, 0.4, { y: [60, 0], rot: [5, 0] }, ease.back(1.7))
  })
  set(mark, 0, { sx: 0 })
  tw(mark, T.tagline + 0.55, 0.35, { sx: [0, 1] }, ease.out3)

  const cta = add(
    S,
    `<div class="abs sk bg-sky pill on-color" style="--sh:16;left:90px;width:900px;top:1440px;height:160px;display:flex;align-items:center;justify-content:center;gap:28px;font:800 54px var(--font-sans);box-sizing:border-box">
      <span class="pill center" style="width:104px;height:104px;border:7px solid var(--outline);background:var(--paper);box-sizing:border-box">${icon('send', 54, 2.6)}</span>
      @scrollup_bot sur Telegram
    </div>`,
  )
  tw(cta, T.cta, 0.001, { opacity: [0, 1] })
  tw(cta, T.cta, 0.4, { y: [260, 0], rot: [4, 0] }, ease.back(1.8))
  press(cta, T.ctaPress, { hold: 0.25 })
  ripple(S, 700, 1520, T.ctaPress)

  const hand = makeHand(S, 700, 1525)
  set(hand, 0, { opacity: 0 })
  tw(hand, T.fingerIn2, 0.001, { opacity: [0, 1] })
  tw(hand, T.fingerIn2, 0.45, { x: [480, 0], y: [620, 0] }, ease.out3)
  tw(hand, T.ctaPress - 0.08, 0.08, { x: [0, 12], y: [0, 12], scale: [1.15, 1.08] }, ease.in2)
  tw(hand, T.ctaPress + 0.25, 0.2, { x: [12, 0], y: [12, -20], scale: [1.08, 1.15] }, ease.out3)
  tw(hand, T.final, 0.4, { x: [0, 520], y: [-20, 760] }, ease.in3)

  confetti(S, T.ctaPress + 0.25, [[700, 1520, 0]], 46, 44)
  confetti(S, T.final, [[0, 1900, 1], [1080, 1900, -1]], 60, 45)
}

// ---------------------------------------------------------- effets communs

function buildFx() {
  const fx = $('#fx')
  fx.style.pointerEvents = 'none'
  fx.style.zIndex = '20'

  // Iris : le bouton tomate se referme sur la bouée du signal.
  const iris = add(fx, `<div class="abs" style="inset:0;background:#ff6a4d;clip-path:circle(calc(var(--r) * 1px) at ${BUOY[0]}px ${BUOY[1]}px)"></div>`)
  between(iris, T.signal - 0.01, T.signal + 0.3)
  set(iris, 0, { '--r': 1500 })
  tw(iris, T.signal, 0.3, { '--r': [1500, 130] }, ease.io3)
  const ring = add(fx, `<svg class="abs" width="1080" height="1920" style="left:0;top:0;overflow:visible"><circle cx="${BUOY[0]}" cy="${BUOY[1]}" r="1500" fill="none" stroke="${INK}" stroke-width="8"/></svg>`)
  between(ring, T.signal - 0.01, T.signal + 0.3)
  tw($('circle', ring), T.signal, 0.3, { 'attr:r': [1500, 130] }, ease.io3)

  // Le cercle du ciel, qui s'ouvre depuis le sticker « Dessin ».
  const ring2 = add(fx, `<svg class="abs" width="1080" height="1920" style="left:0;top:0;overflow:visible"><circle cx="310" cy="800" r="150" fill="none" stroke="${INK}" stroke-width="8"/></svg>`)
  between(ring2, T.passionZoom, T.passionZoom + 0.45)
  tw($('circle', ring2), T.passionZoom, 0.45, { 'attr:r': [150, 2400] }, ease.in3)

  // Grain d'impression, qui « bout » 12 fois par seconde.
  const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
  const grain = add(fx, `<div class="abs" style="inset:0;background:#151515;opacity:0.07;-webkit-mask-image:${GRAIN};mask-image:${GRAIN};-webkit-mask-size:240px;mask-size:240px"></div>`)
  const r = rng(99)
  const offsets = Array.from({ length: 400 }, () => [Math.round(r() * 240), Math.round(r() * 240)])
  onFrame((t) => {
    const [x, y] = offsets[Math.floor(t * 12) % offsets.length]
    grain.style.webkitMaskPosition = `${x}px ${y}px`
    grain.style.maskPosition = `${x}px ${y}px`
  })

  // Caméra : secousses aux impacts.
  const cam = $('#cam')
  onFrame((t) => {
    const [x, y] = shake(t)
    cam.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`
  })
}

// ------------------------------------------------------------------ démarrage

async function start() {
  const fonts = [
    '800 100px "Bricolage Grotesque Variable"',
    '500 100px "Rethink Sans Variable"',
    '800 100px "Rethink Sans Variable"',
    'italic 900 100px "Rubik Variable"',
    'italic 600 100px "Rubik Variable"',
    '400 100px "Rubik Variable"',
    '400 100px "Bangers"',
    '600 100px "Nunito Variable"',
    'italic 800 100px "Nunito Variable"',
    '700 100px "Syne Variable"',
    '600 100px "Outfit Variable"',
  ]
  await Promise.all(fonts.map((f) => document.fonts.load(f, 'Aàéèêç’«»·?0123456789')))
  await document.fonts.ready

  ;['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S8', 'S7'].forEach((id, i) => ($(`#${id}`).style.zIndex = String(i + 1)))
  buildS1()
  buildS2()
  buildS3()
  buildS4()
  buildS5()
  buildS6()
  buildS7()
  buildS8()
  buildFx()
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
    const audio = new Audio('../build/scrollup/audio.wav')
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

