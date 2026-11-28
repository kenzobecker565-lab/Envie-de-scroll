/**
 * ============================================================================
 *  « Plutôt Que Scroller » — la pub (≈ 28 s, 1080 × 1920, 60 i/s)
 * ============================================================================
 *
 *  1. 0 → 3,6 s     Accroche : la pub se déguise en enregistrement d'écran d'une
 *                   app de vidéos courtes. « Si tu vois cette vidéo… c'est que tu
 *                   scrolles encore. » Six vraies vidéos, swipes au doigt de plus
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
import { PICTOS, spotFor } from '../../src/lib/pictos.ts'
import { BEAT, CAPTIONS, DROP, DURATION, FPS, HEIGHT, SWIPES, T, WIDTH, vo } from './timeline.js'

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

/**
 * Un pictogramme de l'app (src/lib/pictos.ts) en SVG : trait, et tache de
 * couleur facultative dessous, comme dans l'app.
 */
function picto(name, { size = 48, color = 'currentColor', spot = null, weight = 1.8 } = {}) {
  const spotPath = spot ? `<path d="${spotFor(name)}" fill="${spot}" stroke="none"/>` : ''
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round" style="display:block">${spotPath}${PICTOS[name].map((d) => `<path d="${d}"/>`).join('')}</svg>`
}
/** Tache douce d'une couleur (mélangée au blanc). */
const soft = (color, pct = 45) => `color-mix(in oklab, ${color} ${pct}%, #fff)`

const APP_MARK = `<svg viewBox="0 0 64 64" width="100%" height="100%">
  <rect width="64" height="64" rx="18" fill="#CC3615"/>
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
  { clip: 'hook-fille', user: 'juste.une.video', text: 'encore une dernière, promis', tags: '#pourtoi #scroll', likes: '48,2 k', comments: '1 204', saves: '5 310', shares: '892', from: 0 },
  { clip: 'hook-lit', user: 'minuit.pile', text: 'POV : il est 1 h du mat et t’as cours demain', tags: '#insomnie', likes: '12,9 k', comments: '406', saves: '1 877', shares: '233', night: true, from: 0.4 },
  { clip: 'feed-danse', user: 'lina.danse', text: 'nouvelle choré, vous validez ?', tags: '#danse #trend', likes: '301 k', comments: '4 518', saves: '22,1 k', shares: '9 870', from: 0.2 },
  { clip: 'feed-chat', user: 'nuage.le.chat', text: 'il a aucune limite', tags: '#chat #drole', likes: '88,4 k', comments: '2 061', saves: '6 402', shares: '3 311', from: 0.3 },
  { clip: 'feed-food', user: 'streetfood.paris', text: 'le meilleur snack de la ville', tags: '#food #streetfood', likes: '1,2 M', comments: '12,3 k', saves: '98,4 k', shares: '41,7 k', from: 0.2 },
  { clip: 'feed-skate', user: 'skate.daily', text: 'attends la fin…', tags: '#skate #fyp', likes: '540 k', comments: '7 745', saves: '31,2 k', shares: '18,9 k', from: 0.1 },
]
/** Barre d'onglets du bas de l'app de vidéos (fixe) ; les vidéos défilent au-dessus. */
const NAV_H = 150
const POST_H = HEIGHT - NAV_H

/** Décalage du fil (px) à l'instant t : le doigt tire la vidéo, lâche, elle se cale (SWIPES). */
function feedOffset(t) {
  let y = 0
  for (const s of SWIPES) {
    const t0 = s.t - s.drag
    if (t <= t0) continue
    if (t < s.t) y += s.pull * ease.in2((t - t0) / s.drag)
    else y += s.pull + (POST_H - s.pull) * ease.out3(clamp((t - s.t) / s.snap))
  }
  return y
}

/** Icônes pleines de l'interface du fil (grille 24). */
const FEED_ICON = {
  heart: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  comment: '<path d="M12 3C6.48 3 2 6.58 2 11c0 2.42 1.34 4.59 3.46 6.05-.16 1.35-.86 2.62-1.9 3.45 2.24.1 4.36-.66 5.86-2 .83.18 1.7.28 2.58.28 5.52 0 10-3.58 10-8S17.52 3 12 3z"/><circle cx="7.6" cy="11" r="1.25" fill="#1b1b1b" fill-opacity=".75"/><circle cx="12" cy="11" r="1.25" fill="#1b1b1b" fill-opacity=".75"/><circle cx="16.4" cy="11" r="1.25" fill="#1b1b1b" fill-opacity=".75"/>',
  save: '<path d="M6.2 2.5h11.6c.66 0 1.2.54 1.2 1.2v17.4c0 .5-.57.78-.97.48L12 17.1l-6.03 4.48a.6.6 0 0 1-.97-.48V3.7c0-.66.54-1.2 1.2-1.2z"/>',
  share: '<path d="M13.6 4.2v4.1C7.7 8.9 4.1 12.9 3 19.3c2.5-3.6 5.8-5.2 10.6-5.2v4.2L21.4 11z"/>',
}
const fillIcon = (name, size) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="#fff">${FEED_ICON[name]}</svg>`
const lineIcon = (inner, size, weight = 2.2) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="#fff" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

