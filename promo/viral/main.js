/**
 * ============================================================================
 *  Vidéo virale Scroll-up — 25 s, format vertical 1080 × 1920, sans voix off
 * ============================================================================
 *
 *  0 → 3,7 s    L'accroche : « On passe 2 MOIS par an devant nos écrans. »
 *               (4 h par jour en moyenne : Baromètre du numérique 2025).
 *  3,7 → 7,7 s  Le fil sans fin, poussé par un doigt, sur la batterie.
 *               « Et si ton pouce faisait autre chose ? »
 *  7,7 → 9,7 s  Le break de la musique : tout se fige.
 *  9,7 → 21 s   La vraie app, filmée (capture-take.mjs), dans le même
 *               téléphone : un bouton, trois taps, une activité, un dessin,
 *               des pièces d'or, un palier.
 *  21 → 23 s    Les quatre thèmes, un par temps.
 *  23 → 25,8 s  « 2 mois par an. Reprends-en un peu. » @scrollup_bot.
 *
 *  Les images de l'app viennent de ../build/viral (voir capture-take.mjs).
 */

import { ease, finalize, onFrame, prog, rng, seek, set, tw } from '../engine.js'
import { ICONS } from '../scrollup/icons.js'
import { DURATION, FPS, T } from './cues.js'

const $ = (selector, root = document) => root.querySelector(selector)
const INK = '#151515'
const MEDIA = '../build/viral'

