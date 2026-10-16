/**
 * ============================================================================
 *  Pub Scroll-up « Envol » — 30 s, 1080 × 1920, sans voix off
 * ============================================================================
 *  0 → 4 s    Dans le noir, tes minutes tombent une à une dans un écran vide.
 *  4 → 6 s    Tout se fige. Minuton entre et en rattrape une : « Sauf celle-là. »
 *  6 → 8 s    « Et si tu scrollais… vers le haut ? » Un pouce trace le geste,
 *             la gravité s'inverse, la couleur arrive.
 *  8 → 18 s   Une seule montée de caméra : cinq étages, cinq passions, cinq
 *             minutes chacune. Le compteur de minutons grimpe (+5 à chaque étage).
 *  18 → 21 s  Le sommet, sous l'aurore de l'app : 25 minutons, les tenues de
 *             Minuton, un thème, une mélodie.
 *  21 → 25 s  L'app : le geste Swipe Up, l'activité, la création rangée.
 *  25 → 30 s  Scroll-up. « Scrolle vers le haut. »
 *
 *  Tout est une fonction du temps (../engine.js) : window.__promo.seek(t).
 */

import { clamp, ease, finalize, lerp, mixColor, onFrame, prog, rng, seek, set, tw } from '../engine.js'
import { DURATION, FALLS, FALL_TIME, FLOORS, FPS, T } from './cues.js'

const H = 1920
const ART = '../../app/public/art/'
const $ = (s) => document.querySelector(s)

function add(parent, markup) {
  parent.insertAdjacentHTML('beforeend', markup)
  return parent.lastElementChild
}

/** Découpe un élément en lignes (<br>) puis en mots animables (un <span> coloré reste entier). */
function splitWords(el) {
  const lines = el.innerHTML.split(/<br\s*\/?>/)
  el.innerHTML = lines
    .map((line) => {
      const parts = line.split(/(<[^>]+>[^<]*<\/[^>]+>|\s+)/).filter((p) => p && p.trim())
      return `<div>${parts.map((p) => `<span class="w">${p}</span>`).join(' ')}</div>`
    })
    .join('')
  return [...el.querySelectorAll('.w')]
}

function rise(words, times, { dy = 70, dur = 0.38 } = {}) {
  words.forEach((w, i) => {
    const t = times[i] ?? times[times.length - 1] + (i - times.length + 1) * 0.08
    tw(w, t, 0.001, { opacity: [0, 1] })
    tw(w, t, dur, { y: [dy, 0], blur: [10, 0] }, ease.out4)
  })
}

function pop(el, t, { from = 0.2, dur = 0.42, s = 1.8 } = {}) {
  tw(el, t, 0.001, { opacity: [0, 1] })
  tw(el, t, dur, { scale: [from, 1] }, ease.back(s))
}

function out(el, t, dur = 0.2, props = {}) {
  tw(el, t, dur, { opacity: 0, ...props }, ease.in2)
}

const minutonImg = (pose) => `url('${ART}minuton-${pose}.webp')`

// ---------------------------------------------------------- caméra (altitude)

const MOVES = [[7.5, 0.62, 0, H, ease.io3]]
FLOORS.forEach((f, k) => MOVES.push([f + 1.78, 0.44, H * (k + 1), H * (k + 2), ease.io4]))

function alt(t) {
  let a = 0
  for (const [t0, d, from, to, e] of MOVES) if (t >= t0) a = lerp(from, to, e(clamp((t - t0) / d)))
  return a
}

const SKY = ['#ffe3b8', '#ffe0b5', '#ffc9b0', '#f7a3bf', '#b98cff', '#5b34d6', '#0b0f33', '#060e29']
function skyAt(a) {
  const u = clamp(a / H, 0, SKY.length - 1.001)
  const i = Math.floor(u)
  return mixColor(SKY[i], SKY[i + 1], u - i)
}

// ------------------------------------------------------------------- décor

const sky = $('#sky')
const stars = $('#stars')
const world = $('#world')
const fall = $('#fall')
const hud = $('#hud')
const hero = $('#hero')
const phoneLayer = $('#phoneLayer')
const endLayer = $('#endLayer')
const fx = $('#fx')

