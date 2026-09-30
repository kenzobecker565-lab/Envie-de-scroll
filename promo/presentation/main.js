/**
 * ============================================================================
 *  Vidéo de présentation Scroll-up — 61 s, vertical 1080 × 1920, voix off
 * ============================================================================
 *
 *  Toute l'app, dans l'ordre où on la découvre, sur la voix off :
 *
 *  0 → 6,9 s    2 mois par an devant nos écrans ; le fil sans fin se fige.
 *  6,9 → 10,8   « Voici Scroll-up », une app qui vit dans Telegram (le bot).
 *  10,8 → 16,4  L'arrivée : on choisit ses passions.
 *  16,4 → 23,6  Le pouce qui démange, un seul bouton, trois petits taps.
 *  23,6 → 33,5  L'activité (et « Une autre idée ») ; dessiner, écrire,
 *               écouter, regarder.
 *  33,5 → 40,9  Valider (photo ou quelques mots), pièces d'or, palier.
 *  40,9 → 45,9  La galerie ; pas de calendrier, pas de culpabilité.
 *  45,9 → 51,9  Les quatre thèmes, puis la musique jazz noir de l'app.
 *  51,9 → 61    « Transforme ton temps de scroll en créativité. » @scrollup_bot.
 *
 *  Les images de l'app viennent de ../build/viral/take (viral/capture-take.mjs)
 *  et de ../build/presentation (presentation/capture.mjs).
 */

import { ease, finalize, onFrame, prog, rng, seek, set, tw } from '../engine.js'
import { ICONS } from '../scrollup/icons.js'
import { DURATION, FPS, T, vo } from './cues.js'

const $ = (selector, root = document) => root.querySelector(selector)
const INK = '#151515'
const BUILD = '../build'

function add(parent, markup) {
  parent.insertAdjacentHTML('beforeend', markup)
  return parent.lastElementChild
}

const icon = (name, size, stroke = 2.4) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" stroke-width="${stroke}">${ICONS[name]}</svg>`

/** Visible pendant chacun des intervalles [début, fin]. */
function during(el, ...spans) {
  set(el, 0, { opacity: 0 })
  for (const [t0, t1] of spans) {
    set(el, t0, { opacity: 1 })
    if (t1 !== undefined) set(el, t1, { opacity: 0 })
  }
}

function slap(el, t, { from = 1.8, dur = 0.16, rot } = {}) {
  tw(el, t, 0.001, { opacity: [0, 1] })
  tw(el, t, dur, { scale: [from, 1] }, ease.back(1.3))
  if (rot) tw(el, t, dur + 0.1, { rot }, ease.out3)
}

function popIn(el, t, { dur = 0.4, rot, from = 0, s = 2.2 } = {}) {
  tw(el, t, 0.001, { opacity: [0, 1] })
  tw(el, t, dur, { scale: [from, 1] }, ease.back(s))
  if (rot) tw(el, t, dur, { rot }, ease.out3)
}

function ripple(parent, x, y, t, { size = 150, z = 30 } = {}) {
  for (let k = 0; k < 2; k++) {
    const r = add(parent, `<div class="abs pill" style="left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;border:7px solid var(--accent);box-sizing:border-box;z-index:${z}"></div>`)
    set(r, 0, { opacity: 0 })
    tw(r, t + k * 0.08, 0.001, { opacity: [0, 1] })
    tw(r, t + k * 0.08, 0.45, { scale: [0.2, 1.4] }, ease.out3)
    tw(r, t + k * 0.08 + 0.1, 0.3, { opacity: [1, 0] }, ease.linear)
  }
}

const coinSVG = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:block;overflow:visible"><circle cx="12" cy="12" r="10" fill="var(--warm)" stroke="var(--on-color)" stroke-width="2"/><path d="M8.6 10a4 4 0 0 1 3.2-2.6" fill="none" stroke="var(--on-color)" stroke-width="1.8" stroke-linecap="round"/></svg>`

const brandSVG = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 64 64" style="display:block;overflow:visible"><rect x="3" y="3" width="58" height="58" rx="16" fill="var(--accent)" stroke="var(--outline)" stroke-width="5"/><rect x="22" y="13" width="20" height="38" rx="5" fill="var(--surface-200)" stroke="var(--on-color)" stroke-width="4"/><path d="M13 51 51 13" stroke="var(--on-color)" stroke-width="5" stroke-linecap="round"/></svg>`

/** Une croche, cernée d'encre. */
const noteSVG = (size, color) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:block;overflow:visible"><path d="M9 17.5V5.5l10-2.5v12" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="3.4" fill="${color}" stroke="${INK}" stroke-width="2"/><circle cx="16.5" cy="15" r="3.4" fill="${color}" stroke="${INK}" stroke-width="2"/></svg>`

/** La main (index tendu), en sticker : le bout du doigt est à (88, 10). */
function handSVG(sleeve) {
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
    <rect x="60" y="14" width="36" height="42" rx="15" fill="#ffd9cf" stroke="${INK}" stroke-width="6"/>
  </svg>`
}

/** Confettis cernés d'encre, lancés depuis des points [x, y, direction]. */
function confetti(parent, t0, origins, count, seed) {
  const r = rng(seed)
  const COLORS = ['#ff6a4d', '#ffd23f', '#86c8ff', '#93e5b8', '#cdb8ff', '#fffdf7']
  const pieces = []
  for (let i = 0; i < count; i++) {
    const [ox, oy, dir] = origins[i % origins.length]
    const kind = i % 3
    const w = kind === 0 ? 30 : kind === 1 ? 24 : 42
    const h = kind === 0 ? 18 : kind === 1 ? 24 : 12
    const el = add(parent, `<div class="abs" style="left:${ox - w / 2}px;top:${oy - h / 2}px;width:${w}px;height:${h}px;background:${COLORS[i % COLORS.length]};border:5px solid ${INK};border-radius:${kind === 1 ? '50%' : '5px'};box-sizing:border-box;z-index:60;visibility:hidden"></div>`)
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
      p.el.style.visibility = ''
      p.el.style.opacity = String(Math.min(1, (1.9 - d) / 0.3))
      p.el.style.transform = `translate(${((p.vx / 2.2) * drag + 30 * Math.sin(d * 5)).toFixed(1)}px, ${((p.vy / 2.2) * drag + 500 * d * d).toFixed(1)}px) rotate(${(p.spin * d).toFixed(1)}deg) scaleY(${Math.cos(d * p.flip).toFixed(3)})`
    }
  })
}

/** Des pièces qui jaillissent d'un point et retombent. */
function coinBurst(parent, t0, count, [x, y], seed) {
  const r = rng(seed)
  const coins = []
  for (let i = 0; i < count; i++) {
    const size = 70 + r() * 40
    const el = add(parent, `<div class="abs" style="left:${x - size / 2}px;top:${y}px;z-index:55;visibility:hidden">${coinSVG(size)}</div>`)
    const a = -Math.PI / 2 + (r() - 0.5) * 2.2
    coins.push({ el, vx: Math.cos(a) * (700 + r() * 600), vy: Math.sin(a) * (1300 + r() * 500), spin: 8 + r() * 10, delay: i * 0.05 })
  }
  onFrame((t) => {
    for (const c of coins) {
      const d = t - t0 - c.delay
      if (d < 0 || d > 1.6) {
        c.el.style.visibility = 'hidden'
        continue
      }
      c.el.style.visibility = ''
      c.el.style.transform = `translate(${(c.vx * d).toFixed(1)}px, ${(c.vy * d + 1900 * d * d).toFixed(1)}px) scaleX(${Math.cos(d * c.spin).toFixed(3)})`
    }
  })
}

const SHAPES = {
  dot: (c) => `<svg viewBox="0 0 20 20" width="100%" height="100%" style="overflow:visible"><circle cx="10" cy="10" r="8" fill="${c}" stroke="var(--outline)" stroke-width="2"/></svg>`,
  star: (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%" style="overflow:visible"><path d="M12 2 C13 8 16 11 22 12 C16 13 13 16 12 22 C11 16 8 13 2 12 C8 11 11 8 12 2 Z" fill="${c}" stroke="var(--outline)" stroke-width="2" stroke-linejoin="round"/></svg>`,
  squiggle: () => `<svg viewBox="0 0 36 20" width="100%" height="100%" style="overflow:visible"><path d="M3 12 C 8 2, 12 2, 14 10 S 22 18, 25 10 S 31 2, 33 8" fill="none" stroke="var(--outline)" stroke-width="3" stroke-linecap="round"/></svg>`,
  plus: () => `<svg viewBox="0 0 20 20" width="100%" height="100%" style="overflow:visible"><path d="M10 3v14M3 10h14" fill="none" stroke="var(--outline)" stroke-width="3" stroke-linecap="round"/></svg>`,
}
function backdrop(parent, seed) {
  const r = rng(seed)
  const colors = ['var(--accent)', 'var(--sky)', 'var(--warm)', 'var(--good)', 'var(--lilac)']
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
    onFrame((t) => (el.style.transform = `translateY(${(-t * speed).toFixed(1)}px) rotate(${(9 * Math.sin(t * 1.3 + phase)).toFixed(2)}deg)`))
  }
}