function add(parent, markup) {
  parent.insertAdjacentHTML('beforeend', markup)
  return parent.lastElementChild
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

const icon = (name, size, stroke = 2.4) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" stroke-width="${stroke}">${ICONS[name]}</svg>`

function between(el, t0, t1) {
  set(el, 0, { opacity: 0 })
  set(el, t0, { opacity: 1 })
  if (t1 !== undefined) set(el, t1, { opacity: 0 })
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

const sparkleSVG = (size, color) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:block;overflow:visible"><path d="M12 2 C13 8 16 11 22 12 C16 13 13 16 12 22 C11 16 8 13 2 12 C8 11 11 8 12 2 Z" fill="${color}" stroke="var(--outline)" stroke-width="1.6" stroke-linejoin="round"/></svg>`

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

let take // marks.json de capture-take.mjs
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
  [T.stat, 20],
  [T.drums, 10],
  [T.reveal, 16],
  [T.drop, 10],
  [T.done, 8],
  ...T.themes.map((t) => [t, 7]),
  [T.end, 12],
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

function buildBackground() {
  const bg = $('#bg')
  // Pop le plus souvent ; la nuit pendant le fil ; les fonds des thèmes à la fin.
  const colors = [
    [0, '#fff3d1'],
    [T.drums, '#12131a'],
    [T.reveal, '#fff3d1'],
    [T.themes[1], '#121019'],
    [T.themes[2], '#ffffff'],
    [T.themes[3], '#fff8ee'],
    [T.end, '#fff3d1'],
  ]
  colors.forEach(([t, c], i) => (i === 0 ? set(bg, 0, { bg: c }) : set(bg, t, { bg: c })))
  const deco = add(bg, `<div class="abs" style="inset:0"></div>`)
  backdrop(deco, 7)
  set(deco, 0, { opacity: 1 })
  set(deco, T.drums, { opacity: 0 })
  set(deco, T.reveal, { opacity: 1 })
  set(deco, T.themes[1], { opacity: 0 })
  set(deco, T.end, { opacity: 1 })
  // Trame de points de la BD.
  const dots = add(bg, `<div class="abs" style="inset:0;background-image:radial-gradient(#cdeffb 6px, transparent 7.3px);background-size:32px 32px"></div>`)
  between(dots, T.themes[2], T.themes[3])
  const nightDots = add(bg, `<div class="abs" style="inset:0;background-image:radial-gradient(#2c2640 3.5px, transparent 4.3px);background-size:54px 54px"></div>`)
  between(nightDots, T.themes[1], T.themes[2])
  const memphis = add(bg, `<div class="abs" style="inset:0;background-image:radial-gradient(#e9ddc8 4.3px, transparent 5.1px);background-size:70px 70px"></div>`)
  between(memphis, T.themes[3], T.end)
}

/* ------------------------------------------------ 1 · l'accroche : le calendrier */

const MONTHS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function buildHook(stage) {
  const cal = add(stage, `<div class="abs" style="left:90px;top:700px;width:900px;height:980px;transform-origin:50% 85%"></div>`)
  between(cal, 0, T.drums)
  MONTHS.forEach((name, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const eaten = i >= 10
    const tile = add(
      cal,
      `<div class="abs sk bg-paper" style="--sh:10;left:${col * 306}px;top:${row * 246}px;width:282px;height:222px;border-radius:30px;padding:20px 24px;box-sizing:border-box;overflow:hidden">
        <div class="display" style="font-size:46px">${name}</div>
        <div class="days" style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:16px">${Array.from({ length: 28 }, () => '<span style="height:14px;border-radius:5px;background:#e6d4a2"></span>').join('')}</div>
        ${eaten ? `<div class="eat abs" style="inset:0;background:#1b1d29;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:#cfcbe0"><div style="width:62px;height:100px;border:6px solid #cfcbe0;border-radius:16px;overflow:hidden;position:relative"><div class="lines" style="position:absolute;left:10px;right:10px;top:0">${Array.from({ length: 14 }, (_, k) => `<div style="height:7px;border-radius:4px;background:#cfcbe0;opacity:${k % 3 ? 0.5 : 0.9};margin:7px 0;width:${k % 2 ? 60 : 100}%"></div>`).join('')}</div></div><span class="display" style="font-size:40px;color:#f4f1fa">${name}</span></div>` : ''}
      </div>`,
    )
    const rot = [-3, 2, -1.5, 2.5, -2, 1, 2, -2.5, 1.5, -1, 3, -2][i]
    set(tile, 0, { rot })
    popIn(tile, 0.02 + i * 0.025, { from: 0.5, s: 2.4, dur: 0.3 })
    if (eaten) {
      const eat = $('.eat', tile)
      set(eat, 0, { opacity: 0 })
      tw(eat, T.stat + (i - 10) * 0.12, 0.001, { opacity: [0, 1] })
      tw(eat, T.stat + (i - 10) * 0.12, 0.25, { scale: [1.6, 1] }, ease.out3)
      tw(tile, T.stat + (i - 10) * 0.12, 0.3, { scale: [1.12, 1], rot: [rot, rot * 3] }, ease.back(3))
      const lines = $('.lines', tile)
      onFrame((t) => (lines.style.transform = `translateY(${(-((t * 90) % 42)).toFixed(1)}px)`))
    }
  })
  // Le calendrier plonge vers le téléphone.
  tw(cal, T.drums - 0.35, 0.35, { scale: [1, 0.6], y: [0, 200], opacity: [1, 0] }, ease.in3)
}

/* ------------------------------------------------ le téléphone */

const GLASS = { left: 298, top: 622, width: 484, height: 1047 }
const TAKE_SCALE = GLASS.width / 780

function buildDevice(stage) {
  const rig = add(stage, `<div class="abs" style="inset:0;transform-origin:540px 600px"></div>`)
  const device = add(rig, `<div class="device"><div class="glass"></div><div class="island"></div></div>`)
  const glass = $('.glass', device)
  between(rig, T.drums - 0.3, T.end + 0.7)
  tw(rig, T.drums - 0.3, 0.4, { y: [1400, 0], rot: [8, 0] }, ease.out3)

  /* -- le fil sans fin (3,7 → 9,7 s) -- */
  const feed = add(glass, `<div class="abs" style="inset:0;background:#0e0f15"></div>`)
  between(feed, 0, T.reveal)
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
  for (let i = 0; i < 22; i++) {
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
  // Un post par temps, puis de plus en plus vite ; tout se fige sur le break.
  const swipes = [3.73, 4.23, 4.73, 5.23, 5.73, 5.98, 6.23, 6.48, 6.73, 6.98, 7.23, 7.36, 7.48, 7.6]
  const feedPos = (t) => {
    let p = 0
    for (const s of swipes) p += prog(t, s, 0.2, ease.out3)
    return p
  }
  const blur = $('#mblurNode')
  onFrame((t) => {
    if (t < T.drums - 0.3 || t > T.reveal) return
    const tt = Math.min(t, T.pause)
    strip.style.transform = `translateY(${(-feedPos(tt) * H).toFixed(1)}px)`
    const v = ((feedPos(tt + 0.004) - feedPos(tt - 0.004)) / 0.008) * H
    blur.setAttribute('stdDeviation', `0 ${t > T.pause ? 0 : Math.min(60, Math.abs(v) / 160).toFixed(2)}`)
  })
  // Le break : le fil se fige, se décolore.
  tw(feed, T.pause, 0.25, { gray: [0, 1], bright: [1, 0.55] }, ease.out2)

  /* -- la vraie app (9,7 → 21,2 s) -- */
  const img = add(glass, `<img class="take" alt="" />`)
  between(img, T.reveal - 0.02, T.themes[0])
  const flash = add(glass, `<div class="abs" style="inset:0;background:#fffdf7"></div>`)
  set(flash, 0, { opacity: 0 })
  tw(flash, T.reveal, 0.02, { opacity: [0, 1] })
  tw(flash, T.reveal + 0.04, 0.3, { opacity: [1, 0] }, ease.out2)

  // Le montage : quelle image du tournage à quel instant (les taps tombent sur les temps).
  const m = take.marks
  const tapAt = (i) => take.taps[i].frame
  const cuts = [
    [T.reveal, T.tapCta, tapAt(0) - 30, tapAt(0)],
    [T.tapCta, T.tapCta + 0.5, tapAt(0), tapAt(0) + 15],
    [T.tapCta + 0.5, T.tapMood, tapAt(1) - 15, tapAt(1)],
    [T.tapMood, T.tapMood + 0.27, tapAt(1), tapAt(1) + 8],
    [T.tapMood + 0.27, T.tapTime, tapAt(2) - 7, tapAt(2)],
    [T.tapTime, T.tapTime + 0.27, tapAt(2), tapAt(2) + 8],
    [T.tapTime + 0.27, T.tapPassion, tapAt(3) - 7, tapAt(3)],
    [T.tapPassion, T.activity, tapAt(3), tapAt(3) + 8],
    [T.activity, T.tapValidate, m.activity - 8, tapAt(4)],
    [T.tapValidate, T.photo, tapAt(4), m.proof + 5],
    [T.photo, T.tapSave, m.photo - 3, tapAt(5)],
    [T.tapSave, T.done, tapAt(5), tapAt(5) + 8],
    [T.done, T.tapRate, m.done, tapAt(6) - 8],
    [T.tapRate, T.tapGallery, tapAt(6), tapAt(6) + 14],
    [T.tapGallery, T.themes[0], tapAt(7), m.gallery + 12],
  ]
  const frameAt = (t) => {
    for (const [v0, v1, f0, f1] of cuts) if (t >= v0 && t < v1) return Math.round(f0 + ((t - v0) / (v1 - v0)) * (f1 - f0))
    return cuts[0][2]
  }
  onFrame((t) => {
    if (t < T.reveal - 0.05 || t >= T.themes[0]) return
    const f = Math.max(0, Math.min(take.frames - 1, frameAt(t)))
    showImage(img, `${MEDIA}/take/${String(f).padStart(4, '0')}.jpg`)
  })

  /* -- les thèmes (21,2 → 23,2 s) -- */
  const themed = add(glass, `<img class="take" alt="" />`)
  between(themed, T.themes[0], T.end + 0.7)
  const THEMES = ['pop', 'nuit', 'bd', 'memphis']
  onFrame((t) => {
    if (t < T.themes[0] || t > T.end + 0.7) return
    const k = t < T.themes[1] ? 0 : t < T.themes[2] ? 1 : t < T.themes[3] ? 2 : 3
    showImage(themed, `${MEDIA}/themes/gallery-${THEMES[k]}.jpg`)
  })
  T.themes.forEach((t) => tw(rig, t, 0.3, { scale: [1.22, 1.16], rot: [-1.5, 0] }, ease.out3))

  /* -- le doigt -- */
  const hand = add(rig, `<div class="abs" style="left:0;top:0;width:280px;height:440px;transform-origin:88px 10px;z-index:40;filter:drop-shadow(12px 12px 0 rgba(21,21,21,0.9))">${handSVG('var(--lilac)')}</div>`)
  const TAPS = [T.tapCta, T.tapMood, T.tapTime, T.tapPassion, T.tapValidate, T.tapSave, T.tapRate, T.tapGallery]
  const tapPos = TAPS.map((t, i) => [GLASS.left + take.taps[i].x * TAKE_SCALE, GLASS.top + take.taps[i].y * TAKE_SCALE])
  TAPS.forEach((t, i) => ripple(rig, tapPos[i][0], tapPos[i][1], t))
  // Pendant le fil : le doigt pousse sur chaque temps.
  const flickBase = [GLASS.left + 300, GLASS.top + 820]
  onFrame((t) => {
    let x
    let y
    let s = 1.05
    let visible = true
    const app = t >= T.reveal
    if (t >= T.drums - 0.3 && t < T.reveal) {
      const tt = Math.min(t, T.pause)
      let dy = 0
      for (const sw of swipes) dy -= 300 * (prog(tt, sw - 0.1, 0.12, ease.io2) - prog(tt, sw + 0.03, 0.14, ease.io2))
      ;[x, y] = [flickBase[0], flickBase[1] + dy]
      if (t < T.drums) y += 700 * (1 - prog(t, T.drums - 0.3, 0.3, ease.out3))
    } else if (t >= T.reveal && t < T.themes[0]) {
      // D'un tap au suivant, le doigt glisse ; il appuie pile sur le temps.
      let i = TAPS.findIndex((tap) => tap > t)
      if (i === -1) i = TAPS.length
      const prev = tapPos[Math.max(0, i - 1)]
      const next = tapPos[Math.min(TAPS.length - 1, i)]
      const t0 = i === 0 ? T.reveal : TAPS[i - 1]
      const t1 = i === TAPS.length ? T.themes[0] : TAPS[i]
      const p = i === 0 ? 1 : ease.io3(Math.min(1, Math.max(0, (t - t0 - 0.12) / Math.max(0.1, t1 - t0 - 0.2))))
      x = prev[0] + (next[0] - prev[0]) * p
      y = prev[1] + (next[1] - prev[1]) * p
      if (i === 0) y += 600 * (1 - prog(t, T.reveal + 0.2, 0.5, ease.out3))
      // L'appui : le doigt descend un peu.
      for (const tap of TAPS) {
        const d = t - tap
        if (d > -0.06 && d < 0.18) s = 1.05 - 0.08 * Math.sin((Math.PI * (d + 0.06)) / 0.24)
      }
      if (t > TAPS.at(-1) + 0.1) y += 900 * prog(t, TAPS.at(-1) + 0.1, 0.4, ease.in3)
    } else visible = false
    hand.style.visibility = visible ? '' : 'hidden'
    // Sur la vraie app, le doigt se fait plus petit pour laisser voir l'écran.
    if (visible) hand.style.transform = `translate(${(x - 88).toFixed(1)}px, ${(y - 10).toFixed(1)}px) rotate(-14deg) scale(${(s * (app ? 0.72 : 1)).toFixed(3)})`
  })

  /* -- la caméra : de petits zooms sur les moments forts -- */
  // (le téléphone est agrandi de 16 % par défaut ; les zooms partent de là)
  const Z = 1.16
  set(rig, 0, { scale: Z })
  tw(rig, T.pause, 2.0, { scale: [Z, Z * 1.07] }, ease.io2)
  tw(rig, T.reveal, 0.35, { scale: [Z * 1.07, Z] }, ease.out3)
  tw(rig, T.activity + 0.2, 0.8, { scale: [Z, Z * 1.1], y: [0, -40] }, ease.io3)
  tw(rig, T.tapValidate - 0.2, 0.4, { scale: [Z * 1.1, Z], y: [-40, 0] }, ease.io3)
  tw(rig, T.done + 0.1, 0.8, { scale: [Z, Z * 1.08], y: [0, -30] }, ease.io3)
  tw(rig, T.tapRate - 0.3, 0.4, { scale: [Z * 1.08, Z], y: [-30, 0] }, ease.io3)
  // La fin : le téléphone s'efface vers le bas.
  tw(rig, T.end, 0.45, { y: [0, 1500], rot: [0, -12] }, ease.in3)

  // Les pièces d'or jaillissent autour du téléphone, à la confirmation.
  confetti(rig, T.done + 0.35, [[GLASS.left + 20, GLASS.top + 300, 1], [GLASS.left + GLASS.width - 20, GLASS.top + 300, -1]], 50, 12)
  coinBurst(rig, T.coins, 14)
}

/** Des pièces qui jaillissent du téléphone et retombent. */
function coinBurst(parent, t0, count) {
  const r = rng(91)
  const coins = []
  for (let i = 0; i < count; i++) {
    const size = 70 + r() * 40
    const el = add(parent, `<div class="abs" style="left:${540 - size / 2}px;top:${900}px;z-index:55;visibility:hidden">${coinSVG(size)}</div>`)
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

/* ------------------------------------------------ les sous-titres */

/**
 * Un sous-titre : `parts` = [texte, style] ; style : 'plain', 'accent',
 * 'warm', 'sky', 'good', 'lilac' (sticker coloré). Il reste jusqu'au suivant.
 */
function caption(layer, t0, t1, parts, { top = 170, size = 110, rot = -2, dark = false, stagger = 0.06 } = {}) {
  const el = add(layer, `<div class="cap${dark ? ' dark' : ''}" style="top:${top}px"><span style="font-size:${size}px;max-width:960px"></span></div>`)
  const span = el.firstElementChild
  parts.forEach(([text, style], i) => {
    if (i > 0) span.append(' ')
    // Texte simple : un mot par élément (le sous-titre peut revenir à la ligne).
    // Sticker : un bloc qui revient à la ligne à l'intérieur de son cadre.
    const pieces = []
    if (style && style !== 'plain') {
      const piece = document.createElement('span')
      piece.className = 'w box'
      piece.style.whiteSpace = 'normal'
      piece.style.maxWidth = '940px'
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
      const at = t0 + i * stagger + k * 0.03
      tw(piece, at, 0.001, { opacity: [0, 1] })
      tw(piece, at, 0.22, { scale: [1.5, 1], y: [30, 0] }, ease.back(1.6))
    })
  })
  between(el, t0, t1)
  return el
}

function buildCaptions() {
  const L = $('#captions')
  // 1 · l'accroche
  caption(L, T.hook, T.drums - 0.3, [['On passe', 'plain']], { top: 140, size: 96 })
  const big = caption(L, T.stat, T.drums - 0.3, [['2 MOIS', 'accent']], { top: 250, size: 210, rot: -3 })
  tw(big, T.stat, 0.001, { opacity: [0, 1] })
  caption(L, T.perYear, T.drums - 0.3, [['par an', 'plain']], { top: 500, size: 92 })
  caption(L, T.screens, T.drums - 0.3, [['devant nos écrans.', 'plain']], { top: 604, size: 64 })
  const source = add(L, `<div class="cap" style="top:1720px"><span class="small-print">4 h par jour en moyenne · Baromètre du numérique 2025 (CREDOC)</span></div>`)
  between(source, T.source, T.drums - 0.3)
  tw(source, T.source, 0.3, { opacity: [0, 1], y: [20, 0] }, ease.out3)

  // 2 · le fil sans fin
  T.scrolls.forEach((t, i) => {
    const next = i < T.scrolls.length - 1 ? T.scrolls[i + 1] : T.encore
    caption(L, t, next, [['Scroll.', i % 2 ? 'sky' : 'plain']], { top: 190 + (i % 2) * 20, size: 130 + i * 12, rot: i % 2 ? 3 : -3, dark: true })
  })
  caption(L, T.encore, T.encore2, [['Encore un.', 'plain']], { top: 200, size: 120, dark: true })
  caption(L, T.encore2, T.question, [['Et encore un.', 'plain']], { top: 200, size: 120, dark: true })
  caption(L, T.question, T.pause, [['Et si ton pouce', 'plain'], ['faisait autre chose', 'warm'], ['?', 'plain']], { top: 150, size: 96, dark: true, stagger: 0.5 })

  // 3 · le break
  caption(L, T.pauseText, T.reveal, [['Et si chaque envie de scroller…', 'plain']], { top: 150, size: 82, dark: true })
  caption(L, T.pauseText2, T.reveal, [['devenait 5 min de création', 'good'], ['?', 'plain']], { top: 340, size: 82, dark: true, stagger: 0.3 })

  // 4 · la vraie app
  const logo = add(L, `<div class="cap" style="top:120px"><span class="sk bg-accent display on-color" style="--sh:14;font-size:130px;padding:6px 46px 22px;border-radius:30px">scroll-up</span></div>`)
  between(logo, T.reveal, T.tapCta)
  slap(logo.firstElementChild, T.reveal, { from: 2.2, rot: [-12, -3] })
  caption(L, T.tagline, T.tapCta, [['L’app qui transforme ton envie de scroller.', 'plain']], { top: 330, size: 60 })
  caption(L, T.tapCta, T.tapMood, [['1 bouton.', 'accent']], { top: 200, size: 140 })
  caption(L, T.tapMood, T.tapTime, [['Ton humeur.', 'sky']], { top: 200, size: 120, rot: 2 })
  caption(L, T.tapTime, T.tapPassion, [['Ton temps.', 'warm']], { top: 200, size: 120, rot: -2 })
  caption(L, T.tapPassion, T.activity, [['Ta passion.', 'lilac']], { top: 200, size: 120, rot: 2 })
  caption(L, T.idea, T.drop, [['Et hop : une idée créative', 'plain'], ['pour toi.', 'good']], { top: 150, size: 84, stagger: 0.35 })
  caption(L, T.drop, T.tapValidate, [['5 à 30 minutes.', 'warm'], ['Pas plus.', 'plain']], { top: 170, size: 96, stagger: 0.4 })
  caption(L, T.tapValidate, T.tapSave, [['Tu crées.', 'sky']], { top: 200, size: 130 })
  caption(L, T.tapSave, T.done, [['Tu valides.', 'good']], { top: 200, size: 130 })
  caption(L, T.coins, T.rule, [['+15 pièces d’or', 'warm']], { top: 200, size: 110 })
  caption(L, T.rule, T.milestone, [['1 minute = 1 pièce.', 'plain']], { top: 210, size: 92 })
  caption(L, T.milestone, T.noGuilt, [['Des paliers à fêter.', 'lilac']], { top: 200, size: 100 })
  caption(L, T.noGuilt, T.tapGallery, [['Zéro culpabilité.', 'accent']], { top: 200, size: 110 })
  caption(L, T.tapGallery, T.themes[0], [['Ta galerie grandit.', 'plain']], { top: 210, size: 100 })

  // 5 · les thèmes
  const names = [['Pop', 'accent'], ['Pop Nuit', 'lilac'], ['BD', 'warm'], ['Memphis', 'sky']]
  caption(L, T.themes[0], T.end, [['4 styles', 'plain']], { top: 150, size: 100, dark: false })
  T.themes.forEach((t, i) => {
    const next = i < 3 ? T.themes[i + 1] : T.end
    caption(L, t, next, [names[i]], { top: 290, size: 90, rot: i % 2 ? 3 : -3 })
  })

  // 6 · la fin
  caption(L, T.end + 0.1, DURATION + 1, [['2 mois par an…', 'plain']], { top: 230, size: 96 })
  caption(L, T.endLine, DURATION + 1, [['Reprends-en', 'plain'], ['un peu.', 'accent']], { top: 360, size: 116, stagger: 0.25 })
}

/* ------------------------------------------------ la signature */

function buildEnd(stage) {
  const end = add(stage, `<div class="abs" style="inset:0"></div>`)
  between(end, T.end + 0.25, DURATION + 1)
  const rays = add(end, `<div class="abs pill" style="left:40px;top:640px;width:1000px;height:1000px;background:repeating-conic-gradient(var(--warm) 0deg 9deg, transparent 9deg 22.5deg);-webkit-mask-image:radial-gradient(closest-side, #000 30%, transparent 100%);mask-image:radial-gradient(closest-side, #000 30%, transparent 100%)"></div>`)
  tw(rays, T.end + 0.25, 0.5, { opacity: [0, 1], scale: [0.3, 1] }, ease.out3)
  onFrame((t) => (rays.style.rotate = `${(t * 16).toFixed(1)}deg`))
  const logo = add(end, `<div class="abs" style="left:400px;top:870px;width:280px;height:280px;filter:drop-shadow(16px 16px 0 ${INK})">${brandSVG(280)}</div>`)
  popIn(logo, T.end + 0.3, { rot: [-40, -6], s: 2.2, dur: 0.45 })
  tw(logo, T.final, 0.4, { scale: [1.18, 1] }, ease.back(3))
  const word = add(end, `<div class="abs" style="left:0;right:0;top:1200px;display:flex;justify-content:center"><div class="sk bg-accent display on-color center" style="--sh:14;height:170px;padding:0 54px 14px;border-radius:var(--r-sm);font-size:128px">scroll-up</div></div>`)
  set(word.firstElementChild, 0, { rot: -3 })
  slap(word.firstElementChild, T.end + 0.55, { from: 2, rot: [-12, -3] })
  const cta = add(
    end,
    `<div class="abs sk bg-sky pill on-color" style="--sh:14;left:110px;width:860px;top:1440px;height:140px;display:flex;align-items:center;justify-content:center;gap:24px;font:800 50px var(--font-sans);box-sizing:border-box">
      <span class="pill center" style="width:92px;height:92px;border:7px solid var(--outline);background:var(--paper);box-sizing:border-box">${icon('send', 48, 2.6)}</span>
      @scrollup_bot
    </div>`,
  )
  tw(cta, T.cta, 0.001, { opacity: [0, 1] })
  tw(cta, T.cta, 0.4, { y: [240, 0], rot: [4, 0] }, ease.back(1.8))
  const free = add(end, `<div class="cap" style="top:1618px"><span style="font:800 44px var(--font-sans);color:var(--ink)">Gratuit, dans Telegram.</span></div>`)
  tw(free, T.cta + 0.3, 0.3, { opacity: [0, 1], y: [20, 0] }, ease.out3)
  confetti(end, T.final, [[0, 1900, 1], [1080, 1900, -1]], 60, 45)
}

/* ------------------------------------------------ effets communs */

function buildFx() {
  const fx = $('#fx')
  fx.style.pointerEvents = 'none'
  fx.style.zIndex = '20'
  // Éclair blanc à la révélation de l'app.
  const flash = add(fx, `<div class="abs" style="inset:0;background:#fffdf7"></div>`)
  set(flash, 0, { opacity: 0 })
  tw(flash, T.reveal, 0.02, { opacity: [0, 0.9] })
  tw(flash, T.reveal + 0.03, 0.35, { opacity: [0.9, 0] }, ease.out2)
  // Grain d'impression, qui « bout » 12 fois par seconde.
  const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
  const grain = add(fx, `<div class="abs" style="inset:0;background:#151515;opacity:0.06;-webkit-mask-image:${GRAIN};mask-image:${GRAIN};-webkit-mask-size:240px;mask-size:240px"></div>`)
  const r = rng(99)
  const offsets = Array.from({ length: 400 }, () => [Math.round(r() * 240), Math.round(r() * 240)])
  onFrame((t) => {
    const [x, y] = offsets[Math.floor(t * 12) % offsets.length]
    grain.style.webkitMaskPosition = `${x}px ${y}px`
    grain.style.maskPosition = `${x}px ${y}px`
  })
  const cam = $('#cam')
  onFrame((t) => {
    const [x, y] = shake(t)
    cam.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`
  })
}

/* ------------------------------------------------ démarrage */

async function start() {
  take = await (await fetch(`${MEDIA}/marks.json`)).json()
  await Promise.all(['800 100px "Bricolage Grotesque Variable"', '800 100px "Rethink Sans Variable"', '600 100px "Rethink Sans Variable"'].map((f) => document.fonts.load(f, 'Aàéèêç’«»·?0123456789')))
  await document.fonts.ready
  const stage = $('#stage2')
  $('#bg').style.zIndex = '1'
  stage.style.zIndex = '2'
  $('#captions').style.zIndex = '3'
  buildBackground()
  buildHook(stage)
  buildDevice(stage)
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
    const audio = new Audio('../build/viral/audio.wav')
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