const r = rng(7)
const starEls = Array.from({ length: 70 }, () => {
  const s = 3 + r() * 7
  const el = add(stars, `<i class="abs" style="width:${s}px;height:${s}px;border-radius:50%;background:#fff;box-shadow:0 0 ${s * 2}px #fff"></i>`)
  return { el, x: r() * 1080, y: r() * 2400, tw: r() * 6 }
})
const streaks = Array.from({ length: 26 }, () => {
  const el = add(stars, `<i class="abs" style="width:${6 + r() * 6}px;height:70px;border-radius:10px;background:#ffffffaa"></i>`)
  return { el, x: 60 + r() * 960, y: r() * 2400, k: 0.35 + r() * 0.5 }
})

// ------------------------------------------------------- 1 · la chute (0 → 4)

const voidEl = add(fall, `<div id="void">${Array.from({ length: 9 }, (_, i) => `<div class="feed" style="top:${40 + i * 180}px"></div>`).join('')}</div>`)
const feeds = [...voidEl.querySelectorAll('.feed')]

const CATCH = FALLS.indexOf(3.125)
const tokenEls = FALLS.map((f, i) => {
  const el = add(fall, `<div class="token"><span><b>1</b>min</span></div>`)
  fall.insertBefore(el, voidEl) // le vide passe devant : les minutes s'y enfoncent
  const x = i === CATCH ? 700 : 170 + ((i * 0.618 * 740 + r() * 160) % 740)
  return { el, f, x, spin: (r() - 0.5) * 400 }
})

const lines1 = add(fall, `<div class="title" style="top:170px;font-size:116px">Chaque jour,<br>tes <span class="y">minutes</span><br>tombent<br>dans le vide.</div>`)
rise(splitWords(lines1), [0.4, 0.6, 1.25, 1.45, 1.75, 2.5, 2.62, 2.75])
out(lines1, T.freeze, 0.25, { y: -40 })

tw(voidEl, 7.45, 0.6, { y: [0, 900] }, ease.in3)
tw(fall, T.freeze, 0.5, { scale: [1, 1.035] }, ease.out3)

// le pouce trace le geste vers le haut
const swipe = add(fall, `<svg class="abs" style="left:0;top:0" width="1080" height="1920"><path id="trail" d="M540 1720 C 560 1300, 520 900, 540 420" fill="none" stroke="#fff" stroke-width="36" stroke-linecap="round" opacity="0.9"/></svg>`)
const trail = swipe.querySelector('#trail')
set(trail, 0, { d0: 0, d1: 0 })
tw(trail, T.up, 0.34, { d1: [0, 1] }, ease.io3)
tw(trail, T.up + 0.3, 0.3, { d0: [0, 1] }, ease.in2)
const thumb = add(fall, `<div id="thumb"></div>`)
set(thumb, 0, { opacity: 0, x: 540, y: 1720 })
tw(thumb, T.up - 0.12, 0.12, { opacity: [0, 1], scale: [1.4, 1] }, ease.out3)
tw(thumb, T.up, 0.34, { y: [1720, 420] }, ease.io3)
tw(thumb, T.up + 0.34, 0.2, { opacity: 0, scale: 0.6 }, ease.in2)

const saufUne = add(fall, `<div class="title center" style="top:230px">Sauf<br><span class="y">celle-là.</span></div>`)
rise(splitWords(saufUne), [T.saufUne, T.saufUne + 0.25])
out(saufUne, 5.85, 0.2, { y: -30 })

const question = add(fall, `<div class="title center" style="top:200px;font-size:112px">Et si tu<br>scrollais…</div>`)
rise(splitWords(question), [6.0, 6.25, 6.5, 6.75])
const up = add(fall, `<div class="title center" style="top:470px;font-size:150px;letter-spacing:-5px"><span class="y">vers le haut ?</span></div>`)
pop(up, T.up, { from: 0.4, s: 2.2 })
tw([question, up], T.reverse, 0.5, { y: -1400 }, ease.in3)