/* ============================================================ la timeline */

/** Les tournages : marks.json de chacun (images, repères, taps). */
const takes = {}
const TAKE_DIRS = {
  main: `${BUILD}/viral/take`,
  onboarding: `${BUILD}/presentation/onboarding`,
  reroll: `${BUILD}/presentation/reroll`,
  settings: `${BUILD}/presentation/settings`,
  gallery: `${BUILD}/presentation/gallery`,
}
const STILLS = `${BUILD}/presentation/ecrans`
const decoding = new Set()

/** Change l'image d'un <img> (et attend son décodage avant la photo). */
function showImage(img, src) {
  if (img.dataset.src === src) return
  img.dataset.src = src
  img.src = src
  const promise = img.decode().catch(() => {})
  decoding.add(promise)
  promise.finally(() => decoding.delete(promise))
}

const SHAKES = [
  [T.months, 18],
  [T.reveal, 16],
  [T.name, 10],
  [T.tapCta, 8],
  [T.coins, 8],
  [T.party, 8],
  ...T.themes.map((t) => [t, 6]),
  [T.end, 16],
  [T.creativity + 0.38, 10],
  [T.final, 10],
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

/* ------------------------------------------------ le fond, selon le moment */

const PASSION_TINTS = ['#ffe1d8', '#ece3ff', '#dcf6e7', '#fff0bd']

function buildBackground() {
  const bg = $('#bg')
  const colors = [
    [0, '#fff3d1'],
    [T.screens, '#12131a'], // le fil, la nuit
    [T.reveal, '#fff3d1'],
    ...T.verbs.map((t, i) => [t, PASSION_TINTS[i]]),
    [T.backToTake, '#fff3d1'],
    [T.themes[0], '#121019'], // Pop Nuit
    [T.themes[1], '#ffffff'], // BD
    [T.themes[2], '#fff8ee'], // Memphis
    [T.themes[3], '#fff3d1'], // Pop
    [T.jazz, '#15121d'], // le jazz noir
    [T.end, '#fff3d1'],
  ]
  colors.forEach(([t, c]) => set(bg, t, { bg: c }))
  const deco = add(bg, `<div class="abs" style="inset:0"></div>`)
  backdrop(deco, 7)
  during(deco, [0, T.screens], [T.reveal, T.themes[0]], [T.themes[3], T.jazz], [T.end])
  const nightDots = add(bg, `<div class="abs" style="inset:0;background-image:radial-gradient(#2c2640 3.5px, transparent 4.3px);background-size:54px 54px"></div>`)
  during(nightDots, [T.themes[0], T.themes[1]])
  const bdDots = add(bg, `<div class="abs" style="inset:0;background-image:radial-gradient(#cdeffb 6px, transparent 7.3px);background-size:32px 32px"></div>`)
  during(bdDots, [T.themes[1], T.themes[2]])
  const memphis = add(bg, `<div class="abs" style="inset:0;background-image:radial-gradient(#e9ddc8 4.3px, transparent 5.1px);background-size:70px 70px"></div>`)
  during(memphis, [T.themes[2], T.themes[3]])

  // Le jazz noir : un projecteur, et la lumière d'un store sur le mur.
  const noir = add(bg, `<div class="abs" style="inset:0"></div>`)
  add(noir, `<div class="abs" style="inset:0;background:repeating-linear-gradient(118deg, rgba(255,226,170,0.075) 0 46px, transparent 46px 104px)"></div>`)
  add(noir, `<div class="abs" style="inset:0;background:radial-gradient(ellipse 58% 40% at 50% 62%, rgba(255,210,140,0.28), transparent 72%)"></div>`)
  set(noir, 0, { opacity: 0 })
  tw(noir, T.jazz, 0.5, { opacity: [0, 1] }, ease.out2)
  set(noir, T.end, { opacity: 0 })
}

/* ------------------------------------------------ 1 · l'accroche : le calendrier */

const MONTHS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function buildHook(stage) {
  const cal = add(stage, `<div class="abs" style="left:90px;top:700px;width:900px;height:980px;transform-origin:50% 85%"></div>`)
  during(cal, [0, T.screens + 0.5])
  MONTHS.forEach((name, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const eaten = i >= 10
    const tile = add(
      cal,
      `<div class="abs sk bg-paper" style="--sh:10;left:${col * 306}px;top:${row * 246}px;width:282px;height:222px;border-radius:30px;padding:20px 24px;box-sizing:border-box;overflow:hidden">
        <div class="display" style="font-size:46px">${name}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:16px">${Array.from({ length: 28 }, () => '<span style="height:14px;border-radius:5px;background:#e6d4a2"></span>').join('')}</div>
        ${eaten ? `<div class="eat abs" style="inset:0;background:#1b1d29;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:#cfcbe0"><div style="width:62px;height:100px;border:6px solid #cfcbe0;border-radius:16px;overflow:hidden;position:relative"><div class="lines" style="position:absolute;left:10px;right:10px;top:0">${Array.from({ length: 14 }, (_, k) => `<div style="height:7px;border-radius:4px;background:#cfcbe0;opacity:${k % 3 ? 0.5 : 0.9};margin:7px 0;width:${k % 2 ? 60 : 100}%"></div>`).join('')}</div></div><span class="display" style="font-size:40px;color:#f4f1fa">${name}</span></div>` : ''}
      </div>`,
    )
    const rot = [-3, 2, -1.5, 2.5, -2, 1, 2, -2.5, 1.5, -1, 3, -2][i]
    set(tile, 0, { rot })
    popIn(tile, 0.02 + i * 0.025, { from: 0.5, s: 2.4, dur: 0.3 })
    if (eaten) {
      const eat = $('.eat', tile)
      const at = T.months + (i - 10) * 0.12
      set(eat, 0, { opacity: 0 })
      tw(eat, at, 0.001, { opacity: [0, 1] })
      tw(eat, at, 0.25, { scale: [1.6, 1] }, ease.out3)
      tw(tile, at, 0.3, { scale: [1.12, 1], rot: [rot, rot * 3] }, ease.back(3))
      const lines = $('.lines', tile)
      onFrame((t) => (lines.style.transform = `translateY(${(-((t * 90) % 42)).toFixed(1)}px)`))
    }
  })
  // Le calendrier plonge vers le téléphone.
  tw(cal, T.screens + 0.15, 0.35, { scale: [1, 0.6], y: [0, 200], opacity: [1, 0] }, ease.in3)
}

/* ------------------------------------------------ 2 · « Voici Scroll-up » */

function buildReveal(stage) {
  const scene = add(stage, `<div class="abs" style="inset:0"></div>`)
  during(scene, [T.reveal, T.telegram + 0.1])
  const rays = add(scene, `<div class="abs pill" style="left:40px;top:330px;width:1000px;height:1000px;background:repeating-conic-gradient(var(--warm) 0deg 9deg, transparent 9deg 22.5deg);-webkit-mask-image:radial-gradient(closest-side, #000 30%, transparent 100%);mask-image:radial-gradient(closest-side, #000 30%, transparent 100%)"></div>`)
  tw(rays, T.reveal, 0.5, { opacity: [0, 1], scale: [0.3, 1] }, ease.out3)
  onFrame((t) => (rays.style.rotate = `${(t * 16).toFixed(1)}deg`))
  const logo = add(scene, `<div class="abs" style="left:380px;top:670px;width:320px;height:320px;filter:drop-shadow(18px 18px 0 ${INK})">${brandSVG(320)}</div>`)
  popIn(logo, T.reveal + 0.02, { rot: [-40, -6], s: 2.2, dur: 0.45 })
  const word = add(scene, `<div class="abs" style="left:0;right:0;top:1080px;display:flex;justify-content:center"><div class="sk bg-accent display on-color center" style="--sh:16;height:190px;padding:0 60px 16px;border-radius:var(--r-sm);font-size:150px">scroll-up</div></div>`)
  set(word.firstElementChild, 0, { rot: -3 })
  slap(word.firstElementChild, T.name, { from: 2.2, rot: [-12, -3] })
  // Tout s'envole quand le téléphone revient.
  tw(scene, T.telegram - 0.3, 0.4, { y: [0, -1300] }, ease.in3)
}

/* ------------------------------------------------ le téléphone */

const GLASS = { left: 298, top: 622, width: 484, height: 1047 }
const TAKE_SCALE = GLASS.width / 780
const Z = 1.16

/** La conversation avec le bot : /start, le message d'accueil, le bouton qui ouvre l'app. */
function buildChat(glass) {
  const chat = add(glass, `<div class="chat">
    <div class="bar">${icon('arrow-right', 30, 3).replace('<svg', '<svg style="transform:scaleX(-1)"')}<div style="width:66px;height:66px">${brandSVG(66)}</div><div class="who"><b>Scroll-up</b><small>bot</small></div></div>
    <div class="bubble me" style="top:176px">/start</div>
    <div class="bubble bot" style="top:250px">
      <p><b>Salut Léa !</b></p>
      <p>Ici, chaque envie de scroller peut devenir un petit moment créatif : dessin, écriture, musique, cinéma.</p>
      <p>La prochaine fois que ton pouce te démange, ouvre l’app et appuie sur « J’ai envie de scroller ».</p>
    </div>
    <div class="open">${icon('send', 26, 2.6)} Ouvrir Scroll-up</div>
    <div class="input">Message</div>
  </div>`)
  const bot = $('.bot', chat)
  const open = $('.open', chat)
  open.style.top = `${bot.offsetTop + bot.offsetHeight + 16}px`
  const me = $('.me', chat)
  const t0 = T.telegram
  popIn(me, t0 + 0.05, { from: 0.4, s: 2, dur: 0.3 })
  tw(bot, t0 + 0.45, 0.001, { opacity: [0, 1] })
  tw(bot, t0 + 0.45, 0.35, { y: [40, 0], scale: [0.85, 1] }, ease.back(1.8))
  popIn(open, t0 + 0.8, { from: 0.5, s: 2.4, dur: 0.35 })
  // Le bouton s'enfonce au tap.
  tw(open, T.openApp - 0.03, 0.08, { scale: [1, 0.94] }, ease.out2)
  tw(open, T.openApp + 0.05, 0.2, { scale: [0.94, 1] }, ease.back(2))
  // Position du tap, en pixels du tournage (comme les taps de marks.json).
  return {
    chat,
    tap: { x: (open.offsetLeft + open.offsetWidth / 2) / TAKE_SCALE, y: (open.offsetTop + open.offsetHeight * 0.6) / TAKE_SCALE },
  }
}

/** Le fil sans fin (l'accroche), dans l'écran. */
function buildFeed(glass) {
  const feed = add(glass, `<div class="abs" style="inset:0;background:#0e0f15"></div>`)
  const strip = add(feed, `<div class="abs" style="left:0;top:0;width:100%;filter:url(#mblur)"></div>`)
  const DULL = ['#2c2f40', '#353849', '#2a3244', '#3a3447', '#2e393e', '#37394d']
  const SHAPE = ['#4b4f67', '#575168', '#465a68', '#5b566f', '#4d5f60', '#555a73']
  const glyphs = [
    (c) => `<circle cx="50" cy="50" r="38" fill="${c}" stroke="#06070a" stroke-width="3.5"/>`,
    (c) => `<rect x="16" y="16" width="68" height="68" rx="12" fill="${c}" stroke="#06070a" stroke-width="3.5" transform="rotate(12 50 50)"/>`,
    (c) => `<path d="M50 10 L90 84 L10 84 Z" fill="${c}" stroke="#06070a" stroke-width="3.5" stroke-linejoin="round"/>`,
    (c) => `<circle cx="50" cy="56" r="32" fill="${c}" stroke="#06070a" stroke-width="3.5"/><path d="M24 36 L30 8 L46 28 Z M76 36 L70 8 L54 28 Z" fill="${c}" stroke="#06070a" stroke-width="3.5" stroke-linejoin="round"/>`,
    (c) => `<path d="M50 6 C54 36 64 46 94 50 C64 54 54 64 50 94 C46 64 36 54 6 50 C36 46 46 36 50 6 Z" fill="${c}" stroke="#06070a" stroke-width="3.5" stroke-linejoin="round"/>`,
  ]
  const H = GLASS.height
  for (let i = 0; i < 14; i++) {
    add(
      strip,
      `<div class="abs" style="left:0;top:${i * H}px;width:100%;height:${H}px;background:${DULL[i % DULL.length]};overflow:hidden">
        <svg class="abs" viewBox="0 0 100 100" style="left:60px;top:230px;width:340px;height:340px;overflow:visible">${glyphs[(i * 3) % glyphs.length](SHAPE[(i * 5) % SHAPE.length])}</svg>
        <div class="abs" style="right:22px;top:560px;display:flex;flex-direction:column;gap:34px;color:#b9b6c8">${icon('heart', 54, 2)}${icon('message-circle', 50, 2)}${icon('bookmark', 48, 2)}${icon('send', 48, 2)}</div>
        <div class="abs" style="left:30px;bottom:90px;width:320px"><div class="pill" style="width:62%;height:18px;background:#4f5268;margin-bottom:12px"></div><div class="pill" style="width:40%;height:18px;background:#4f5268"></div></div>
      </div>`,
    )
  }
  add(feed, `<div class="abs" style="left:0;right:0;top:0;height:90px;display:flex;align-items:center;justify-content:space-between;padding:12px 44px 0;color:#dcd9e8;font:700 28px var(--font-sans)"><span>23:47</span><span>▮▮▮</span></div>`)
  const feedPos = (t) => {
    let p = 0
    for (const s of T.scrolls) p += prog(t, s, 0.2, ease.out3)
    return p
  }
  const blur = $('#mblurNode')
  onFrame((t) => {
    if (t > T.reveal) return
    const tt = Math.min(t, T.pause)
    strip.style.transform = `translateY(${(-feedPos(tt) * H).toFixed(1)}px)`
    const v = ((feedPos(tt + 0.004) - feedPos(tt - 0.004)) / 0.008) * H
    blur.setAttribute('stdDeviation', `0 ${t > T.pause ? 0 : Math.min(60, Math.abs(v) / 160).toFixed(2)}`)
  })
  // Le break : le fil se fige, se décolore.
  tw(feed, T.pause, 0.25, { gray: [0, 1], bright: [1, 0.55] }, ease.out2)
  return feed
}

function buildDevice(stage) {
  const rig = add(stage, `<div class="abs" style="inset:0;transform-origin:540px 600px"></div>`)
  const device = add(rig, `<div class="device"><div class="glass"></div><div class="island"></div></div>`)
  const glass = $('.glass', device)
  during(rig, [T.screens - 0.25, T.reveal], [T.telegram - 0.3, T.end + 0.5])
  set(rig, 0, { scale: Z })
  tw(rig, T.screens - 0.25, 0.4, { y: [1400, 0], rot: [8, 0] }, ease.out3)
  set(rig, T.telegram - 0.3, { scale: Z })
  tw(rig, T.telegram - 0.3, 0.45, { y: [1400, 0], rot: [-8, 0] }, ease.out3)

  const feed = buildFeed(glass)
  during(feed, [0, T.reveal])
  const { chat, tap: chatTap } = buildChat(glass)
  during(chat, [T.telegram - 0.3, T.openApp + 0.5])

  /* -- l'app, qui s'ouvre par-dessus la conversation -- */
  const sheet = add(glass, `<div class="sheet"><img class="take" alt="" /></div>`)
  const img = $('img', sheet)
  during(sheet, [T.openApp + 0.02, T.end + 0.5])
  tw(sheet, T.openApp + 0.02, 0.38, { y: [GLASS.height, 0] }, ease.out3)

  // Le montage : quelle image de quel tournage à quel instant (les taps tombent sur les mots).
  const O = takes.onboarding
  const M = takes.main
  const R = takes.reroll
  const G = takes.gallery
  const S = takes.settings
  const oT = (i) => O.taps[i].frame
  const mT = (i) => M.taps[i].frame
  const rT = (i) => R.taps[i].frame
  const gT = (i) => G.taps[i].frame
  const sT = (i) => S.taps[i].frame
  const m = M.marks
  const cuts = [
    // L'arrivée : bienvenue, les passions.
    [T.openApp, T.start, 'onboarding', 2, oT(0)],
    [T.start, T.start + 0.42, 'onboarding', oT(0), O.marks.passions],
    [T.start + 0.42, T.picks[0], 'onboarding', O.marks.passions, oT(1)],
    [T.picks[0], T.picks[1], 'onboarding', oT(1), oT(2)],
    [T.picks[1], T.picks[2], 'onboarding', oT(2), oT(3)],
    [T.picks[2], T.go, 'onboarding', oT(3), oT(4)],
    [T.go, T.then, 'onboarding', oT(4), O.marks.home + 4],
    // Un seul bouton, trois taps.
    [T.then, T.tapCta, 'main', 0, mT(0)],
    [T.tapCta, T.tapCta + 0.72, 'main', mT(0), mT(0) + 28],
    [T.tapCta + 0.72, T.tapMood, 'main', m.mood, mT(1)],
    [T.tapMood, T.tapMood + 0.27, 'main', mT(1), mT(1) + 8],
    [T.tapMood + 0.27, T.tapTime, 'main', m.time, mT(2)],
    [T.tapTime, T.tapTime + 0.27, 'main', mT(2), mT(2) + 8],
    [T.tapTime + 0.27, T.tapPassion, 'main', mT(3) - 7, mT(3)],
    [T.tapPassion, T.activity, 'main', mT(3), m.activity],
    // L'activité, puis « Une autre idée ».
    [T.activity, T.minutes, 'main', m.activity, m.activity + 60],
    [T.minutes, T.reroll, 'reroll', rT(3) - 25, rT(3)],
    [T.reroll, T.verbs[0] + 0.3, 'reroll', rT(3), Math.min(R.frames - 1, rT(3) + 60)],
    // (les quatre activités défilent par-dessus : voir la bande plus bas)
    // Valider : la photo du dessin, enregistrée.
    [T.backToTake, T.tapValidate, 'main', mT(4) - 12, mT(4)],
    [T.tapValidate, T.tapValidate + 0.42, 'main', mT(4), m.proof + 10],
    [T.tapValidate + 0.42, T.photo, 'main', m.photo - 20, m.photo],
    [T.photo, T.tapSave, 'main', m.photo, mT(5)],
    [T.tapSave, T.done, 'main', mT(5), m.done],
    [T.done, T.tapGallery - 0.3, 'main', m.done, mT(6) - 8],
    // La galerie, puis le détail d'une création.
    [T.tapGallery - 0.3, T.tapGallery, 'main', mT(7) - 8, mT(7)],
    [T.tapGallery, T.tapGallery + 0.4, 'main', mT(7), m.gallery],
    [T.tapGallery + 0.4, T.noCalendar + 0.2, 'main', m.gallery, M.frames - 1],
    [T.noCalendar + 0.2, T.noCalendar + 0.45, 'gallery', gT(1) - 6, gT(1)],
    [T.noCalendar + 0.45, T.settings, 'gallery', gT(1), Math.min(G.frames - 1, gT(1) + 50)],
    // Les réglages : les quatre thèmes.
    [T.settings, T.tapSettings, 'settings', sT(2) - 8, sT(2)],
    [T.tapSettings, T.themes[0], 'settings', sT(2), sT(3)],
    [T.themes[0], T.themes[1], 'settings', sT(3), sT(4)],
    [T.themes[1], T.themes[2], 'settings', sT(4), sT(5)],
    [T.themes[2], T.themes[3], 'settings', sT(5), sT(6)],
    [T.themes[3], T.themes[3] + 0.24, 'settings', sT(6), sT(6) + 8],
    // La musique : on la remet d'un tap, le jazz entre.
    [T.themes[3] + 0.24, T.jazz, 'settings', sT(1) - 8, sT(1)],
    [T.jazz, T.end + 0.5, 'settings', sT(1), sT(1) + 18],
  ]
  const frameAt = (t) => {
    for (const [v0, v1, name, f0, f1] of cuts) {
      if (t >= v0 && t < v1) {
        const f = Math.round(f0 + ((t - v0) / (v1 - v0)) * (f1 - f0))
        return [name, Math.max(0, Math.min(takes[name].frames - 1, f))]
      }
    }
    return ['onboarding', 2]
  }
  onFrame((t) => {
    if (t < T.openApp - 0.1 || t > T.end + 0.5) return
    const [name, f] = frameAt(t)
    showImage(img, `${TAKE_DIRS[name]}/${String(f).padStart(4, '0')}.jpg`)
  })

  // « Ensuite » : un coup de fouet d'un écran à l'autre.
  tw(img, T.then - 0.1, 0.1, { x: [0, -260], blur: [0, 10] }, ease.in2)
  tw(img, T.then, 0.16, { x: [260, 0], blur: [10, 0] }, ease.out3)

  /* -- tu dessines, tu écris, tu écoutes, tu regardes : les quatre activités -- */
  const W = GLASS.width
  const strip = add(glass, `<div class="strip">${['dessin', 'ecriture', 'musique', 'cinema'].map((p, i) => `<img alt="" src="${STILLS}/${p}.jpg" style="left:${i * W}px" />`).join('')}</div>`)
  during(strip, [T.verbs[0] - 0.05, T.backToTake + 0.35])
  set(strip, 0, { x: W })
  T.verbs.forEach((t, i) => tw(strip, t - 0.04, 0.3, { x: [W * (1 - i), -W * i] }, ease.out3))
  tw(strip, T.backToTake, 0.3, { x: [-W * 3, -W * 4] }, ease.io3)

  /* -- le doigt -- */
  const hand = add(rig, `<div class="abs" style="left:0;top:0;width:280px;height:440px;transform-origin:88px 10px;z-index:40;filter:drop-shadow(12px 12px 0 rgba(21,21,21,0.9))">${handSVG('var(--lilac)')}</div>`)
  const at = (t, p) => ({ t, x: GLASS.left + p.x * TAKE_SCALE, y: GLASS.top + p.y * TAKE_SCALE })
  const TAPS = [
    at(T.openApp, chatTap),
    at(T.start, O.taps[0]),
    ...T.picks.map((t, i) => at(t, O.taps[1 + i])),
    at(T.go, O.taps[4]),
    at(T.tapCta, M.taps[0]),
    at(T.tapMood, M.taps[1]),
    at(T.tapTime, M.taps[2]),
    at(T.tapPassion, M.taps[3]),
    at(T.reroll, R.taps[3]),
    at(T.tapValidate, M.taps[4]),
    at(T.tapSave, M.taps[5]),
    at(T.tapGallery, M.taps[7]),
    at(T.noCalendar + 0.45, G.taps[1]),
    at(T.tapSettings, S.taps[2]),
    ...T.themes.map((t, i) => at(t, S.taps[3 + i])),
    at(T.jazz, S.taps[1]),
  ]
  TAPS.forEach((tap) => ripple(rig, tap.x, tap.y, tap.t))
  const GLIDE = 1.45 // deux taps plus proches que ça : le doigt glisse de l'un à l'autre
  const cta = TAPS.find((tap) => tap.t === T.tapCta)
  onFrame((t) => {
    let x
    let y
    let s = 1
    let rot = -14
    let visible = false
    const n = TAPS.findIndex((tap) => tap.t > t)
    const next = n === -1 ? null : TAPS[n]
    const prev = n === -1 ? TAPS.at(-1) : n > 0 ? TAPS[n - 1] : null
    if (t >= T.itch - 0.15 && t < T.tapCta) {
      // Le pouce qui démange : le doigt tremble au-dessus du bouton, puis appuie.
      const hover = 1 - prog(t, T.tapCta - 0.45, 0.4, ease.io3)
      const itch = hover * Math.max(0, 1 - prog(t, T.oneButton - 0.3, 0.3))
      x = cta.x + 150 * hover + 14 * itch * Math.sin(t * 61)
      y = cta.y + 240 * hover + 10 * itch * Math.cos(t * 47) + 700 * (1 - prog(t, T.itch - 0.15, 0.35, ease.out3))
      rot = -14 + 7 * itch * Math.sin(t * 38)
      visible = true
    } else if (prev && next && next.t - prev.t <= GLIDE) {
      const p = ease.io3(Math.min(1, Math.max(0, (t - prev.t - 0.12) / Math.max(0.1, next.t - prev.t - 0.2))))
      x = prev.x + (next.x - prev.x) * p
      y = prev.y + (next.y - prev.y) * p
      visible = true
    } else if (next && next.t - t < 0.55) {
      const p = prog(t, next.t - 0.55, 0.45, ease.out3)
      x = next.x + 240 * (1 - p)
      y = next.y + 800 * (1 - p)
      visible = true
    } else if (prev && t - prev.t < 0.55) {
      const p = prog(t, prev.t + 0.12, 0.43, ease.in3)
      x = prev.x + 200 * p
      y = prev.y + 900 * p
      visible = true
    }
    // L'appui : le doigt descend un peu.
    for (const tap of TAPS) {
      const d = t - tap.t
      if (d > -0.06 && d < 0.18) s = 1 - 0.08 * Math.sin((Math.PI * (d + 0.06)) / 0.24)
    }
    hand.style.visibility = visible ? '' : 'hidden'
    if (visible) hand.style.transform = `translate(${(x - 88).toFixed(1)}px, ${(y - 10).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${(s * 0.72).toFixed(3)})`
  })

  /* -- la caméra : de petits zooms sur les moments forts -- */
  const zoom = (t0, dur, from, to, easing = ease.io3) => tw(rig, t0, dur, { scale: [from[0] * Z, to[0] * Z], y: [from[1], to[1]] }, easing)
  zoom(T.pause, 1.9, [1, 0], [1.07, 0], ease.io2)
  zoom(T.itch, 1.3, [1, 0], [1.1, -70])
  zoom(T.tapCta + 0.1, 0.5, [1.1, -70], [1, 0])
  zoom(T.activity + 0.2, 1.4, [1, 0], [1.1, -40])
  zoom(T.minutes - 0.2, 0.5, [1.1, -40], [1, 0])
  zoom(T.done + 0.1, 1, [1, 0], [1.08, -30])
  zoom(T.tapGallery - 0.5, 0.45, [1.08, -30], [1, 0])
  T.themes.forEach((t) => tw(rig, t, 0.3, { rot: [-1.5, 0] }, ease.out3))
  zoom(T.jazz + 0.1, 2.6, [1, 0], [1.06, -20], ease.io2)
  // Les quatre activités : le téléphone penche d'un côté puis de l'autre.
  T.verbs.forEach((t, i) => tw(rig, t - 0.04, 0.35, { rot: [i % 2 ? -3 : 3, i % 2 ? 1.2 : -1.2] }, ease.out3))
  tw(rig, T.backToTake, 0.35, { rot: [1.2, 0] }, ease.io3)
  // La fin : le téléphone s'efface vers le bas.
  tw(rig, T.end, 0.45, { y: [-20, 1500], rot: [0, -12] }, ease.in3)

  // Pièces d'or et confettis.
  coinBurst(rig, T.coins, 14, [540, 900], 91)
  confetti(rig, T.party, [[GLASS.left + 20, GLASS.top + 300, 1], [GLASS.left + GLASS.width - 20, GLASS.top + 300, -1]], 50, 12)
}

/* ------------------------------------------------ les stickers autour du téléphone */

/** Un sticker (pastille colorée + pictogramme + mot), posé à (x, y). */
function badge(parent, { x, y, t0, t1, color, iconName, text, rot = -4, size = 60 }) {
  const el = add(
    parent,
    `<div class="abs sk pill on-color" style="--sh:10;left:${x}px;top:${y}px;display:flex;align-items:center;gap:14px;padding:12px 30px 14px 16px;background:var(--${color});font:800 ${size}px var(--font-display);letter-spacing:-0.03em;white-space:nowrap;z-index:45">
      <span class="pill center" style="width:${size * 1.25}px;height:${size * 1.25}px;background:var(--paper);border:6px solid var(--outline);box-sizing:border-box">${icon(iconName, size * 0.72, 2.6)}</span>${text}
    </div>`,
  )
  set(el, 0, { rot })
  popIn(el, t0, { rot: [rot * 4, rot], s: 2.4, dur: 0.38 })
  if (t1 !== undefined) tw(el, t1, 0.2, { scale: [1, 0], opacity: [1, 0] }, ease.in2)
  return el
}

function buildStickers(stage) {
  const layer = add(stage, `<div class="abs" style="inset:0;z-index:5"></div>`)
  // Les passions, à mesure qu'on les choisit : deux rangées sous le sous-titre.
  const out = T.then - 0.2
  badge(layer, { x: 70, y: 380, t0: T.picks[0], t1: out, color: 'accent', iconName: 'pencil', text: 'Dessin', rot: -4, size: 46 })
  badge(layer, { x: 560, y: 372, t0: T.picks[1], t1: out, color: 'lilac', iconName: 'feather', text: 'Écriture', rot: 3, size: 46 })
  badge(layer, { x: 110, y: 488, t0: T.picks[2], t1: out, color: 'good', iconName: 'headphones', text: 'Musique', rot: 3, size: 46 })
  badge(layer, { x: 590, y: 482, t0: T.cinema, t1: out, color: 'warm', iconName: 'clapperboard', text: 'Cinéma', rot: -3, size: 46 })
  // « Une autre idée » : on peut changer d'activité.
  badge(layer, { x: 560, y: 1470, t0: T.reroll + 0.1, t1: T.verbs[0] - 0.1, color: 'sky', iconName: 'shuffle', text: 'Une autre idée', rot: 4, size: 44 })
  // Les quatre verbes : un grand pictogramme, d'un côté puis de l'autre.
  const VERBS = [
    ['pencil', 'accent', 30, 900],
    ['feather', 'lilac', 780, 1060],
    ['headphones', 'good', 30, 1160],
    ['clapperboard', 'warm', 780, 900],
  ]
  VERBS.forEach(([name, color, x, y], i) => {
    const next = i < 3 ? T.verbs[i + 1] - 0.05 : T.backToTake
    const el = add(layer, `<div class="abs sk pill center" style="--sh:12;left:${x}px;top:${y}px;width:260px;height:260px;background:var(--${color});z-index:45">${icon(name, 150, 2.4)}</div>`)
    const rot = i % 2 ? 8 : -8
    set(el, 0, { rot })
    popIn(el, T.verbs[i], { rot: [rot * 5, rot], s: 2.2, dur: 0.4 })
    tw(el, next, 0.18, { scale: [1, 0], opacity: [1, 0] }, ease.in2)
  })
  // « … ou quelques mots » : la preuve écrite (celle d'une activité d'écriture), en sticker.
  const words = add(
    layer,
    `<div class="abs sk bg-paper" style="--sh:14;left:500px;top:1010px;width:540px;padding:74px 36px 34px;box-sizing:border-box;border-radius:34px;z-index:46;background-image:repeating-linear-gradient(transparent 0 55px, #e6d4a2 55px 58px);background-position:0 70px;font:600 40px/58px var(--font-sans);color:var(--ink)">La pluie tapait sur la vitre du bus. Pour une fois, j’ai regardé dehors.</div>`,
  )
  set(words, 0, { rot: 5 })
  popIn(words, T.words, { rot: [20, 5], s: 2, dur: 0.4 })
  tw(words, T.tapSave - 0.25, 0.2, { scale: [1, 0], opacity: [1, 0] }, ease.in2)
  const pen = badge(layer, { x: 530, y: 975, t0: T.words + 0.12, t1: T.tapSave - 0.25, color: 'lilac', iconName: 'pen-line', text: 'Écriture', rot: -3, size: 40 })
  pen.style.zIndex = '47'
  // Pas de calendrier : un calendrier barré.
  const cal = add(layer, `<div class="abs sk pill center" style="--sh:12;left:20px;top:1020px;width:230px;height:230px;background:var(--paper);z-index:45">${icon('calendar-x', 130, 2.2)}</div>`)
  set(cal, 0, { rot: -8 })
  popIn(cal, T.noCalendar, { rot: [-40, -8], s: 2.2, dur: 0.4 })
  tw(cal, T.settings - 0.2, 0.2, { scale: [1, 0], opacity: [1, 0] }, ease.in2)
  // Le jazz : des notes s'échappent du téléphone.
  const r = rng(33)
  const COLORS = ['var(--lilac)', 'var(--warm)', 'var(--sky)', 'var(--good)', 'var(--accent)']
  for (let i = 0; i < 14; i++) {
    const size = 70 + r() * 60
    const x0 = 240 + r() * 600
    const t0 = T.jazz + 0.05 + i * 0.2
    const drift = (r() - 0.5) * 260
    const el = add(layer, `<div class="abs" style="left:${x0}px;top:1300px;z-index:44;visibility:hidden">${noteSVG(size, COLORS[i % COLORS.length])}</div>`)
    const phase = r() * 6
    onFrame((t) => {
      const d = t - t0
      if (d < 0 || d > 2.6 || t > T.end) {
        el.style.visibility = 'hidden'
        return
      }
      el.style.visibility = ''
      el.style.opacity = String(Math.min(1, d / 0.2, (2.6 - d) / 0.6))
      el.style.transform = `translate(${(drift * d + 40 * Math.sin(d * 3 + phase)).toFixed(1)}px, ${(-420 * d).toFixed(1)}px) rotate(${(18 * Math.sin(d * 2.4 + phase)).toFixed(1)}deg) scale(${Math.min(1, d / 0.25).toFixed(3)})`
    })
  }
}

/* ------------------------------------------------ les sous-titres */

/**
 * Un sous-titre : `parts` = [texte, style, instant?] ; style : 'plain',
 * 'accent', 'warm', 'sky', 'good', 'lilac' (sticker coloré). Chaque morceau
 * peut avoir son propre instant (celui du mot dans la voix off).
 */
function caption(layer, t0, t1, parts, { top = 170, size = 110, rot = -2, dark = false, stagger = 0.06 } = {}) {
  const el = add(layer, `<div class="cap${dark ? ' dark' : ''}" style="top:${top}px"><span style="font-size:${size}px;max-width:980px"></span></div>`)
  const span = el.firstElementChild
  parts.forEach(([text, style, when], i) => {
    if (i > 0) span.append(' ')
    const pieces = []
    if (style && style !== 'plain') {
      const piece = document.createElement('span')
      piece.className = 'w box'
      piece.style.whiteSpace = 'normal'
      piece.style.maxWidth = '960px'
      piece.style.background = `var(--${style})`
      piece.style.color = 'var(--on-color)'
      piece.style.transform = `rotate(${rot}deg)`
      piece.textContent = text
      span.append(piece)
      pieces.push(piece)
    } else {
      text.split(' ').forEach((word, k) => {
        if (k > 0) span.append(' ')
        const piece = document.createElement('span')
        piece.className = 'w'
        piece.textContent = word
        span.append(piece)
        pieces.push(piece)
      })
    }
    pieces.forEach((piece, k) => {
      const at = (when ?? t0 + i * stagger) + k * 0.04
      tw(piece, at, 0.001, { opacity: [0, 1] })
      tw(piece, at, 0.22, { scale: [1.5, 1], y: [30, 0] }, ease.back(1.6))
    })
  })
  set(el, 0, { opacity: 0 })
  set(el, t0, { opacity: 1 })
  if (t1 !== undefined) set(el, t1, { opacity: 0 })
  return el
}

function buildCaptions() {
  const L = $('#captions')
  // 1 · l'accroche
  const hookOut = T.screens
  caption(L, T.months - 0.2, hookOut, [['2 MOIS', 'accent']], { top: 210, size: 210, rot: -3 })
  caption(L, T.perYear, hookOut, [['par an.', 'plain']], { top: 470, size: 100 })
  caption(L, T.screens, T.pause, [['C’est le temps qu’on passe', 'plain'], ['devant nos écrans', 'sky', vo(2.36)]], { top: 170, size: 88, dark: true })
  const source = add(L, `<div class="cap dark" style="top:470px"><span style="font:600 32px var(--font-sans);color:#b9b6c8">4 h par jour en moyenne · Baromètre du numérique 2025</span></div>`)
  set(source, 0, { opacity: 0 })
  tw(source, T.average, 0.3, { opacity: [0, 1], y: [20, 0] }, ease.out3)
  set(source, T.pause, { opacity: 0 })
  caption(L, T.question, T.reveal, [['Et si on en reprenait', 'plain'], ['un peu ?', 'warm', T.aLittle]], { top: 170, size: 104, dark: true })

  // 2 · Voici Scroll-up, dans Telegram
  caption(L, T.reveal, T.telegram - 0.3, [['Voici', 'plain']], { top: 330, size: 110 })
  caption(L, T.telegram, T.openApp + 0.3, [['Une app qui vit', 'plain'], ['dans', 'plain', vo(9.12)], ['Telegram', 'sky', T.telegramWord]], { top: 170, size: 96 })

  // 3 · les passions
  caption(L, vo(10.58), T.then - 0.1, [['Au départ,', 'plain']], { top: 120, size: 72 })
  caption(L, T.passions, T.then - 0.1, [['tu choisis tes passions', 'lilac']], { top: 220, size: 80, rot: 2 })

  // 4 · un seul bouton
  caption(L, T.then, T.itch, [['Ensuite…', 'plain']], { top: 200, size: 110 })
  caption(L, T.itch, T.oneButton, [['quand ton pouce', 'plain'], ['te démange', 'warm', vo(17.3)]], { top: 170, size: 104, rot: 3 })
  caption(L, T.oneButton - 0.5, T.mood, [['tu appuies sur', 'plain'], ['1 seul bouton.', 'accent', T.oneButton]], { top: 170, size: 104 })

  // 5 · trois petits taps (ils s'empilent)
  caption(L, T.mood, T.threeTaps, [['Ton humeur,', 'sky']], { top: 110, size: 92, rot: -2 })
  caption(L, T.time, T.threeTaps, [['ton temps,', 'warm']], { top: 250, size: 92, rot: 2 })
  caption(L, T.passion, T.threeTaps, [['ta passion.', 'lilac']], { top: 390, size: 92, rot: -2 })
  caption(L, T.threeTaps, T.activity + 1.3, [['3 petits taps.', 'accent']], { top: 220, size: 130, rot: -3 })

  // 6 · l'activité
  caption(L, vo(24.5), T.minutes, [['Et l’appli te propose', 'plain'], ['une activité créative', 'good', T.creative]], { top: 150, size: 90 })
  caption(L, T.minutes, T.verbs[0], [['de', 'plain'], ['5 à 30 minutes.', 'warm', vo(27.3)]], { top: 200, size: 110 })

  // 7 · créer, valider
  const VERBS = [['Tu dessines.', 'accent'], ['Tu écris.', 'lilac'], ['Tu écoutes.', 'good'], ['Tu regardes.', 'warm']]
  T.verbs.forEach((t, i) => caption(L, t, i < 3 ? T.verbs[i + 1] : T.backToTake, [VERBS[i]], { top: 220, size: 130, rot: i % 2 ? 3 : -3 }))
  caption(L, T.backToTake, T.photo, [['Tu valides,', 'good', vo(33.2)]], { top: 220, size: 130 })
  caption(L, T.photo, T.tapSave, [['avec une photo', 'sky']], { top: 170, size: 104 })
  caption(L, T.words, T.tapSave, [['ou quelques mots.', 'plain']], { top: 330, size: 92 })

  // 8 · pièces d'or, paliers
  caption(L, vo(36.28), T.milestone, [['1 minute =', 'plain'], ['1 pièce d’or', 'warm', T.coins]], { top: 190, size: 110 })
  caption(L, T.milestone, T.tapGallery - 0.3, [['Chaque palier', 'plain'], ['se fête !', 'lilac', T.party]], { top: 190, size: 110 })

  // 9 · la galerie
  caption(L, T.gallery, T.noCalendar, [['Ta galerie', 'sky'], ['garde toutes tes créations.', 'plain', vo(41.22)]], { top: 150, size: 92 })
  caption(L, T.noCalendar, T.settings, [['Pas de calendrier,', 'plain'], ['pas de culpabilité.', 'accent', T.noGuilt]], { top: 170, size: 100 })

  // 10 · les thèmes, puis le jazz
  caption(L, T.style, T.jazz, [['Choisis ton style', 'plain']], { top: 130, size: 96 })
  const names = [['Pop Nuit', 'lilac'], ['BD', 'warm'], ['Memphis', 'sky'], ['Pop', 'accent']]
  T.themes.forEach((t, i) => caption(L, t, i < 3 ? T.themes[i + 1] : T.jazz, [names[i]], { top: 280, size: 110, rot: i % 2 ? 3 : -3 }))
  caption(L, T.carry, T.end, [['Laisse-toi porter…', 'plain']], { top: 130, size: 100, dark: true })
  caption(L, T.jazzWord, T.end, [['un petit air de jazz', 'lilac']], { top: 270, size: 100, rot: -2, dark: true })
  caption(L, vo(50.5), T.end, [['(et il se coupe d’un tap)', 'plain']], { top: 460, size: 52, dark: true })

  // 11 · la fin : le slogan, mot à mot, sur la voix.
  const words = ['Transforme', 'ton', 'temps', 'de', 'scroll']
  caption(L, T.slogan[0], DURATION + 1, words.map((w, i) => [w, 'plain', T.slogan[i]]), { top: 730, size: 100 })
  caption(L, T.creativity, DURATION + 1, [['en', 'plain', T.creativity], ['créativité.', 'accent', T.creativity + 0.38]], { top: 960, size: 132, rot: -3 })
}

/* ------------------------------------------------ la signature */

function buildEnd(stage) {
  const end = add(stage, `<div class="abs" style="inset:0"></div>`)
  during(end, [T.end])
  const rays = add(end, `<div class="abs pill" style="left:140px;top:-40px;width:800px;height:800px;background:repeating-conic-gradient(var(--warm) 0deg 9deg, transparent 9deg 22.5deg);-webkit-mask-image:radial-gradient(closest-side, #000 30%, transparent 100%);mask-image:radial-gradient(closest-side, #000 30%, transparent 100%)"></div>`)
  tw(rays, T.end, 0.5, { opacity: [0, 1], scale: [0.3, 1] }, ease.out3)
  onFrame((t) => (rays.style.rotate = `${(t * 16).toFixed(1)}deg`))
  const logo = add(end, `<div class="abs" style="left:420px;top:190px;width:240px;height:240px;filter:drop-shadow(14px 14px 0 ${INK})">${brandSVG(240)}</div>`)
  popIn(logo, T.end + 0.02, { rot: [-40, -6], s: 2.2, dur: 0.45 })
  tw(logo, T.final, 0.4, { scale: [1.18, 1] }, ease.back(3))
  const word = add(end, `<div class="abs" style="left:0;right:0;top:470px;display:flex;justify-content:center"><div class="sk bg-accent display on-color center" style="--sh:14;height:160px;padding:0 54px 14px;border-radius:var(--r-sm);font-size:124px">scroll-up</div></div>`)
  set(word.firstElementChild, 0, { rot: -3 })
  slap(word.firstElementChild, T.end + 0.1, { from: 2, rot: [-12, -3] })
  const cta = add(
    end,
    `<div class="abs sk bg-sky pill on-color" style="--sh:14;left:110px;width:860px;top:1330px;height:140px;display:flex;align-items:center;justify-content:center;gap:24px;font:800 50px var(--font-sans);box-sizing:border-box">
      <span class="pill center" style="width:92px;height:92px;border:7px solid var(--outline);background:var(--paper);box-sizing:border-box">${icon('send', 48, 2.6)}</span>
      @scrollup_bot
    </div>`,
  )
  tw(cta, T.free, 0.001, { opacity: [0, 1] })
  tw(cta, T.free, 0.4, { y: [240, 0], rot: [4, 0] }, ease.back(1.8))
  tw(cta, T.final, 0.4, { scale: [1.1, 1] }, ease.back(3))
  const free = add(end, `<div class="cap" style="top:1515px"><span style="font:800 50px var(--font-sans);color:var(--ink)">Gratuit, dans Telegram.</span></div>`)
  set(free, 0, { opacity: 0 })
  tw(free, vo(56.42), 0.3, { opacity: [0, 1], y: [20, 0] }, ease.out3)
  confetti(end, T.final, [[0, 1900, 1], [1080, 1900, -1]], 60, 45)
}

/* ------------------------------------------------ effets communs */

function buildFx() {
  const fx = $('#fx')
  fx.style.pointerEvents = 'none'
  fx.style.zIndex = '20'
  // Éclairs blancs : la révélation, le retour de la musique.
  for (const t of [T.reveal, T.end]) {
    const flash = add(fx, `<div class="abs" style="inset:0;background:#fffdf7"></div>`)
    set(flash, 0, { opacity: 0 })
    tw(flash, t, 0.02, { opacity: [0, 0.9] })
    tw(flash, t + 0.03, 0.35, { opacity: [0.9, 0] }, ease.out2)
  }
  // Grain d'impression, qui « bout » 12 fois par seconde (plus fort pendant le jazz noir).
  const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
  const grain = add(fx, `<div class="abs" style="inset:0;background:#151515;opacity:0.06;-webkit-mask-image:${GRAIN};mask-image:${GRAIN};-webkit-mask-size:240px;mask-size:240px"></div>`)
  set(grain, 0, { opacity: 0.06 })
  tw(grain, T.jazz, 0.4, { opacity: [0.06, 0.16] })
  set(grain, T.end, { opacity: 0.06 })
  const r = rng(99)
  const offsets = Array.from({ length: 400 }, () => [Math.round(r() * 240), Math.round(r() * 240)])
  onFrame((t) => {
    const [x, y] = offsets[Math.floor(t * 12) % offsets.length]
    grain.style.webkitMaskPosition = `${x}px ${y}px`
    grain.style.maskPosition = `${x}px ${y}px`
  })
  // Vignette du film noir.
  const vignette = add(fx, `<div class="abs" style="inset:0;background:radial-gradient(ellipse 75% 60% at 50% 55%, transparent 55%, rgba(0,0,0,0.55) 100%)"></div>`)
  set(vignette, 0, { opacity: 0 })
  tw(vignette, T.jazz, 0.5, { opacity: [0, 1] })
  set(vignette, T.end, { opacity: 0 })
  const cam = $('#cam')
  onFrame((t) => {
    const [x, y] = shake(t)
    cam.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`
  })
}

/* ------------------------------------------------ démarrage */

async function start() {
  const load = async (name, file) => (takes[name] = await (await fetch(file)).json())
  await Promise.all([
    load('main', `${BUILD}/viral/marks.json`),
    ...['onboarding', 'reroll', 'settings', 'gallery'].map((name) => load(name, `${TAKE_DIRS[name]}/marks.json`)),
  ])
  await Promise.all(['800 100px "Bricolage Grotesque Variable"', '800 100px "Rethink Sans Variable"', '600 100px "Rethink Sans Variable"'].map((f) => document.fonts.load(f, 'Aàéèêç’«»·?0123456789')))
  await document.fonts.ready
  const stage = $('#stage2')
  $('#bg').style.zIndex = '1'
  stage.style.zIndex = '2'
  $('#captions').style.zIndex = '3'
  buildBackground()
  buildHook(stage)
  buildReveal(stage)
  buildDevice(stage)
  buildStickers(stage)
  buildEnd(stage)
  buildCaptions()
  buildFx()
  finalize()
  seek(0)
}

const ready = start()

/** Affiche l'instant t, et attend que les images du tournage soient prêtes. */
async function seekAndWait(t) {
  seek(t)
  await Promise.all([...decoding])
}

window.__promo = { ready, seek: seekAndWait, duration: DURATION, fps: FPS }

if (!new URLSearchParams(location.search).has('render')) {
  document.body.classList.add('preview')
  ready.then(() => {
    const scrub = $('#scrub')
    const clock = $('#clock')
    const play = $('#play')
    const audio = new Audio(`${BUILD}/presentation/audio.wav`)
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
      } else audio.pause()
    })
    scrub.addEventListener('input', () => {
      playing = false
      audio.pause()
      play.textContent = 'Lecture'
      show(Number(scrub.value))
    })
  })
}