function buildS1() {
  const s1 = $('#s1')
  s1.innerHTML = `
    <div id="feedScreen" class="layer">
      <div id="feedStack" class="abs" style="left:0;top:0;width:${WIDTH}px;height:${POST_H}px;overflow:hidden"><div id="feedInner" class="layer"></div></div>
      <div class="feedTop">
        <div class="statusbar"><span>01:12</span><span class="sb-icons">${statusIcons('#fff')}</span></div>
        <div class="tabs">
          <span class="live">LIVE</span>
          <span class="tab">Explorer</span><span class="tab">Abonnements</span><span class="tab on">Pour toi</span>
          <span class="search">${lineIcon(PICTOS.search.map((d) => `<path d="${d}"/>`).join(''), 60, 2.4)}</span>
        </div>
      </div>
      <div class="feedNav">
        <span class="on">${lineIcon('<path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z" fill="#fff"/>', 58, 1.8)}Accueil</span>
        <span>${lineIcon('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>', 58)}Amis</span>
        <span class="plus"><i>${lineIcon('<path d="M12 6v12M6 12h12"/>', 44, 3)}</i></span>
        <span>${lineIcon('<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>', 58)}Boîte de réception</span>
        <span>${lineIcon('<circle cx="12" cy="8" r="4.2"/><path d="M4 21c0-4 3.6-6.6 8-6.6s8 2.6 8 6.6"/>', 58)}Profil</span>
      </div>
      <div id="feedTouch" class="touch"></div>
    </div>
    <div id="notifWrap" class="abs" style="left:36px;top:150px"></div>
    <div id="s1flash" class="layer" style="background:#fff"></div>`
  const inner = $('#feedInner')
  FEED.forEach((item, k) => {
    const el = add(inner, `<div class="feedItem" style="top:${k * POST_H}px;height:${POST_H}px"></div>`)
    const img = add(el, '<img class="full-img" alt="">')
    // Visible dès que le doigt tire la vidéo précédente ; la dernière se fige à l'arrêt.
    const t0 = k === 0 ? 0 : SWIPES[k - 1].t - SWIPES[k - 1].drag
    const t1 = k + 1 < FEED.length ? SWIPES[k].t + SWIPES[k].snap : T.freeze
    playClip(img, item.clip, t0, t1, { from: item.from })
    if (item.night) add(el, '<div class="layer" style="background:linear-gradient(180deg,rgb(20 30 90 / .42),rgb(10 10 40 / .3));mix-blend-mode:multiply"></div>')
    add(
      el,
      `<div class="feedShade"></div>
      <div class="rail">
        <div class="avatar" style="background:linear-gradient(135deg,${COLORS[k]},${COLORS[(k + 3) % COLORS.length]})"><b>${item.user[0].toUpperCase()}</b><i>+</i></div>
        <span>${fillIcon('heart', 92)}${item.likes}</span>
        <span>${fillIcon('comment', 88)}${item.comments}</span>
        <span>${fillIcon('save', 82)}${item.saves}</span>
        <span>${fillIcon('share', 88)}${item.shares}</span>
        <div class="disc" data-disc style="background:radial-gradient(circle at 50% 50%,${COLORS[(k + 1) % COLORS.length]} 0 29%,#111 30% 33%,#2a2a2a 34% 48%,#161616 49% 100%)"></div>
      </div>
      <div class="caption"><b>${item.user}</b><p>${item.text} <em>${item.tags}</em></p><div class="music">${lineIcon('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3" fill="#fff"/><circle cx="18" cy="16" r="3" fill="#fff"/>', 34, 2.4)}<span class="mq"><span data-marquee>son original - ${item.user} · son original - ${item.user} · </span></span></div></div>
      <div class="progress"><i data-progress></i></div>`,
    )
  })
  // Disques qui tournent, légendes musicales qui défilent, barres de progression
  const discs = $$('[data-disc]', inner)
  const marquees = $$('[data-marquee]', inner)
  const bars = $$('[data-progress]', inner)
  onFrame((t) => {
    const tt = Math.min(t, T.freeze)
    discs.forEach((d, k) => (d.style.transform = `rotate(${(tt * 70 + k * 40).toFixed(1)}deg)`))
    marquees.forEach((m) => (m.style.transform = `translateX(${(-((tt * 70) % 520)).toFixed(1)}px)`))
    bars.forEach((b, k) => (b.style.width = `${Math.min(100, 8 + ((tt * 9 + k * 23) % 90)).toFixed(1)}%`))
  })

  // Le fil défile au doigt, puis se fige (léger flou quand ça va très vite).
  const blurNode = $('#vblurNode')
  const stack = $('#feedStack')
  onFrame((t) => {
    if (t > T.freeze + 4.5) return
    const tt = Math.min(t, T.freeze)
    const y = feedOffset(tt)
    const v = t < T.freeze ? (feedOffset(t) - feedOffset(t - 1 / 120)) * 120 : 0
    inner.style.transform = `translateY(${(-y).toFixed(1)}px)`
    const b = Math.min(7, Math.max(0, Math.abs(v) - 2500) * 0.0009)
    stack.style.filter = b > 0.3 ? 'url(#vblur)' : 'none'
    blurNode.setAttribute('stdDeviation', `0 ${b.toFixed(2)}`)
  })
  // Le doigt : se pose, tire, lâche en continuant sa course.
  const touch = $('#feedTouch')
  onFrame((t) => {
    let shown = false
    SWIPES.forEach((s, k) => {
      const t0 = s.t - s.drag
      if (t < t0 - 0.04 || t > s.t + 0.14 || shown) return
      shown = true
      const drag = t < s.t ? s.pull * ease.in2(clamp((t - t0) / s.drag)) : s.pull + 320 * ease.out2(clamp((t - s.t) / 0.14))
      const alpha = t < t0 ? (t - t0 + 0.04) / 0.04 : t > s.t ? 1 - (t - s.t) / 0.14 : 1
      touch.style.opacity = (0.85 * clamp(alpha)).toFixed(3)
      touch.style.transform = `translate(${(600 - k * 12).toFixed(1)}px, ${(1330 - drag).toFixed(1)}px) scale(${t < t0 ? 1.25 - (t - t0 + 0.04) * 6 : 1})`
    })
    if (!shown) touch.style.opacity = '0'
  })
  tw('#feedScreen', T.freeze, 0.3, { gray: [0, 1], bright: [1, 0.5] }, ease.out2)
  tw('#s1', T.freeze, DROP - T.freeze, { scale: [1, 1.08] }, ease.linear)
  set('#s1flash', 0, { opacity: 0 })
  tw('#s1flash', T.freeze, 0.28, { opacity: [0.55, 0] }, ease.out2)

  // Notification iOS : le temps d'écran s'emballe.
  const notif = add(
    $('#notifWrap'),
    `<div class="notif"><div class="appico">${picto('hourglass', { size: 58, color: '#fff', weight: 2.2 })}</div>
      <div class="txt"><div class="t1"><b>Temps d’écran</b><span>maintenant</span></div><div class="t2">Tu as passé <b id="stTime"></b> sur ton téléphone aujourd’hui.</div></div></div>`,
  )
  const st = $('#stTime')
  st.__fmt = (m) => `${Math.floor(m / 60)}${NNBSP}h${NNBSP}${String(Math.floor(m % 60)).padStart(2, '0')}`
  tw(st, 0, 0.01, { text: [192, 192] })
  tw(st, T.counter, T.freeze - T.counter, { text: [192, 287] }, ease.in2)
  set(notif, 0, { y: -380, scale: 0.96 })
  tw(notif, T.notif, 0.5, { y: [-380, 0], scale: [0.96, 1] }, ease.back(1.2))
  tw(notif, T.freeze + 0.05, 0.3, { y: -380 }, ease.in3)
  set(s1, DROP + 0.5, { opacity: 0 })
}