onFrame((t) => {
  const tf = Math.min(t, T.freeze)
  for (const tok of tokenEls) {
    const { el, f, x, spin } = tok
    if (t < f) {
      el.style.visibility = 'hidden'
      continue
    }
    const p = (tf - f) / FALL_TIME
    const caught = tokenEls.indexOf(tok) === CATCH && t >= T.catch
    if (p >= 1.15 || caught) {
      el.style.visibility = 'hidden'
      continue
    }
    let y = -150 + 1830 * p * p
    let sy = 1
    if (t > T.reverse) {
      const u = t - T.reverse
      y -= 4200 * u * u
      sy = 1 + Math.min(0.5, u * 2)
    }
    el.style.visibility = ''
    const spun = spin * (tf - f) * (t > T.reverse ? Math.max(0, 1 - (t - T.reverse) * 6) : 1)
    el.style.transform = `translate(${x}px, ${y}px) scale(${(1 / Math.sqrt(sy)).toFixed(3)}, ${sy.toFixed(3)}) rotate(${spun.toFixed(1)}deg)`
  }
  // le fil gris défile dans le vide, puis s'arrête net
  const scroll = (tf * 900) % 180
  feeds.forEach((el, i) => (el.style.transform = `translateY(${-scroll}px)`))
})

// ------------------------------------------------------ Minuton (héros)

function pose(name, { left, top, w, h }) {
  return add(hero, `<div class="minuton" style="left:${left}px;top:${top}px;width:${w}px;height:${h}px;background-image:${minutonImg(name)}"></div>`)
}

// il entre, attrape une minute, réfléchit, puis s'envole
const mApproved = pose('approved', { left: 520, top: 790, w: 520, h: 540 })
set(mApproved, 0, { opacity: 0 })
tw(mApproved, T.minuton, 0.001, { opacity: [0, 1] })
tw(mApproved, T.minuton, 0.32, { x: [700, 0], rot: [18, -4] }, ease.out4)
tw(mApproved, T.catch, 0.3, { rot: [-4, 0], sy: [0.88, 1], sx: [1.1, 1] }, ease.back(2))
set(mApproved, 6.0, { opacity: 0 })

const mThink = pose('think', { left: 560, top: 820, w: 470, h: 495 })
set(mThink, 0, { opacity: 0 })
tw(mThink, 6.0, 0.001, { opacity: [0, 1] })
tw(mThink, 6.0, 0.3, { sy: [0.85, 1], sx: [1.12, 1] }, ease.back(2.2))
set(mThink, T.reverse - 0.05, { opacity: 0 })

const mJump = pose('cheer', { left: 520, top: 840, w: 520, h: 475 })
set(mJump, 0, { opacity: 0 })
tw(mJump, T.reverse - 0.05, 0.001, { opacity: [0, 1] })
tw(mJump, T.reverse - 0.05, 0.12, { sy: [0.7, 1.2], sx: [1.2, 0.9] }, ease.out3)
tw(mJump, T.reverse + 0.05, 0.4, { y: [0, -1500] }, ease.in3)

// la minute attrapée
const held = add(hero, `<div class="token"><span><b>1</b>min</span></div>`)
set(held, 0, { opacity: 0 })
const heldFrom = { x: 700, y: -150 + 1830 * ((T.freeze - 3.125) / FALL_TIME) ** 2 }
tw(held, T.catch, 0.001, { opacity: [0, 1], x: heldFrom.x, y: heldFrom.y })
tw(held, T.catch, 0.16, { x: [heldFrom.x, 618], y: [heldFrom.y, 950], scale: [1, 1.15] }, ease.out3)
tw(held, 6.0, 0.4, { x: 790, y: 700, scale: 1 }, ease.io3)
tw(held, T.reverse + 0.02, 0.4, { y: [700, -1000] }, ease.in3)
const halo = add(hero, `<div class="abs" style="left:0;top:0;width:300px;height:300px;margin:-150px;border-radius:50%;background:radial-gradient(#fff8c0aa,#ffe46a33 45%,transparent 70%)"></div>`)
set(halo, 0, { opacity: 0 })

onFrame((t) => {
  // halo de la minute rattrapée
  if (t >= T.catch && t < T.reverse) {
    const hx = t < 6 ? 618 : lerp(618, 790, prog(t, 6, 0.4, ease.io3))
    const hy = t < 6 ? 950 : lerp(950, 700, prog(t, 6, 0.4, ease.io3))
    const s = 1 + 0.12 * Math.sin((t - T.catch) * 9)
    halo.style.visibility = ''
    halo.style.opacity = String(Math.min(1, (t - T.catch) * 4))
    halo.style.transform = `translate(${hx}px, ${hy}px) scale(${s})`
  } else halo.style.visibility = 'hidden'
  // il flotte un peu en attendant
  if (t > 6.3 && t < T.reverse) mThink.style.translate = `0 ${(Math.sin((t - 6.3) * 4) * 10).toFixed(1)}px`
})

