/**
 * ============================================================================
 *  « Plutôt Que Scroller » — la pub (≈ 28 s, 1080 × 1920, 60 i/s)
 * ============================================================================
 *
 *  1. 0 → 3,5 s     Accroche : la pub se déguise en vidéo du fil. « Si tu vois
 *                   cette vidéo… c'est que tu scrolles encore. » Swipes de plus
 *                   en plus rapides, notification de temps d'écran, arrêt net.
 *  2. 3,5 → 7,3 s   « Et si cette envie devenait un truc que t'aimes vraiment ? »
 *                   Le bouton de l'app apparaît ; un doigt appuie.
 *  3. 7,3 → 8,7 s   DROP sur « Plutôt » : le bouton explose, logo.
 *  4. 8,7 → 14,9 s  Démo dans un téléphone, avec les vraies captures de l'app :
 *                   bouton → humeur → passion → durée → activité.
 *  5. 14,9 → 19,7 s Vraies vidéos (dessin, musique, cuisine, sport), puis
 *                   « 5, 15 ou 30 minutes ».
 *  6. 19,7 → 23 s   « Et chaque envie transformée fait grimper ta série. »
 *  7. 23 → 28 s     Signature, promesse, appel à l'action.
 *
 *  Sous-titres mot à mot calés sur la voix ; coupes et effets sur les temps de
 *  la musique (timeline.js). window.__promo.seek(t) affiche l'image de
 *  l'instant t (en attendant que les images des clips soient décodées).
 */

import { clamp, ease, finalize, lerp, onFrame, prog, rng, seek as seekEngine, set, stagger, tw } from '../engine.js'
import { CLIPS } from './clips.js'
import { BEAT, CAPTIONS, DROP, DURATION, FPS, SWIPES, T, vo } from './timeline.js'

// --------------------------------------------------------------- utilitaires

const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
const NNBSP = ' '
const FRAMES = '../build/pub/frames'
const APP = '../build/pub/app'
/** Échelle des captures de l'app (1170 px de large) dans l'écran du téléphone (580 px). */
const SS = 580 / 1170
/** Hauteur de la barre d'état du téléphone, au-dessus des captures. */
const SB = 70

function add(parent, markup) {
  parent.insertAdjacentHTML('beforeend', markup)
  return parent.lastElementChild
}

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

// ---------------------------------------------------- vidéos image par image

const pending = []

/** Affiche dans `img` l'image du clip à l'instant local (en secondes). */
function clipFrame(img, clip, local) {
  const c = CLIPS[clip]
  const count = Math.floor(c.length * c.fps)
  const i = clamp(Math.floor(local * c.fps), 0, count - 1)
  const src = `${FRAMES}/${clip}/${String(i + 1).padStart(4, '0')}.jpg`
  if (img.__src !== src) {
    img.__src = src
    img.src = src
    pending.push(img.decode().catch(() => {}))
  }
}

/** Joue un clip dans `img` entre t0 et t1 (départ `from` dans le clip, vitesse `speed`). */
function playClip(img, clip, t0, t1, { from = 0, speed = 1 } = {}) {
  onFrame((t) => {
    if (t >= t0 - 0.06 && t <= t1 + 0.06) clipFrame(img, clip, from + Math.max(0, t - t0) * speed)
  })
}

// ------------------------------------------------------------------ dessins