// =============================================================================
//  2 · « ET SI CETTE ENVIE DEVENAIT… » : LE BOUTON
// =============================================================================

/** Le mini-fil dessiné dans le bouton de l'app (même dessin que UrgeButton, à l'échelle de la pub). */
const URGE_ICON = {
  play: '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" fill="currentColor"/>',
  heart: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" fill="currentColor"/>',
  camera: '<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><path d="M9 13a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>',
  comment: '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',
  music: '<path d="M4 18a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M12 18V2l7 4"/>',
}
/** Colonnes du mini-fil : vitesse (px/s), décalage, posts [hauteur, icône, plus visible]. */
const URGE_COLUMNS = [
  { speed: 195, offset: 0, posts: [[298, 'play', true], [206, 'heart'], [360, 'play'], [250, null], [317, 'music', true]] },
  { speed: 260, offset: -106, posts: [[235, 'heart'], [341, 'play', true], [216, 'comment'], [374, 'play'], [269, 'camera']] },
  { speed: 163, offset: -38, posts: [[350, 'play'], [245, null, true], [288, 'camera'], [211, 'heart', true], [331, 'play']] },
]
const URGE_GAP = 24

function buildS2() {
  const s2 = $('#s2')
  const posts = (column) =>
    [...column.posts, ...column.posts]
      .map(
        ([h, icon, bright]) =>
          `<div class="urge-post${bright ? ' bright' : ''}" style="height:${h}px"><i class="dot"></i>${icon ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${URGE_ICON[icon]}</svg>` : ''}<i class="bar"></i></div>`,
      )
      .join('')
  s2.innerHTML = `
    <div id="s2dim" class="layer" style="background:#0d0a14"></div>
    <div id="btnShake" class="layer"><div id="btn" class="urge" style="left:110px;top:544px;width:860px;height:672px">
      <div class="urge-bg"></div>
      <div class="urge-clip">
        <div class="urge-feed"><div class="urge-plane">${URGE_COLUMNS.map((c, k) => `<div class="urge-col" style="margin-top:${c.offset}px"><div class="urge-stack" data-urge-col="${k}">${posts(c)}</div></div>`).join('')}</div></div>
        <div class="urge-grain"></div>
      </div>
      <svg class="urge-strike" viewBox="0 0 300 60" preserveAspectRatio="none"><path id="urgeStrike" d="M4 38 C 40 18, 70 44, 108 30 S 170 14, 204 32 S 262 42, 296 20" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>
      <div class="urge-text"><div class="urge-title">J’ai envie<br>de scroller</div><div class="urge-sub">Appuie : on la transforme en idée.</div></div>
      <div class="urge-arrow" id="urgeArrow"><svg viewBox="0 0 24 24" width="62" height="62" fill="none" stroke="#c4381a" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div>
    </div></div>
    <div id="s2touch" class="touch"></div><div id="s2tap" class="tapring"></div>`
  const btn = $('#btn')
  set('#s2dim', 0, { opacity: 0 })
  tw('#s2dim', T.freeze, 0.35, { opacity: [0, 0.62] })
  set(btn, 0, { scale: 0 })
  tw(btn, T.freeze + 0.02, 0.55, { scale: [0, 1], rot: [-10, 0] }, ease.back(1.8))
  tw(btn, T.tapBtn, 0.07, { scale: 0.95 }, ease.out2)
  tw(btn, T.tapBtn + 0.07, 0.3, { scale: 1.03 }, ease.back(3))
  tw(btn, T.tapBtn + 0.3, DROP - T.tapBtn - 0.3, { scale: 1.08 }, ease.in2)

  // Le fil défile jusqu'à l'appui, puis se fige ; le crayon le barre aussitôt.
  const stacks = $$('[data-urge-col]', btn)
  const halves = URGE_COLUMNS.map((c) => c.posts.reduce((sum, [h]) => sum + h + URGE_GAP, 0))
  onFrame((t) => {
    const run = Math.max(0, Math.min(t, T.tapBtn) - T.freeze)
    stacks.forEach((stack, k) => (stack.style.transform = `translateY(${(-((run * URGE_COLUMNS[k].speed) % halves[k])).toFixed(1)}px)`))
  })
  set('#urgeStrike', 0, { d1: 0 })
  tw('#urgeStrike', T.tapBtn + 0.06, 0.32, { d1: [0, 1] }, ease.out2)

  // Au drop, le fond du bouton envahit l'écran et le contenu s'efface.
  tw($('.urge-bg', btn), DROP, 0.5, { scale: [1, 4.2] }, ease.expoOut)
  tw([$('.urge-clip', btn), $('.urge-strike', btn), $('.urge-text', btn), $('.urge-arrow', btn)], DROP, 0.14, { opacity: [1, 0] }, ease.out2)
  tw($('.urge-text', btn), DROP, 0.14, { scale: [1, 1.5] }, ease.out2)

  // Le doigt appuie sur la flèche
  const [fx, fy] = [855, 1101]
  const touch = $('#s2touch')
  set(touch, 0, { opacity: 0, x: 980, y: 1700 })
  tw(touch, T.tapBtn - 0.5, 0.1, { opacity: [0, 0.95] })
  tw(touch, T.tapBtn - 0.5, 0.46, { x: [980, fx], y: [1700, fy] }, ease.out3)
  tw(touch, T.tapBtn, 0.07, { scale: 0.75 }, ease.out2)
  tw(touch, T.tapBtn + 0.07, 0.14, { scale: 1 }, ease.out2)
  tw(touch, T.tapBtn + 0.22, 0.18, { opacity: 0, y: fy + 60 }, ease.in2)
  set('#s2tap', 0, { x: fx, y: fy, opacity: 0 })
  tw('#s2tap', T.tapBtn, 0.45, { scale: [0.6, 3.4], opacity: [0.95, 0] }, ease.out2)
  tw('#urgeArrow', T.tapBtn, 0.08, { scale: 0.86 }, ease.out2)
  tw('#urgeArrow', T.tapBtn + 0.08, 0.3, { scale: 1 }, ease.back(3))

  // Le bouton bat : deux battements de cœur pendant le silence, puis les temps de la musique ;
  // il tremble quand il se charge avant le drop.
  const shaker = $('#btnShake')
  const arrow = $('#urgeArrow svg')
  shaker.style.transformOrigin = '540px 880px'
  const pulses = []
  for (let t0 = T.freeze + 0.3; t0 < T.musicBack - 0.2; t0 += 2 * BEAT) pulses.push([t0, 1], [t0 + 0.17, 0.6])
  for (let t0 = T.musicBack; t0 < T.tapBtn - 0.1; t0 += BEAT) pulses.push([t0, 0.8])
  onFrame((t) => {
    const a = t > T.tapBtn + 0.2 && t < DROP ? 14 * prog(t, T.tapBtn + 0.2, DROP - T.tapBtn - 0.2, ease.in2) : 0
    const beat = pulses.reduce((sum, [t0, k]) => sum + (t >= t0 && t < t0 + 0.5 ? k * Math.exp(-(t - t0) / 0.09) : 0), 0)
    shaker.style.transform = `translate(${(a * Math.sin(t * 120)).toFixed(2)}px, ${(a * Math.cos(t * 150)).toFixed(2)}px) scale(${(1 + 0.03 * beat).toFixed(4)})`
    arrow.style.transform = `translateX(${(t < T.tapBtn ? 7 * (0.5 - 0.5 * Math.cos(t * 2.6)) : 0).toFixed(2)}px)`
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
      <div id="s3icon" class="abs" style="left:410px;top:470px;width:260px;height:260px;filter:drop-shadow(0 30px 40px rgb(204 54 21 / .35))">${APP_MARK}</div>
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
    `<svg viewBox="0 0 100 12" preserveAspectRatio="none" style="position:absolute;left:-4%;top:52%;width:108%;height:0.45em;transform:translateY(-50%);overflow:visible"><path id="s3strike" d="M2 7 Q 14 1 26 6 T 50 6 T 74 6 T 98 4" fill="none" stroke="#CC3615" stroke-width="3.4" stroke-linecap="round"/></svg>`,
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

/** Icônes de la barre d'état (réseau, wifi, batterie). */
const statusIcons = (color = 'currentColor') => `<span class="icons" style="color:${color}">
  <svg width="34" height="22" viewBox="0 0 34 22" fill="currentColor"><rect y="14" width="6" height="8" rx="1.5"/><rect x="9" y="10" width="6" height="12" rx="1.5"/><rect x="18" y="5" width="6" height="17" rx="1.5"/><rect x="27" width="6" height="22" rx="1.5"/></svg>
  <svg width="30" height="22" viewBox="0 0 30 22" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M15 20.5 L10.6 16.1 A6.3 6.3 0 0 1 19.4 16.1 Z" fill="currentColor" stroke="none"/><path d="M5.8 11.6 A13 13 0 0 1 24.2 11.6"/><path d="M1.8 7 A19 19 0 0 1 28.2 7"/></svg>
  <svg width="50" height="24" viewBox="0 0 50 24" fill="currentColor"><rect x="1" y="1" width="42" height="22" rx="7" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-width="2"/><rect x="4.5" y="4.5" width="31" height="15" rx="4"/><path d="M46 8.5 v7 a3.5 3.5 0 0 0 0 -7z" fill-opacity=".45"/></svg>
</span>`

function phoneMarkup(id, screens) {
  return `<div class="phone" id="${id}"><div class="bezel"></div><div class="screen">
    ${screens.map((s, i) => `<img id="${id}-sc${i}" src="${APP}/${s}.png" alt="">`).join('')}
    <div class="status"><span>9:41</span>${statusIcons()}</div>
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
    <div id="chipPop" class="abs sticker" style="left:630px;top:1285px"><span class="emoji">${picto('pencil', { size: 60, spot: soft('#E4572E'), weight: 2 })}</span>Dessin</div>`
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
  // Le doigt appuie au centre de l'élément, sauf sur le bouton : sur sa flèche, comme dans la scène 2.
  const TAP_ON = { bouton: 'fleche' }
  ;['bouton', 'ennui', 'dessin', 'cinqMinutes'].forEach((name, i) => {
    const t0 = T.taps[i]
    const [x, y] = zc(TAP_ON[name] ?? name)
    const z = zones[name]
    set(touch, t0 - 0.2, { x: x + 90, y: y + 160, scale: 1 })
    tw(touch, t0 - 0.2, 0.08, { opacity: [0, 0.95] })
    tw(touch, t0 - 0.199, 0.18, { x, y }, ease.out3)
    tw(touch, t0, 0.07, { scale: 0.75 }, ease.out2)
    tw(touch, t0 + 0.07, 0.12, { scale: 1 }, ease.out2)
    tw(touch, t0 + 0.2, 0.12, { opacity: 0 }, ease.in2)
    set(ring, t0, { x, y })
    tw(ring, t0, 0.4, { scale: [0.6, 2.8], opacity: [0.95, 0] }, ease.out2)
    set(hl, t0, { left: z.x * SS - 8, top: z.y * SS + SB - 8, w: z.w * SS + 16, h: z.h * SS + 16, radius: name === 'bouton' ? 52 : 28 })
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
  { clip: 'dessin', word: 'DESSIN', picto: 'pencil', color: '#E4572E', title: 'Croquis express', sub: 'Dessin · 5 min' },
  { clip: 'musique', word: 'MUSIQUE', picto: 'guitar', color: '#13A89E', title: 'Body percussion', sub: 'Musique · 5 min' },
  { clip: 'cuisine', word: 'CUISINE', picto: 'chef-hat', color: '#C9971A', title: 'Galettes à la poêle', sub: 'Cuisine · 15 min' },
  { clip: 'sport', word: 'SPORT', picto: 'dumbbell', color: '#F08A24', title: 'Secouer le stress', sub: 'Sport · 5 min' },
]

function buildS5() {
  const s5 = $('#s5')
  s5.style.filter = 'url(#hblur)'
  const layers = MONTAGE.map((m, i) => {
    const el = add(s5, `<div class="layer" id="m${i}" style="overflow:hidden"><img class="full-img" alt=""><div class="layer" style="background:linear-gradient(180deg,transparent 55%,rgb(0 0 0 / .45))"></div>
      <div class="label-big" style="top:1150px"></div>
      <div class="abs" style="left:0;width:1080px;top:1360px;display:flex;justify-content:center"><div class="minicard"><div class="bubble">${picto(m.picto, { size: 70, spot: soft(m.color, 50) })}</div><div>${m.title}<div class="sub">${m.sub}</div></div></div></div></div>`)
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
        <circle cx="250" cy="250" r="230" fill="#ffffff" stroke="#111" stroke-width="14"/>
        <circle id="timerArc" cx="250" cy="250" r="190" fill="none" stroke="#CC3615" stroke-width="36" stroke-linecap="round" transform="rotate(-90 250 250)"/>
      </svg>
      <div class="abs" style="left:0;top:95px;width:500px;text-align:center;font-weight:900;font-size:230px;line-height:1;color:#191613;font-variant-numeric:tabular-nums"><span id="tn0">5</span></div>
      <div class="abs" style="left:0;top:95px;width:500px;text-align:center;font-weight:900;font-size:230px;line-height:1;color:#191613"><span id="tn1">15</span></div>
      <div class="abs" style="left:0;top:95px;width:500px;text-align:center;font-weight:900;font-size:230px;line-height:1;color:#CC3615"><span id="tn2">30</span></div>
      <div class="abs" id="tmin" style="left:0;top:330px;width:500px;text-align:center;font-weight:900;font-size:70px;letter-spacing:.06em;color:#5d5853">MIN</div>
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
    <div id="st1wrap" class="abs" style="left:40px;top:560px"><div class="sticker" id="st1"><span class="emoji">${picto('shapes', { size: 62, spot: soft('#F2B632', 60), weight: 2 })}</span><span class="num">13</span> envies transformées</div></div>
    <div id="st2wrap" class="abs" style="left:430px;top:1090px"><div class="sticker" id="st2"><span class="emoji">${picto('flame', { size: 62, spot: soft('#cc3615', 45), weight: 2 })}</span><span class="num" id="st2n">1</span> jours de série</div></div>`
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
      <div id="endIcon" class="abs" style="left:420px;top:330px;width:240px;height:240px;filter:drop-shadow(0 30px 40px rgb(204 54 21 / .35))">${APP_MARK}</div>
      <div id="e1" class="abs display logo-line" style="top:620px">plutôt que</div>
      <div id="e2" class="abs display logo-line" style="top:770px"><span id="eword" style="position:relative;display:inline-block">scroller</span></div>
      <div class="cta" id="cta"><div class="ring"></div><div class="ring"></div><div class="pill">Essaie l’appli ${lineIcon('<path d="M5 12h14M13 6l6 6-6 6"/>', 58, 3)}</div></div>
      <div id="bio" class="abs" style="left:0;width:1080px;top:1525px;text-align:center;font-size:40px;font-weight:700;color:#5d5853">Lien en bio</div>
      <div id="endBubbles" class="layer"></div>
    </div>
    <div id="band" class="layer" style="background:#CC3615"></div>`
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
    `<svg viewBox="0 0 100 12" preserveAspectRatio="none" style="position:absolute;left:-4%;top:52%;width:108%;height:0.45em;transform:translateY(-50%);overflow:visible"><path id="estrike" d="M2 7 Q 14 1 26 6 T 50 6 T 74 6 T 98 4" fill="none" stroke="#CC3615" stroke-width="3.4" stroke-linecap="round"/></svg>`,
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
  // Les passions autour du logo : pictogrammes de l'app, chacun sur la couleur de sa famille
  const bubbles = [
    ['palette', '#E4572E', 150, 250], ['clapperboard', '#9B5DE5', 930, 270], ['notebook-pen', '#3D7DD8', 100, 1480], ['headphones', '#13A89E', 980, 1460],
    ['footprints', '#F08A24', 120, 1720], ['hammer', '#C9971A', 960, 1740], ['puzzle', '#D6457A', 110, 700], ['sprout', '#4F9D69', 970, 640],
  ]
  const layer = $('#endBubbles')
  bubbles.forEach(([name, color, x, y], i) => {
    const wrap = add(layer, `<div class="abs" style="left:${x - 70}px;top:${y - 70}px"><div class="bubble-float">${picto(name, { size: 84, spot: soft(color, 50) })}</div></div>`)
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