// la couleur arrive
const gloom = $('#gloom')
tw(gloom, T.reverse, 0.55, { opacity: [1, 0] }, ease.in2)
const flash = add(fx, `<div id="flash"></div>`)
set(flash, 0, { opacity: 0 })
tw(flash, T.reverse, 0.08, { opacity: [0, 0.55] }, ease.out2)
tw(flash, T.reverse + 0.08, 0.35, { opacity: 0 }, ease.out2)

// ---------------------------------------------------- 2 · les cinq étages

const FLOOR_DATA = [
  { p: 1, name: 'Dessin', l: 'Dessine<br>ta tasse.', pose: 'draw', rot: -3 },
  { p: 2, name: 'Écriture', l: 'Écris<br>trois lignes.', pose: 'write', rot: 3 },
  { p: 3, name: 'Cinéma', l: 'Décortique<br>une scène.', pose: 'think', rot: -3 },
  { p: 4, name: 'Musique', l: 'Découvre<br>un son.', pose: 'idea', rot: 3 },
  { p: 0, name: 'Piano', l: 'Joue ta<br>mélodie.', pose: 'piano', rot: -3, light: true },
]

FLOOR_DATA.forEach((d, k) => {
  const F = FLOORS[k]
  const floor = add(world, `<div class="floor" style="top:${-H * (k + 1)}px"></div>`)
  const pill = add(floor, `<div class="pill"><i></i>${d.name} · 5 min</div>`)
  const title = add(floor, `<div class="title" style="color:${d.light ? '#fff' : '#24113f'}">${d.l}</div>`)
  const card = add(floor, `<div class="card"><div class="art" style="background-position:${d.p * 25}% 0"></div><div class="plus">+5</div></div>`)
  const plus = card.querySelector('.plus')

  pop(pill, F - 0.05, { from: 0.5 })
  rise(splitWords(title), [F, F + 0.12, F + 0.24], { dy: 90 })
  tw(card, F - 0.3, 0.7, { rot: [d.rot * 4, d.rot], scale: [0.86, 1] }, ease.back(1.6))
  pop(plus, F + 1.25, { from: 0.1, s: 3 })

  // cinq minutes montent et entrent dans la carte
  for (let i = 0; i < 5; i++) {
    const t0 = F + 0.85 + i * 0.06
    const tok = add(floor, `<div class="token" style="width:90px;height:90px;margin:-45px;font-size:0;border-width:5px"></div>`)
    const sx = 160 + i * 190
    set(tok, 0, { opacity: 0 })
    tw(tok, t0, 0.001, { opacity: [0, 1] })
    tw(tok, t0, 0.36, { x: [sx, 700], y: [2050, 1140], rot: [0, 220 * (i % 2 ? 1 : -1)] }, ease.in2)
    tw(tok, t0 + 0.36, 0.08, { opacity: 0, scale: 0.4 }, ease.in2)
  }
  // étincelles
  const rs = rng(100 + k)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const dist = 260 + rs() * 200
    const sp = add(floor, `<div class="spark"></div>`)
    set(sp, 0, { opacity: 0 })
    tw(sp, F + 1.22, 0.001, { opacity: [0, 1], x: 700, y: 1140 })
    tw(sp, F + 1.22, 0.55, { x: 700 + Math.cos(a) * dist, y: 1140 + Math.sin(a) * dist, scale: [1.4, 0.2] }, ease.out3)
    tw(sp, F + 1.6, 0.2, { opacity: 0 }, ease.linear)
  }

  // Minuton change de pose à chaque étage
  const m = pose(d.pose, { left: 30, top: 1250, w: 500, h: 470 })
  set(m, 0, { opacity: 0 })
  tw(m, F - 0.02, 0.001, { opacity: [0, 1] })
  tw(m, F - 0.02, 0.4, { y: [420, 0], sy: [1.25, 1], sx: [0.85, 1] }, ease.back(1.7))
  tw(m, F + 1.8, 0.3, { y: -1600 }, ease.in3)
  set(m, F + 2.1, { opacity: 0 })
})

// ------------------------------------------------------------------ HUD