const svgIcon = (inner, stroke = 2) =>
  `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

const ICON = {
  sparkles: svgIcon(
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  ),
  heart: `<svg viewBox="0 0 24 24" width="84" height="84" fill="#fff"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  comment: `<svg viewBox="0 0 24 24" width="80" height="80" fill="#fff"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
  share: `<svg viewBox="0 0 24 24" width="80" height="80" fill="#fff"><path d="M14 4v4C7 9 4 14 3 20c2.5-3.5 6-5.1 11-5.1V19l7-7.5z"/></svg>`,
}

const APP_MARK = `<svg viewBox="0 0 64 64" width="100%" height="100%">
  <rect width="64" height="64" rx="18" fill="#C4401C"/>
  <g transform="rotate(-45 32 32) translate(2.5 0)">
    <rect x="17" y="27" width="27" height="10" rx="2" fill="#FFF7EE"/>
    <rect x="44" y="27" width="7" height="10" rx="2" fill="#F2B632"/>
    <path d="M17 27 L8 32 L17 37 Z" fill="#F3D9C2"/>
    <path d="M11 30.3 L8 32 L11 33.7 Z" fill="#2A1F1A"/>
  </g></svg>`

const spark = (r, color) =>
  `<path d="M0 ${-r} C${r * 0.12} ${-r * 0.12} ${r * 0.12} ${-r * 0.12} ${r} 0 C${r * 0.12} ${r * 0.12} ${r * 0.12} ${r * 0.12} 0 ${r} C${-r * 0.12} ${r * 0.12} ${-r * 0.12} ${r * 0.12} ${-r} 0 C${-r * 0.12} ${-r * 0.12} ${-r * 0.12} ${-r * 0.12} 0 ${-r}Z" fill="${color}"/>`

const COLORS = ['#E4572E', '#9B5DE5', '#3D7DD8', '#13A89E', '#F08A24', '#C9971A', '#D6457A', '#4F9D69', '#F2B632']

// =============================================================================
//  1 · L'ACCROCHE : UNE « VIDÉO DU FIL »
// =============================================================================

const FEED = [
  { clip: 'hook-fille', user: '@juste.une.video', text: 'encore une dernière, promis 🙏', likes: '48,2 k' },
  { clip: 'hook-lit', user: '@minuit.pile', text: 'POV : il est 1 h du mat', likes: '12,9 k', night: true },
  { bg: 'linear-gradient(160deg,#ff4d8d,#7b61ff)', emoji: '😂', user: '@memes.du.jour', text: 'je suis mort 💀', likes: '301 k' },
  { bg: 'linear-gradient(160deg,#22c3e6,#1b3f8c)', emoji: '🐱', user: '@chat.chelou', text: 'regarde jusqu’à la fin', likes: '88 k' },
  { bg: 'linear-gradient(160deg,#ffd166,#ef476f)', emoji: '🍕', user: '@food.hacks', text: 'la recette que personne ne connaît', likes: '1,2 M' },
  { bg: 'linear-gradient(160deg,#06d6a0,#118ab2)', emoji: '🎮', user: '@gaming.clips', text: 'attends la dernière seconde', likes: '540 k' },
]

function feedIndex(t) {
  let idx = 0
  for (const s of SWIPES) {
    if (t < s.t) break
    idx = lerp(s.to - 1, s.to, ease.out3(clamp((t - s.t) / s.d)))
  }
  return idx
}

function buildS1() {
  const s1 = $('#s1')
  s1.innerHTML = `
    <div id="feedStack" class="layer"><div id="feedInner" class="layer"></div></div>
    <div id="notifWrap" class="abs" style="left:70px;top:90px"></div>
    <div id="s1flash" class="layer" style="background:#fff"></div>`
  const inner = $('#feedInner')
  FEED.forEach((item, k) => {
    const el = add(inner, `<div class="feedItem" style="top:${k * 1920}px;background:${item.bg ?? '#111'}"></div>`)
    if (item.clip) {
      const img = add(el, '<img class="full-img" alt="">')
      const t0 = k === 0 ? 0 : SWIPES[k - 1].t
      const t1 = k + 1 < FEED.length ? SWIPES[k].t + SWIPES[k].d : T.freeze + 4
      playClip(img, item.clip, t0, t1, { from: k === 0 ? 0 : 0.4 })
      if (item.night) add(el, '<div class="layer" style="background:linear-gradient(180deg,rgb(20 30 90 / .45),rgb(10 10 40 / .35));mix-blend-mode:multiply"></div>')
    } else {
      add(el, `<div class="layer" style="display:grid;place-items:center;font-size:360px">${item.emoji}</div>`)
    }
    add(
      el,
      `<div class="feedShade"></div><div class="feedUI">
        <div class="side">
          <div class="avatar" style="background:linear-gradient(135deg,${COLORS[k]},${COLORS[k + 2]})"></div>
          <span><div class="ico">${ICON.heart}</div>${item.likes}</span>
          <span><div class="ico">${ICON.comment}</div>${(k + 3) * 217}</span>
          <span><div class="ico">${ICON.share}</div>Partager</span>
        </div>
        <div class="bottom"><b>${item.user}</b><br>${item.text}<br>♫ son original</div>
      </div>`,
    )
  })

  // Le fil défile (flou de mouvement proportionnel à la vitesse), puis se fige.
  const blur = $('#vblurNode')
  onFrame((t) => {
    if (t > T.freeze + 4.5) return
    const idx = feedIndex(Math.min(t, T.freeze))
    const v = t < T.freeze ? (feedIndex(t) - feedIndex(t - 0.004)) / 0.004 : 0
    inner.style.transform = `translateY(${(-idx * 1920).toFixed(1)}px)`
    blur.setAttribute('stdDeviation', `0 ${Math.min(60, Math.abs(v) * 1920 * 0.0028).toFixed(2)}`)
  })
  tw('#feedInner', T.freeze, 0.3, { gray: [0, 1], bright: [1, 0.5] }, ease.out2)
  tw('#s1', T.freeze, DROP - T.freeze, { scale: [1, 1.08] }, ease.linear)
  set('#s1flash', 0, { opacity: 0 })
  tw('#s1flash', T.freeze, 0.28, { opacity: [0.55, 0] }, ease.out2)

  // Notification : le temps d'écran s'emballe.
  const notif = add(
    $('#notifWrap'),
    `<div class="notif"><div class="appico">⏳</div><div><div class="t1">TEMPS D’ÉCRAN · maintenant</div><div class="t2">Aujourd’hui : <b id="stTime"></b> sur ton téléphone</div></div></div>`,
  )
  const st = $('#stTime')
  st.__fmt = (m) => `${Math.floor(m / 60)}${NNBSP}h${NNBSP}${String(Math.floor(m % 60)).padStart(2, '0')}`
  tw(st, 0, 0.01, { text: [192, 192] })
  tw(st, T.counter, T.freeze - T.counter, { text: [192, 287] }, ease.in2)
  set(notif, 0, { y: -320 })
  tw(notif, T.notif, 0.45, { y: [-320, 0] }, ease.back(1.4))
  tw(notif, T.freeze + 0.05, 0.3, { y: -320 }, ease.in3)
  set(s1, DROP + 0.5, { opacity: 0 })
}

// =============================================================================
//  2 · « ET SI CETTE ENVIE DEVENAIT… » : LE BOUTON
// =============================================================================

function buildS2() {
  const s2 = $('#s2')
  s2.innerHTML = `
    <div id="s2dim" class="layer" style="background:#0d0a14"></div>
    <div id="btnShake" class="layer"><div id="btn" class="bigbtn" style="left:300px;top:640px">
      <div class="ring"></div><div class="ring"></div><div class="disc"></div>
      <div class="label"><span id="btnSpark" style="display:block;width:74px;height:74px">${ICON.sparkles}</span><div>J’ai envie<br>de scroller</div></div>
    </div></div>
    <div id="s2touch" class="touch"></div><div id="s2tap" class="tapring"></div>`
  const btn = $('#btn')
  set('#s2dim', 0, { opacity: 0 })
  tw('#s2dim', T.freeze, 0.35, { opacity: [0, 0.62] })
  set(btn, 0, { scale: 0 })
  tw(btn, T.freeze + 0.02, 0.55, { scale: [0, 1], rot: [-14, 0] }, ease.back(2.2))
  tw(btn, T.tapBtn, 0.07, { scale: 0.88 }, ease.out2)
  tw(btn, T.tapBtn + 0.07, 0.3, { scale: 1.06 }, ease.back(3))
  tw(btn, T.tapBtn + 0.3, DROP - T.tapBtn - 0.3, { scale: 1.14 }, ease.in2)
  $$('.ring', btn).forEach((ring, i) => {
    set(ring, 0, { opacity: 0 })
    for (let t0 = T.freeze + 0.3 + i * BEAT; t0 < T.tapBtn - 0.4; t0 += 2 * BEAT) tw(ring, t0, 0.9, { scale: [1, 1.6], opacity: [0.6, 0] }, ease.out2)
    tw(ring, T.tapBtn + 0.1 + i * 0.12, 0.3, { scale: [1.9, 1], opacity: [0, 0.7] }, ease.in2)
    set(ring, DROP, { opacity: 0 })
  })
  tw($('.disc', btn), DROP, 0.5, { scale: [1, 6.5] }, ease.expoOut)
  tw($('.label', btn), DROP, 0.14, { scale: [1, 2.2], opacity: [1, 0] }, ease.out2)

  // Le doigt
  const touch = $('#s2touch')
  set(touch, 0, { opacity: 0, x: 900, y: 1650 })
  tw(touch, T.tapBtn - 0.5, 0.1, { opacity: [0, 0.95] })
  tw(touch, T.tapBtn - 0.5, 0.46, { x: [900, 560], y: [1650, 900] }, ease.out3)
  tw(touch, T.tapBtn, 0.07, { scale: 0.75 }, ease.out2)
  tw(touch, T.tapBtn + 0.07, 0.14, { scale: 1 }, ease.out2)
  tw(touch, T.tapBtn + 0.22, 0.18, { opacity: 0, y: 960 }, ease.in2)
  set('#s2tap', 0, { x: 560, y: 900, opacity: 0 })
  tw('#s2tap', T.tapBtn, 0.45, { scale: [0.6, 3.4], opacity: [0.95, 0] }, ease.out2)

  const shaker = $('#btnShake')
  const sparkIcon = $('#btnSpark')
  shaker.style.transformOrigin = '540px 880px'
  const pulses = []
  for (let t0 = T.freeze + 0.3; t0 < T.musicBack - 0.2; t0 += 2 * BEAT) pulses.push([t0, 1], [t0 + 0.17, 0.6])
  for (let t0 = T.musicBack; t0 < T.tapBtn - 0.1; t0 += BEAT) pulses.push([t0, 0.8])
  onFrame((t) => {
    const a = t > T.tapBtn + 0.2 && t < DROP ? 14 * prog(t, T.tapBtn + 0.2, DROP - T.tapBtn - 0.2, ease.in2) : 0
    const beat = pulses.reduce((sum, [t0, k]) => sum + (t >= t0 && t < t0 + 0.5 ? k * Math.exp(-(t - t0) / 0.09) : 0), 0)
    shaker.style.transform = `translate(${(a * Math.sin(t * 120)).toFixed(2)}px, ${(a * Math.cos(t * 150)).toFixed(2)}px) scale(${(1 + 0.045 * beat).toFixed(4)})`
    sparkIcon.style.transform = `rotate(${(t * 40 + (t > T.tapBtn ? (t - T.tapBtn) ** 2 * 2400 : 0)).toFixed(1)}deg)`
  })
  set(s2, DROP + 0.6, { opacity: 0 })
}

// =============================================================================
//  3 · DROP : LE LOGO
// =============================================================================

function buildS3() {
  const s3 = $('#s3')
  s3.innerHTML = `
    <div id="s3bg" class="layer dots"></div>
    <svg class="layer" width="1080" height="1920" viewBox="0 0 1080 1920" style="overflow:visible"><g id="s3burst"></g></svg>
    <div id="s3logo" class="layer">
      <div id="s3icon" class="abs" style="left:410px;top:470px;width:260px;height:260px;filter:drop-shadow(0 30px 40px rgb(196 64 28 / .35))">${APP_MARK}</div>
      <div id="s3l1" class="abs display logo-line" style="top:790px">plutôt que</div>
      <div id="s3l2" class="abs display logo-line" style="top:940px"><span id="s3word" style="position:relative;display:inline-block">scroller</span></div>
    </div>`
  // Cercle crème qui s'ouvre sur l'explosion du bouton
  const bg = $('#s3bg')
  onFrame((t) => {
    const r = t < DROP + 0.02 ? 0 : 1300 * ease.expoOut(clamp((t - DROP - 0.02) / 0.5))
    bg.style.clipPath = `circle(${r.toFixed(1)}px at 540px 880px)`
  })
  const icon = $('#s3icon')
  set(icon, 0, { scale: 0 })
  tw(icon, DROP + 0.04, 0.55, { scale: [0, 1], rot: [-25, 0] }, ease.back(2.2))
  const c1 = splitChars($('#s3l1'))
  const word = $('#s3word')
  const c2 = splitChars(word)
  word.insertAdjacentHTML(
    'beforeend',
    `<svg viewBox="0 0 100 12" preserveAspectRatio="none" style="position:absolute;left:-4%;top:52%;width:108%;height:0.45em;transform:translateY(-50%);overflow:visible"><path id="s3strike" d="M2 7 Q 14 1 26 6 T 50 6 T 74 6 T 98 4" fill="none" stroke="#C4401C" stroke-width="3.4" stroke-linecap="round"/></svg>`,
  )
  stagger([...c1, ...c2], 0, 0, 0, { opacity: 0 })
  stagger(c1, DROP + 0.08, 0.02, 0.4, { y: [90, 0], rot: [10, 0], opacity: [0, 1] }, ease.back(1.8))
  stagger(c2, DROP + 0.2, 0.02, 0.4, { y: [90, 0], rot: [10, 0], opacity: [0, 1] }, ease.back(1.8))
  set('#s3strike', 0, { d1: 0 })
  tw('#s3strike', T.strike, 0.32, { d1: [0, 1] }, ease.out2)
  // Éclats autour du logo
  const burst = $('#s3burst')
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const line = add(burst, `<line x1="${(540 + Math.cos(a) * 330).toFixed(1)}" y1="${(760 + Math.sin(a) * 330).toFixed(1)}" x2="${(540 + Math.cos(a) * 470).toFixed(1)}" y2="${(760 + Math.sin(a) * 470).toFixed(1)}" stroke="${COLORS[i % COLORS.length]}" stroke-width="16" stroke-linecap="round"/>`)
    set(line, 0, { d1: 0 })
    tw(line, DROP + 0.06 + i * 0.01, 0.22, { d1: [0, 1] }, ease.out2)
    tw(line, DROP + 0.26 + i * 0.01, 0.25, { d0: [0, 1] }, ease.in2)
  }
  // Le logo laisse la place au téléphone
  tw('#s3logo', T.phoneIn - 0.2, 0.4, { y: -700, scale: 0.7, opacity: 0 }, ease.in3)
  set(s3, 0, { opacity: 0 })
  set(s3, DROP, { opacity: 1 })
}

// =============================================================================
//  4 · DÉMO DANS LE TÉLÉPHONE (vraies captures de l'app)
// =============================================================================

let zones = {}

const STATUS_ICONS = `<span class="icons">
  <svg width="34" height="22" viewBox="0 0 34 22" fill="currentColor"><rect y="14" width="6" height="8" rx="1.5"/><rect x="9" y="10" width="6" height="12" rx="1.5"/><rect x="18" y="5" width="6" height="17" rx="1.5"/><rect x="27" width="6" height="22" rx="1.5"/></svg>
  <svg width="30" height="22" viewBox="0 0 30 22" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M15 20.5 L10.6 16.1 A6.3 6.3 0 0 1 19.4 16.1 Z" fill="currentColor" stroke="none"/><path d="M5.8 11.6 A13 13 0 0 1 24.2 11.6"/><path d="M1.8 7 A19 19 0 0 1 28.2 7"/></svg>
  <svg width="50" height="24" viewBox="0 0 50 24" fill="currentColor"><rect x="1" y="1" width="42" height="22" rx="7" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-width="2"/><rect x="4.5" y="4.5" width="31" height="15" rx="4"/><path d="M46 8.5 v7 a3.5 3.5 0 0 0 0 -7z" fill-opacity=".45"/></svg>