const counter = add(hud, `<div id="counter"><div class="coin"></div><span id="cnum">0</span><small>minutons</small></div>`)
const cnum = $('#cnum')
set(counter, 0, { opacity: 0 })
tw(counter, 8.0, 0.35, { opacity: [0, 1], y: [-160, 0] }, ease.back(1.5))
FLOORS.forEach((F, k) => {
  set(cnum, F + 1.25, { text: 5 * (k + 1) })
  tw(counter, F + 1.25, 0.3, { scale: [1.22, 1] }, ease.out3)
})
set(cnum, 0, { text: 0 })
tw(counter, 20.9, 0.25, { opacity: 0, y: -160 }, ease.in2)

const track = add(hud, `<div id="track"><div class="fill"></div>${[0, 1, 2, 3, 4].map((i) => `<div class="dot" style="bottom:${i * 222 - 11}px"></div>`).join('')}</div>`)
const fill = track.querySelector('.fill')
set(track, 0, { opacity: 0 })
tw(track, 8.0, 0.3, { opacity: [0, 1], x: [-80, 0] }, ease.out3)
tw(track, 18.0, 0.3, { opacity: 0, x: -80 }, ease.in2)

// --------------------------------------------------------- 3 · le sommet

const summit = add(world, `<div class="floor" style="top:${-H * 6}px;background:url('${ART}home-night.webp') 75% 0 / auto 100% no-repeat"></div>`)
const st1 = add(summit, `<div class="title center" style="top:190px;font-size:112px">25 minutes<br>créées.</div>`)
rise(splitWords(st1), [T.summit, T.summit + 0.12, T.summit + 0.3])
const st2 = add(summit, `<div class="sub" style="top:460px;font-size:64px;font-weight:1000"><span style="color:#ffd568">= 25 minutons gagnés</span></div>`)
pop(st2, T.rule, { from: 0.6 })
out(st1, 19.0, 0.2, { y: -40 })
out(st2, 19.0, 0.2)

const st3 = add(summit, `<div class="title center" style="top:190px;font-size:112px">Dépense-les.</div>`)
rise(splitWords(st3), [19.05])
const st4 = add(summit, `<div class="sub" style="top:340px;color:#d6b8ff">tenues · thèmes · mélodies</div>`)
pop(st4, 19.3, { from: 0.7 })

const mTop = pose('cheer', { left: 290, top: 880, w: 500, h: 457 })
set(mTop, 0, { opacity: 0 })
tw(mTop, T.summit, 0.001, { opacity: [0, 1] })
tw(mTop, T.summit, 0.45, { y: [520, 0], sy: [1.3, 1], sx: [0.8, 1] }, ease.back(1.8))
set(mTop, 19.0, { opacity: 0 })

const COSTUMES = [
  { c: 2, r: 0, label: 'Minuton artiste', price: 40 },
  { c: 3, r: 0, label: 'Minuton pianiste', price: 70 },
]
const costumeEls = COSTUMES.map((c, i) => {
  const el = add(hero, `<div class="costume" style="left:280px;top:780px;width:520px;height:520px;background-position:${c.c * 33.333}% ${c.r * 33.333}%"></div>`)
  const tag = add(hero, `<div class="tag" style="left:0;right:0;margin:auto;width:max-content;top:1340px">${c.label}<span class="price">${c.price}</span></div>`)
  const t0 = T.outfits[i]
  const t1 = i === 0 ? T.outfits[1] : 21.0
  set(el, 0, { opacity: 0 })
  tw(el, t0, 0.001, { opacity: [0, 1] })
  tw(el, t0, 0.32, { sy: [0.75, 1], sx: [1.2, 1], rot: [i ? 8 : -8, 0] }, ease.back(2.4))
  set(el, t1, { opacity: 0 })
  set(tag, 0, { opacity: 0 })
  pop(tag, t0 + 0.08, { from: 0.4 })
  set(tag, t1, { opacity: 0 })
  return el
})

const shop = [
  { left: 60, top: 520, rot: -7, t: T.outfits[2], bg: 'linear-gradient(135deg,#fff0e6,#e68778 55%,#a390ca)', label: 'Thème Crépuscule', price: 120 },
  { left: 620, top: 560, rot: 7, t: T.outfits[3], bg: 'linear-gradient(135deg,#b6cdff,#ffe6a7)', label: 'Lettre à Élise', price: 160, notes: true },
].map((s) => {
  const el = add(hero, `<div class="shopcard" style="left:${s.left}px;top:${s.top}px;background:${s.bg}">${s.notes ? `<svg class="abs" style="left:40px;top:40px" width="200" height="140" viewBox="0 0 200 140"><g fill="#24113f"><ellipse cx="40" cy="110" rx="26" ry="19"/><ellipse cx="150" cy="90" rx="26" ry="19"/></g><path d="M64 110 V 20 L 174 4 V 90" stroke="#24113f" stroke-width="10" fill="none"/></svg>` : ''}<div class="lbl">${s.label}</div><div class="price">${s.price}</div></div>`)
  el.style.width = '400px'
  set(el, 0, { opacity: 0 })
  tw(el, s.t, 0.001, { opacity: [0, 1] })
  tw(el, s.t, 0.4, { scale: [0.3, 1], rot: [s.rot * 4, s.rot], y: [200, 0] }, ease.back(1.8))
  tw(el, 20.95, 0.2, { opacity: 0, y: -100 }, ease.in2)
  return el
})
tw([st3, st4], 20.95, 0.2, { opacity: 0, y: -60 }, ease.in2)

// ---------------------------------------------------------- 4 · l'app

const dim = add(phoneLayer, `<div class="layer" style="background:#060e29"></div>`)
set(dim, 0, { opacity: 0 })
tw(dim, 20.95, 0.3, { opacity: [0, 0.55] }, ease.out2)
tw(dim, T.end, 0.3, { opacity: 0 }, ease.in2)

const appT1 = add(phoneLayer, `<div class="title center" style="top:110px;font-size:104px">Un geste<br><span class="y">vers le haut.</span></div>`)
rise(splitWords(appT1), [T.appLine, T.appLine + 0.15, T.appLine + 0.4, T.appLine + 0.5, T.appLine + 0.6])
out(appT1, 22.85, 0.15, { y: -30 })
const appT2 = add(phoneLayer, `<div class="title center" style="top:110px;font-size:104px">5 minutes.<br><span class="y">Une création.</span></div>`)
rise(splitWords(appT2), [T.appLine2, T.appLine2 + 0.15, T.appLine2 + 0.5, T.appLine2 + 0.65])
out(appT2, 24.8, 0.2, { y: -30 })

const CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 6-6 6 6"/><path d="m6 20 6-6 6 6" opacity=".5"/></svg>`
const MUG = `<g fill="none" stroke="#24113f" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
  <path class="mg" d="M70 70 L 90 250 Q 92 268 112 268 L 228 268 Q 248 268 250 250 L 270 70 Z"/>
  <path class="mg" d="M268 110 Q 330 110 326 160 Q 322 212 258 210"/>
  <path class="mg" d="M130 50 Q 115 25 135 5"/><path class="mg" d="M180 50 Q 165 25 185 5"/>
  <path class="mg" d="M110 150 Q 170 175 230 150" stroke="#903cf8"/></g>`

const phone = add(phoneLayer, `<div id="phone"><div id="screen">
  <div class="scr" id="scr1">
    <div class="appbar"><span>Scroll-up</span><span class="wallet"><i></i>25</span></div>
    <div class="greet">Envie de<br>scroller ?</div>
    <div class="minuton" style="left:120px;top:430px;width:380px;height:400px;background-image:${minutonImg('welcome')}"></div>
    <div id="tirette">${CHEVRON}Swipe Up</div>
    <div class="tabbar"><b>Créer</b><span>Progresser</span><span>Galerie</span></div>
  </div>
  <div class="scr" id="scr2">
    <div class="chip">Dessin · 5 min</div>
    <div class="consigne">Dessine un objet de ton bureau.</div>
    <svg id="ring" viewBox="0 0 360 360"><circle cx="180" cy="180" r="150" fill="none" stroke="#f0e4ff" stroke-width="30"/><circle id="arc" cx="180" cy="180" r="150" fill="none" stroke="#903cf8" stroke-width="30" stroke-linecap="round" transform="rotate(-90 180 180)"/></svg>
    <div id="ringNum" class="abs" style="left:130px;top:560px;width:360px;height:360px;display:grid;place-items:center;font-weight:1000;font-size:92px;color:#24113f">5:00</div>
    <svg class="sketch" viewBox="0 0 340 280" style="left:140px">${MUG}</svg>
  </div>
  <div class="scr" id="scr3">
    <div class="bravo">Bravo !</div>
    <div class="gcard"><svg viewBox="0 0 340 280">${MUG}</svg><div class="cap">Dessine un objet de ton bureau.<small>Rangé dans ta galerie</small></div></div>
    <div class="earn">+5 minutons</div>
  </div>
</div></div>`)
const scr1 = $('#scr1')
const scr2 = $('#scr2')
const scr3 = $('#scr3')
const tirette = $('#tirette')
set(phone, 0, { opacity: 0 })
tw(phone, T.phone, 0.001, { opacity: [0, 1] })
tw(phone, T.phone, 0.55, { y: [1700, 0], rot: [10, 0] }, ease.out4)
tw(phone, 24.75, 0.4, { y: -1900, rot: -6 }, ease.in3)