</span>`

function phoneMarkup(id, screens) {
  return `<div class="phone" id="${id}"><div class="bezel"></div><div class="screen">
    ${screens.map((s, i) => `<img id="${id}-sc${i}" src="${APP}/${s}.png" alt="">`).join('')}
    <div class="status"><span>9:41</span>${STATUS_ICONS}</div>
    <div class="hl" id="${id}-hl"></div><div class="touch" id="${id}-touch"></div><div class="tapring" id="${id}-tap"></div>
  </div><div class="island"></div></div>`
}

/** Centre d'une zone de capture, en pixels de l'écran du téléphone. */
const zc = (name) => {
  const z = zones[name]
  return [(z.x + z.w / 2) * SS, (z.y + z.h / 2) * SS + SB]
}

function buildS4() {
  const s4 = $('#s4')
  s4.innerHTML = `${phoneMarkup('ph', ['01-accueil', '02-humeur', '03-passion', '04-duree', '05-activite'])}
    <div id="cardPop" class="abs"></div>
    <div id="chipPop" class="abs sticker" style="left:630px;top:1285px"><span class="emoji">✏️</span>Dessin</div>`
  const phone = $('#ph')
  // Entrée, léger flottement 3D, poussées de caméra
  set(phone, 0, { y: 1500, opacity: 0 })
  tw(phone, T.phoneIn - 0.18, 0.1, { opacity: [0, 1] })
  tw(phone, T.phoneIn - 0.18, 0.5, { y: [1500, 0], rot: [12, 0] }, ease.back(1.2))
  onFrame((t) => {
    if (t < T.phoneIn - 0.2 || t > T.whip + 0.4) return
    phone.style.transformOrigin = '50% 36%'
  })
  tw(phone, T.taps[0] - 0.2, 0.3, { scale: 1.14 }, ease.io3)
  tw(phone, T.screens[0] - 0.08, 0.3, { scale: 1 }, ease.io3)
  tw(phone, T.screens[3] + 0.05, 0.45, { scale: 1.2, y: 40 }, ease.io3)
  tw(phone, T.cardPop, 0.4, { scale: 1.02, y: 90, bright: 0.55 }, ease.io3)
  set(phone, 0, { bright: 1 })
  // Écrans successifs (glissement façon iOS)
  const screens = $$('.screen > img', phone)
  screens.forEach((img, i) => {
    if (i === 0) return
    const t0 = T.screens[i - 1]
    set(img, 0, { x: 600 })
    tw(img, t0, 0.3, { x: [600, 0] }, ease.io3)
    tw(screens[i - 1], t0, 0.3, { x: -180, bright: 0.85 }, ease.io3)
  })
  $$('.screen > img', phone).forEach((img) => set(img, 0, { bright: 1 }))
  // Appuis du doigt + surbrillance de l'élément touché
  const touch = $('#ph-touch')
  const ring = $('#ph-tap')
  const hl = $('#ph-hl')
  set(touch, 0, { opacity: 0 })
  set(ring, 0, { opacity: 0 })
  set(hl, 0, { opacity: 0 })
  ;['bouton', 'ennui', 'dessin', 'cinqMinutes'].forEach((name, i) => {
    const t0 = T.taps[i]
    const [x, y] = zc(name)
    const z = zones[name]
    set(touch, t0 - 0.2, { x: x + 90, y: y + 160, scale: 1 })
    tw(touch, t0 - 0.2, 0.08, { opacity: [0, 0.95] })
    tw(touch, t0 - 0.199, 0.18, { x, y }, ease.out3)
    tw(touch, t0, 0.07, { scale: 0.75 }, ease.out2)
    tw(touch, t0 + 0.07, 0.12, { scale: 1 }, ease.out2)
    tw(touch, t0 + 0.2, 0.12, { opacity: 0 }, ease.in2)
    set(ring, t0, { x, y })
    tw(ring, t0, 0.4, { scale: [0.6, 2.8], opacity: [0.95, 0] }, ease.out2)
    set(hl, t0, { left: z.x * SS - 8, top: z.y * SS + SB - 8, w: z.w * SS + 16, h: z.h * SS + 16, radius: name === 'bouton' ? 999 : 28 })
    tw(hl, t0, 0.2, { opacity: [0, 1], scale: [1.15, 1] }, ease.back(2))
    tw(hl, (T.screens[i] ?? t0 + 0.5) - 0.05, 0.1, { opacity: 0 })
  })
  // La carte d'activité sort du téléphone
  const card = zones.carte
  const k = 880 / card.w
  const pop = $('#cardPop')
  Object.assign(pop.style, {
    left: `${540 - 440}px`,
    top: `${720}px`,
    width: `880px`,
    height: `${(card.h * k).toFixed(1)}px`,
    backgroundImage: `url(${APP}/05-activite.png)`,
    backgroundSize: `${(1170 * k).toFixed(1)}px auto`,
    backgroundPosition: `${(-card.x * k).toFixed(1)}px ${(-card.y * k).toFixed(1)}px`,
    borderRadius: '44px',
    boxShadow: '0 50px 120px -30px rgb(42 31 26 / .6)',
  })
  set(pop, 0, { opacity: 0 })
  tw(pop, T.cardPop, 0.5, { opacity: [0, 1], scale: [0.62, 1], y: [120, 0], rot: [-2, -3], ry: [-25, 0] }, ease.back(1.6))
  set('#chipPop', 0, { opacity: 0 })
  tw('#chipPop', T.chip, 0.45, { opacity: [0, 1], scale: [0.2, 1], rot: [20, 5] }, ease.back(2.6))
  // Coup de fouet vers la gauche, vers les vraies vidéos
  const hb = $('#hblurNode')
  tw(s4, T.whip, 0.22, { x: [0, -1300] }, ease.in3)
  onFrame((t) => {
    const p = clamp((t - T.whip) / 0.3)
    hb.setAttribute('stdDeviation', `${(p > 0 && p < 1 ? 70 * Math.sin(Math.PI * p) : 0).toFixed(1)} 0`)
  })
  s4.style.filter = 'url(#hblur)'
  set(s4, 0, { opacity: 0 })
  set(s4, T.phoneIn - 0.2, { opacity: 1 })
  set(s4, T.whip + 0.3, { opacity: 0 })
}

// =============================================================================
//  5 · LES VRAIES VIDÉOS : DESSIN, MUSIQUE, CUISINE, SPORT
// =============================================================================

const MONTAGE = [
  { clip: 'dessin', word: 'DESSIN', emoji: '✏️', color: '#E4572E', title: 'Croquis express', sub: 'Dessin · 5 min' },
  { clip: 'musique', word: 'MUSIQUE', emoji: '🎸', color: '#13A89E', title: 'Body percussion', sub: 'Musique · 5 min' },
  { clip: 'cuisine', word: 'CUISINE', emoji: '🍳', color: '#C9971A', title: 'Galettes à la poêle', sub: 'Cuisine · 15 min' },
  { clip: 'sport', word: 'SPORT', emoji: '🏃', color: '#F08A24', title: 'Secouer le stress', sub: 'Sport · 5 min' },
]

function buildS5() {
  const s5 = $('#s5')
  s5.style.filter = 'url(#hblur)'
  const layers = MONTAGE.map((m, i) => {
    const el = add(s5, `<div class="layer" id="m${i}" style="overflow:hidden"><img class="full-img" alt=""><div class="layer" style="background:linear-gradient(180deg,transparent 55%,rgb(0 0 0 / .45))"></div>
      <div class="label-big" style="top:1150px"></div>
      <div class="abs" style="left:0;width:1080px;top:1360px;display:flex;justify-content:center"><div class="minicard"><div class="bubble" style="background:color-mix(in oklab, ${m.color} 20%, #fffdf9)">${m.emoji}</div><div>${m.title}<div class="sub">${m.sub}</div></div></div></div></div>`)
    const label = $('.label-big', el)
    label.textContent = m.word
    return el
  })
  const [, c1, c2, c3] = T.cuts
  // Fenêtre de chaque plan (transitions comprises) et durée de son apparition
  const starts = [T.whip, c1 - 0.1, c2 - 0.12, c3]
  const ends = [c1 + 0.05, c2 + 0.05, c3, T.grid + 0.05]
  const fadeIn = [0, 0.12, 0, 0]
  layers.forEach((el, i) => {
    playClip($('img', el), MONTAGE[i].clip, starts[i] - 0.05, ends[i], { from: 0.2 })
    set(el, 0, { opacity: 0 })
    tw(el, starts[i], fadeIn[i], { opacity: [0, 1] }, ease.linear)
    set(el, ends[i], { opacity: 0 })
    tw($('img', el), starts[i], ends[i] - starts[i], { scale: [1.04, 1.14] }, ease.linear)
    const label = $('.label-big', el)
    const card = $('.minicard', el)
    tw(label, T.cuts[i], 0.35, { scale: [0.3, 1], opacity: [0, 1], rot: [-8, -3] }, ease.back(2.4))
    tw(card, T.cuts[i] + 0.08, 0.4, { y: [140, 0], opacity: [0, 1] }, ease.back(1.6))
    set(label, 0, { opacity: 0 })
    set(card, 0, { opacity: 0 })
  })
  // Transitions : fouet (entrée), zoom traversant, glissement vertical, coupe franche (flash)
  tw(layers[0], T.whip, 0.22, { x: [1300, 0] }, ease.out3)
  tw(layers[0], c1 - 0.14, 0.19, { scale: [1, 1.45], blur: [0, 14] }, ease.in2)
  tw(layers[1], c1 - 0.1, 0.3, { scale: [1.35, 1], blur: [14, 0] }, ease.out3)
  tw(layers[1], c2 - 0.12, 0.16, { y: [0, -1920] }, ease.in3)
  tw(layers[2], c2 - 0.12, 0.16, { y: [1920, 0] }, ease.in3)
  // Grille 2 × 2 : le plan de sport (dernière case, donc au-dessus) recule dans sa
  // case, les trois autres passions arrivent autour ; puis « 5, 15 ou 30 minutes ».
  const grid = add(s5, '<div id="grid" class="layer" style="background:#111"></div>')
  const order = [3, 0, 1, 2]
  MONTAGE.forEach((m, i) => {
    const tile = add(grid, `<div class="tile" style="left:${(i % 2) * 540}px;top:${Math.floor(i / 2) * 960}px"><img alt=""></div>`)
    const img = $('img', tile)
    if (i === 3) {
      // Suite exacte du plan plein écran : même instant du clip, même cadrage au départ.
      playClip(img, m.clip, T.grid - 0.05, T.progress + 0.2, { from: 0.2 + T.grid - 0.05 - (starts[3] - 0.05) })
      set(tile, 0, { scale: 2, x: -270, y: -480 })
      tw(tile, T.grid, 0.45, { scale: [2, 1], x: [-270, 0], y: [-480, 0] }, ease.io3)
      tw(img, T.grid, 0.45, { scale: [0.57, 0.62] }, ease.io3)
    } else {
      playClip(img, m.clip, T.grid - 0.05, T.progress + 0.2, { from: 1.4 })
      set(tile, 0, { scale: 0 })
      tw(tile, T.grid + 0.12 + order.indexOf(i) * 0.06, 0.4, { scale: [0, 1] }, ease.back(1.6))
    }
    tw(tile, T.progress - 0.3 + i * 0.03, 0.25, { scale: 0, rot: i % 2 ? 20 : -20 }, ease.in3)
  })
  set(grid, 0, { opacity: 0 })
  set(grid, T.grid, { opacity: 1 })
  set(grid, T.progress + 0.1, { opacity: 0 })
  // Minuteur central
  const timer = add(
    s5,
    `<div class="abs" id="timer" style="left:290px;top:710px;width:500px;height:500px">
      <svg viewBox="0 0 500 500" width="500" height="500" style="position:absolute;inset:0;overflow:visible">
        <circle cx="250" cy="250" r="230" fill="#fffdf9" stroke="#111" stroke-width="14"/>
        <circle id="timerArc" cx="250" cy="250" r="190" fill="none" stroke="#C4401C" stroke-width="36" stroke-linecap="round" transform="rotate(-90 250 250)"/>
      </svg>
      <div class="abs" style="left:0;top:95px;width:500px;text-align:center;font-weight:900;font-size:230px;line-height:1;color:#2a1f1a;font-variant-numeric:tabular-nums"><span id="tn0">5</span></div>
      <div class="abs" style="left:0;top:95px;width:500px;text-align:center;font-weight:900;font-size:230px;line-height:1;color:#2a1f1a"><span id="tn1">15</span></div>
      <div class="abs" style="left:0;top:95px;width:500px;text-align:center;font-weight:900;font-size:230px;line-height:1;color:#C4401C"><span id="tn2">30</span></div>
      <div class="abs" id="tmin" style="left:0;top:330px;width:500px;text-align:center;font-weight:900;font-size:70px;letter-spacing:.06em;color:#6e5d52">MIN</div>
    </div>`,
  )
  set(timer, 0, { scale: 0 })
  tw(timer, T.grid + 0.03, 0.4, { scale: [0, 1] }, ease.back(2))
  tw(timer, T.progress - 0.3, 0.25, { scale: 0 }, ease.in3)
  const arc = $('#timerArc')
  set(arc, 0, { d1: 0 })
  tw(arc, T.nums[0], 0.35, { d1: [0, 1 / 6] }, ease.out3)
  tw(arc, T.nums[1], 0.35, { d1: 0.5 }, ease.out3)
  tw(arc, T.nums[2], 0.35, { d1: 1 }, ease.out3)
  ;['#tn0', '#tn1', '#tn2'].forEach((sel, i) => {
    const el = $(sel)
    el.style.display = 'inline-block'
    set(el, 0, { opacity: 0 })
    tw(el, T.nums[i], 0.3, { opacity: [0, 1], scale: [1.8, 1] }, ease.out4)
    if (i < 2) set(el, T.nums[i + 1], { opacity: 0 })
  })
  set('#tmin', 0, { opacity: 0 })
  tw('#tmin', T.nums[0] + 0.05, 0.3, { opacity: [0, 1], y: [20, 0] })
  tw('#tmin', T.minutes, 0.25, { scale: [1, 1.25] }, ease.out2)
  tw('#tmin', T.minutes + 0.25, 0.2, { scale: 1 }, ease.out2)
}

// =============================================================================
//  6 · LA PROGRESSION
// =============================================================================

function buildS6() {
  const s6 = $('#s6')
  s6.innerHTML = `<div id="s6bg" class="layer dots"></div>${phoneMarkup('ph2', ['06-bravo', '08-progres-complet'])}
    <div id="st1wrap" class="abs" style="left:40px;top:560px"><div class="sticker" id="st1"><span class="emoji">✨</span><span class="num">13</span> envies transformées</div></div>
    <div id="st2wrap" class="abs" style="left:430px;top:1090px"><div class="sticker" id="st2"><span class="emoji">🔥</span><span class="num" id="st2n">1</span> jours de série</div></div>`
  const phone = $('#ph2')
  set(s6, 0, { opacity: 0 })
  set(s6, T.progress - 0.12, { opacity: 1 })
  const bg = $('#s6bg')
  onFrame((t) => {
    const r = 1300 * ease.expoOut(clamp((t - T.progress + 0.12) / 0.5))
    bg.style.clipPath = `circle(${r.toFixed(1)}px at 540px 960px)`
  })
  set(phone, 0, { scale: 0 })
  tw(phone, T.progress - 0.08, 0.55, { scale: [0, 1], rot: [-10, 0] }, ease.back(1.6))
  const [bravo, progres] = $$('.screen > img', phone)
  set(progres, 0, { x: 600 })
  tw(progres, T.progScreen, 0.3, { x: [600, 0] }, ease.io3)
  tw(bravo, T.progScreen, 0.3, { x: -180, bright: 0.85 }, ease.io3)
  set(bravo, 0, { bright: 1 })
  tw(progres, T.progScreen + 0.35, 1.1, { y: [0, -300] }, ease.io3)
  set('#st1', 0, { opacity: 0 })
  tw('#st1', T.stTransformed, 0.45, { opacity: [0, 1], scale: [0.3, 1], rot: [-24, -6] }, ease.back(2.4))
  set('#st2', 0, { opacity: 0 })
  tw('#st2', T.stStreak, 0.45, { opacity: [0, 1], scale: [0.3, 1], rot: [24, 5] }, ease.back(2.4))
  const n = $('#st2n')
  n.__fmt = (v) => String(Math.round(v))
  tw(n, T.stStreak + 0.1, 0.55, { text: [1, 5] }, ease.out2)
  tw(n, T.streakBump, 0.12, { scale: [1, 1.4] }, ease.out2)
  tw(n, T.streakBump + 0.12, 0.3, { scale: 1 }, ease.back(2))
  onFrame((t) => {
    if (t < T.stTransformed || t > T.end + 0.5) return
    $('#st1wrap').style.transform = `translateY(${(8 * Math.sin((t - T.stTransformed) * 4)).toFixed(2)}px)`
    $('#st2wrap').style.transform = `translateY(${(8 * Math.sin((t - T.stStreak) * 4 + 2)).toFixed(2)}px)`
  })
}

// =============================================================================
//  7 · SIGNATURE ET APPEL À L'ACTION
// =============================================================================

function buildS7() {
  const s7 = $('#s7')
  s7.innerHTML = `
    <div id="endCard" class="layer dots">
      <div id="endIcon" class="abs" style="left:420px;top:330px;width:240px;height:240px;filter:drop-shadow(0 30px 40px rgb(196 64 28 / .35))">${APP_MARK}</div>
      <div id="e1" class="abs display logo-line" style="top:620px">plutôt que</div>
      <div id="e2" class="abs display logo-line" style="top:770px"><span id="eword" style="position:relative;display:inline-block">scroller</span></div>
      <div class="cta" id="cta"><div class="ring"></div><div class="ring"></div><div class="pill">Essaie l’appli <span style="font-size:64px">👉</span></div></div>
      <div id="bio" class="abs" style="left:0;width:1080px;top:1525px;text-align:center;font-size:40px;font-weight:700;color:#6e5d52">Lien en bio</div>
      <div id="endBubbles" class="layer"></div>
    </div>
    <div id="band" class="layer" style="background:#C4401C"></div>`
  // Bande tomate qui traverse l'écran et dévoile la fin
  const band = $('#band')
  const card = $('#endCard')
  onFrame((t) => {
    const top = lerp(2000, -120, prog(t, T.end - 0.25, 0.3, ease.in2))
    const bottom = lerp(2000, -120, prog(t, T.end + 0.02, 0.34, ease.out3))
    band.style.clipPath = `inset(${Math.max(0, top).toFixed(1)}px 0 ${(1920 - Math.max(top, bottom)).toFixed(1)}px 0)`
    card.style.clipPath = `inset(${Math.max(0, bottom).toFixed(1)}px 0 0 0)`
  })
  set('#endIcon', 0, { scale: 0 })
  tw('#endIcon', T.end + 0.08, 0.55, { scale: [0, 1], rot: [-25, 0] }, ease.back(2.2))
  const c1 = splitChars($('#e1'))
  const word = $('#eword')
  const c2 = splitChars(word)
  word.insertAdjacentHTML(
    'beforeend',
    `<svg viewBox="0 0 100 12" preserveAspectRatio="none" style="position:absolute;left:-4%;top:52%;width:108%;height:0.45em;transform:translateY(-50%);overflow:visible"><path id="estrike" d="M2 7 Q 14 1 26 6 T 50 6 T 74 6 T 98 4" fill="none" stroke="#C4401C" stroke-width="3.4" stroke-linecap="round"/></svg>`,
  )
  stagger([...c1, ...c2], 0, 0, 0, { opacity: 0 })
  stagger(c1, T.endLogo, 0.02, 0.4, { y: [90, 0], rot: [10, 0], opacity: [0, 1] }, ease.back(1.8))
  stagger(c2, T.endLogo + 0.14, 0.02, 0.4, { y: [90, 0], rot: [10, 0], opacity: [0, 1] }, ease.back(1.8))
  set('#estrike', 0, { d1: 0 })
  tw('#estrike', T.endStrike, 0.32, { d1: [0, 1] }, ease.out2)
  set('#cta .pill', 0, { opacity: 0 })
  tw('#cta .pill', T.cta, 0.5, { scale: [0.4, 1], opacity: [0, 1] }, ease.back(2))
  tw('#cta .pill', T.sting, 0.08, { scale: 1.1 }, ease.out2)
  tw('#cta .pill', T.sting + 0.08, 0.35, { scale: 1 }, ease.back(2.4))
  $$('#cta .ring').forEach((ring, i) => {
    set(ring, 0, { opacity: 0 })
    for (let t0 = T.cta + 0.35 + i * BEAT; t0 < DURATION; t0 += 2 * BEAT) tw(ring, t0, 0.7, { sx: [1, 1.12], sy: [1, 1.5], opacity: [0.9, 0] }, ease.out2)
  })
  set('#bio', 0, { opacity: 0 })
  tw('#bio', T.cta + 0.2, 0.4, { opacity: [0, 1], y: [20, 0] })
  const bubbles = [
    ['🎨', 150, 250], ['🎬', 930, 270], ['✍️', 100, 1480], ['🎧', 980, 1460],
    ['🤸', 120, 1720], ['🛠️', 960, 1740], ['🧩', 110, 700], ['🌿', 970, 640],
  ]
  const layer = $('#endBubbles')
  bubbles.forEach(([emoji, x, y], i) => {
    const wrap = add(layer, `<div class="abs" style="left:${x - 70}px;top:${y - 70}px"><div class="bubble-float">${emoji}</div></div>`)
    const b = wrap.firstElementChild
    set(b, 0, { scale: 0 })
    tw(b, T.end + 0.14 + i * 0.04, 0.5, { scale: [0, 1], rot: [i % 2 ? 30 : -30, 0] }, ease.back(2.2))
    onFrame((t) => {
      if (t < T.end) return
      const d = t - T.end
      wrap.style.transform = `translate(${(6 * Math.sin(d * 1.7 + i)).toFixed(2)}px, ${(12 * Math.sin(d * 2.3 + i * 1.3)).toFixed(2)}px)`
    })
  })
}

// =============================================================================
//  SOUS-TITRES MOT À MOT
// =============================================================================

function buildCaptions() {
  const layer = $('#captions')
  CAPTIONS.forEach((chunk, i) => {
    const top = chunk.at === 'high' ? 170 : chunk.at === 'end' ? 1060 : 1240
    const el = add(layer, `<div class="cap ${chunk.at}" style="top:${top}px"></div>`)
    const words = chunk.words.map(([text, at]) => {
      const span = add(el, `<span class="w${chunk.hi?.includes(text) ? ' hi' : ''}"></span>`)
      span.textContent = text
      return [span, vo(at)]
    })
    const next = CAPTIONS[i + 1]
    const end = chunk.until !== undefined ? vo(chunk.until) : next ? vo(next.words[0][1]) : DURATION
    for (const [span, at] of words) {
      set(span, 0, { opacity: 0 })
      tw(span, at - 0.04, 0.22, { opacity: [0, 1], scale: [0.55, 1], y: [30, 0] }, ease.back(1.7))
    }
    set(el, 0, { opacity: 1 })
    set(el, end - 0.02, { opacity: 0 })
  })
}

// =============================================================================
//  EFFETS : CONFETTIS, SECOUSSES, COUPS DE ZOOM
// =============================================================================

function confetti(t0, x0, y0, count, seed) {
  const fx = $('#fx')
  const R = rng(seed)
  const pieces = []
  for (let i = 0; i < count; i++) {
    const c = COLORS[i % COLORS.length]
    const size = 22 + R() * 26
    const shapes = [
      `<circle r="${size / 2}" fill="${c}"/>`,
      `<rect x="${-size / 2}" y="${-size / 3}" width="${size}" height="${(size * 2) / 3}" rx="4" fill="${c}"/>`,
      `<path d="M0 ${-size * 0.6} L${size * 0.55} ${size * 0.4} L${-size * 0.55} ${size * 0.4}Z" fill="${c}"/>`,
      spark(size * 0.7, c),
    ]
    const el = add(fx, `<svg class="abs" width="2" height="2" style="left:0;top:0;overflow:visible">${shapes[i % shapes.length]}</svg>`)
    const a = R() * Math.PI * 2
    const v = 1200 + R() * 1800
    pieces.push({ el, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 500, spin: (R() - 0.5) * 1000, r0: R() * 360, life: 1 + R() * 0.6 })
  }
  const K = 2.4
  const G = 2400
  onFrame((t) => {
    for (const p of pieces) {
      const d = t - t0
      if (d < 0 || d > p.life) {
        p.el.style.visibility = 'hidden'
        continue
      }
      const e = 1 - Math.exp(-K * d)
      const x = x0 + (p.vx / K) * e
      const y = y0 + (G / K) * d + ((p.vy - G / K) / K) * e
      const s = Math.min(1, d / 0.05) * Math.min(1, (p.life - d) / 0.3)
      p.el.style.visibility = ''
      p.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(p.r0 + p.spin * d).toFixed(1)}deg) scale(${s.toFixed(3)})`
    }
  })
}