const pthumb = add(phoneLayer, `<div id="thumb"></div>`)
set(pthumb, 0, { opacity: 0, x: 540, y: 1480 })
tw(pthumb, T.swipe - 0.2, 0.15, { opacity: [0, 1], scale: [1.5, 1] }, ease.out3)
tw(pthumb, T.swipe, 0.36, { y: [1480, 760] }, ease.io3)
tw(pthumb, T.swipe + 0.36, 0.15, { opacity: 0 }, ease.in2)
tw(tirette, T.swipe, 0.36, { y: [0, -520] }, ease.io3)
tw(scr1, T.swipe + 0.2, 0.32, { y: [0, -1300] }, ease.in3)
set(scr2, 0, { y: 1300 })
tw(scr2, T.swipe + 0.2, 0.38, { y: [1300, 0] }, ease.out4)
set(scr3, 0, { x: 620 })
tw(scr3, T.screen3, 0.35, { x: [620, 0] }, ease.out4)
tw(scr2, T.screen3, 0.35, { x: [0, -620] }, ease.out4)
pop($('#scr3 .earn'), T.screen3 + 0.25, { from: 0.3, s: 2.5 })
pop($('#scr3 .bravo'), T.screen3 + 0.1, { from: 0.5 })

const arc = $('#arc')
const ringNum = $('#ringNum')
const sketchPaths = [...document.querySelectorAll('#scr2 .mg')]
sketchPaths.forEach((p, i) => {
  set(p, 0, { d0: 0, d1: 0 })
  tw(p, 22.75 + i * 0.22, 0.32, { d1: [0, 1] }, ease.io2)
})
onFrame((t) => {
  const p = prog(t, 22.6, 1.3, ease.io2)
  const L = 2 * Math.PI * 150
  arc.style.strokeDasharray = `${(L * (1 - p)).toFixed(1)} ${L + 10}`
  const left = Math.round(300 * (1 - p))
  ringNum.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
})

// ---------------------------------------------------------- 5 · la fin

const mEnd = add(endLayer, `<div class="minuton" style="left:270px;top:330px;width:540px;height:494px;background-image:${minutonImg('cheer')}"></div>`)
set(mEnd, 0, { opacity: 0 })
tw(mEnd, T.endMinuton, 0.001, { opacity: [0, 1] })
tw(mEnd, T.endMinuton, 0.5, { scale: [0, 1], rot: [-20, 0] }, ease.back(2))
onFrame((t) => {
  if (t > T.endMinuton + 0.5) mEnd.style.translate = `0 ${(Math.sin((t - T.endMinuton) * 3.2) * 14).toFixed(1)}px`
})

const UP = `<svg viewBox="0 0 24 30" fill="none" stroke="#ffd568" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 27V4"/><path d="m4 12 8-8 8 8"/></svg>`
const wordmark = add(endLayer, `<div id="wordmark"><span class="w">Scroll-</span><span class="w y">up</span><span class="w">${UP}</span></div>`)
const wm = [...wordmark.querySelectorAll('.w')]
wm.forEach((w, i) => {
  tw(w, T.wordmark + i * 0.12, 0.001, { opacity: [0, 1] })
  tw(w, T.wordmark + i * 0.12, 0.45, { y: [140, 0], scale: [0.6, 1] }, ease.back(2))
})
tw(wm[2], T.wordmark + 0.6, 0.5, { y: [0, -24] }, ease.out3)
tw(wm[2], T.wordmark + 1.1, 0.5, { y: 0 }, ease.io3)

const tag1 = add(endLayer, `<div class="sub" style="top:1210px;font-size:76px;font-weight:1000">Scrolle vers le haut.</div>`)
rise(splitWords(tag1), [T.tagline, T.tagline + 0.12, T.tagline + 0.24, T.tagline + 0.36])
const tag2 = add(endLayer, `<div class="sub" style="top:1330px;color:#d6b8ff;font-size:48px">5 minutes de création au lieu de scroller.</div>`)
pop(tag2, T.tagline + 0.5, { from: 0.8 })
const cta = add(endLayer, `<div id="cta">Disponible sur Telegram</div>`)
pop(cta, T.cta, { from: 0.3, s: 2.2 })
tw(cta, 28.5, 0.12, { scale: [1, 0.92] }, ease.out2)
tw(cta, 28.62, 0.3, { scale: 1 }, ease.back(3))

// le bouquet final : des minutes qui montent
const rb = rng(29)
for (let i = 0; i < 22; i++) {
  const tok = add(fx, `<div class="token" style="width:96px;height:96px;margin:-48px;font-size:0;border-width:5px"></div>`)
  const x = 60 + rb() * 960
  const t0 = T.final + rb() * 0.35
  set(tok, 0, { opacity: 0 })
  tw(tok, t0, 0.001, { opacity: [0, 1] })
  tw(tok, t0, 1.4 + rb() * 0.6, { x: [x, x + (rb() - 0.5) * 300], y: [2050, -200 - rb() * 300], rot: [0, (rb() - 0.5) * 720], scale: [0.6 + rb() * 0.5, 1] }, ease.out2)
}
tw(flash, T.final, 0.06, { opacity: [0, 0.4] }, ease.out2)
tw(flash, T.final + 0.06, 0.4, { opacity: 0 }, ease.out2)

// -------------------------------------------------------- caméra & ciel

const blurNode = $('#mblurNode')
onFrame((t) => {
  const a = alt(t)
  const v = (alt(t + 1 / 120) - alt(t - 1 / 120)) * 60 // px/s
  world.style.transform = `translateY(${a.toFixed(1)}px)`
  const blur = Math.min(28, Math.abs(v) / 350)
  world.style.filter = blur > 0.3 ? 'url(#mblur)' : 'none'
  blurNode.setAttribute('stdDeviation', `0 ${blur.toFixed(2)}`)
  sky.style.background = `linear-gradient(180deg, ${skyAt(a + H * 0.6)} 0%, ${skyAt(a - H * 0.4)} 100%)`

  const night = clamp((a / H - 4.2) / 1.4)
  const starsOn = Math.max(night, t >= T.end ? 1 : 0)
  for (const s of starEls) {
    const y = (((s.y + a * 0.12) % 2400) + 2400) % 2400 - 240
    s.el.style.transform = `translate(${s.x}px, ${y}px)`
    s.el.style.opacity = (starsOn * (0.45 + 0.55 * Math.abs(Math.sin(t * 1.7 + s.tw)))).toFixed(3)
  }
  const climbing = t > 7.9 && t < 18.4 ? 1 : 0
  for (const s of streaks) {
    const y = (((s.y + a * s.k) % 2400) + 2400) % 2400 - 240
    const show = climbing * clamp(Math.abs(v) / 2500)
    s.el.style.opacity = (show * 0.9).toFixed(3)
    s.el.style.transform = `translate(${s.x}px, ${y}px) scaleY(${1 + Math.min(3, Math.abs(v) / 3000)})`
  }
})

// ------------------------------------------------------------------ départ

async function start() {
  const pics = ['approved', 'think', 'cheer', 'draw', 'write', 'idea', 'piano', 'welcome', 'costumes'].map((p) => `${ART}minuton-${p}.webp`)
  pics.push(`${ART}passions-approved.webp`, `${ART}home-night.webp`)
  await Promise.all(pics.map((src) => new Promise((res, rej) => { const i = new Image(); i.onload = res; i.onerror = () => rej(new Error(`Image introuvable : ${src}`)); i.src = src })))
  await Promise.all(['1000 100px "Nunito Variable"', '800 50px "Nunito Variable"'].map((f) => document.fonts.load(f, 'Aàéèêç’«»·?0123456789')))
  await document.fonts.ready
  finalize()
  seek(0)
}

const ready = start()
window.__promo = { ready, seek, duration: DURATION, fps: FPS }

if (!new URLSearchParams(location.search).has('render')) {
  document.body.classList.add('preview')
  ready.then(() => {
    const scrub = $('#scrub')
    const clock = $('#clock')
    const play = $('#play')
    const audio = new Audio('../build/envol/audio.wav')
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
        return show(DURATION)
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