function camera() {
  const cam = $('#cam')
  const punches = [SWIPES[0].t, T.freeze, DROP, ...T.taps, ...T.screens, T.cardPop, ...T.cuts, T.grid, ...T.nums, T.progress, T.progScreen, T.end, T.sting]
  const shakes = [
    [T.freeze, 26],
    [DROP, 34],
    [T.cuts[3], 22],
    [T.end, 18],
  ]
  onFrame((t) => {
    let s = 1
    for (const p of punches) {
      const d = t - p
      if (d >= 0 && d < 0.5) s += 0.035 * Math.exp(-d / 0.09)
    }
    let x = 0
    let y = 0
    for (const [t0, amp] of shakes) {
      const d = t - t0
      if (d < 0 || d > 0.4) continue
      const a = amp * Math.exp(-d / 0.08)
      x += a * Math.sin(d * 97 + t0)
      y += a * Math.cos(d * 131 + t0)
    }
    cam.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(4)})`
  })
  // Flash blanc sur les coupes fortes
  const flash = add($('#fx'), '<div class="layer" style="background:#fff"></div>')
  set(flash, 0, { opacity: 0 })
  for (const t0 of [DROP, T.cuts[3], T.end + 0.05]) tw(flash, t0, 0.22, { opacity: [0.6, 0] }, ease.out2)
}

// =============================================================================
//  DÉMARRAGE
// =============================================================================

async function start() {
  await Promise.all([
    document.fonts.load('900 100px "Figtree Variable"'),
    document.fonts.load('700 40px "Figtree Variable"'),
    document.fonts.load('600 100px "Fraunces Variable"'),
  ])
  await document.fonts.ready
  zones = await (await fetch(`${APP}/zones.json`)).json()
  buildS1()
  buildS2()
  buildS3()
  buildS4()
  buildS5()
  buildS6()
  buildS7()
  buildCaptions()
  confetti(DROP, 540, 880, 44, 7)
  confetti(T.progress + 0.05, 540, 900, 36, 11)
  confetti(T.cta + 0.05, 540, 1425, 30, 23)
  camera()
  finalize()
  // Précharge les captures de l'app
  await Promise.all($$('img[src]').map((img) => img.decode().catch(() => {})))
  await seek(0)
}

async function seek(t) {
  seekEngine(t)
  await Promise.all(pending.splice(0))
}

const ready = start()
window.__promo = { ready, seek, duration: DURATION, fps: FPS }

if (!new URLSearchParams(location.search).has('render')) {
  document.body.classList.add('preview')
  ready.then(() => {
    const scrub = $('#scrub')
    const clock = $('#clock')
    const play = $('#play')
    const audio = new Audio('../build/pub/audio.wav')
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
