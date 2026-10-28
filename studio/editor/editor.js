/**
 * Éditeur du studio : aperçu de l'épisode, lecture synchronisée au son, timeline,
 * liste des événements, rechargement automatique quand le fichier change.
 */
import { Studio } from '../engine/studio.js'

const $ = (id) => document.getElementById(id)
const view = $('view')
const tl = $('tl')
const audio = $('audio')
const params = new URLSearchParams(location.search)

let studio = null
let ep = null
let epId = params.get('ep')
let t = Number(params.get('t') ?? 0)
let playing = false
let lastTick = 0
let mtime = 0
let audioReady = false
let loopShot = null

function status(msg, error = false) {
  const s = $('status')
  s.textContent = msg
  s.className = `status ${msg ? 'show' : ''} ${error ? 'error' : ''}`
}

const fmt = (x) => {
  const m = Math.floor(x / 60)
  const s = (x % 60).toFixed(2).padStart(5, '0')
  return `${m}:${s}`
}

async function listEpisodes() {
  const list = await (await fetch('/api/episodes')).json()
  const sel = $('episode')
  sel.innerHTML = list.map((e) => `<option value="${e}">${e.replace(/_/g, ' ')}</option>`).join('')
  if (!epId || !list.includes(epId)) epId = list[list.length - 1]
  sel.value = epId
  sel.onchange = () => {
    epId = sel.value
    history.replaceState(null, '', `?ep=${epId}`)
    t = 0
    load()
  }
}

async function load(keepTime = false) {
  try {
    status('Chargement…')
    mtime = await (await fetch(`/api/mtime?ep=${epId}`)).json()
    ep = (await import(`../episodes/${epId}.js?v=${mtime}`)).default
    const s = new Studio(view, ep)
    await s.load()
    studio = s
    if (!keepTime) t = Math.min(t, ep.duration)
    $('title').textContent = ep.title ?? epId
    buildEvents()
    draw()
    status('')
    loadAudio()
  } catch (e) {
    console.error(e)
    status(`Erreur dans l'épisode :\n${e.message}`, true)
  }
}

async function loadAudio() {
  audioReady = false
  if (!$('sound').checked) return
  try {
    const res = await fetch(`/api/audio?ep=${epId}&v=${mtime}`)
    if (!res.ok) throw new Error(await res.text())
    const blob = await res.blob()
    audio.src = URL.createObjectURL(blob)
    await new Promise((r) => (audio.oncanplaythrough = r))
    audioReady = true
    if (playing) {
      audio.currentTime = t
      audio.play()
    }
  } catch (e) {
    console.warn('Son indisponible', e)
  }
}

function draw() {
  if (!studio) return
  studio.render(t, { safe: $('safe').checked, debug: $('debug').checked })
  $('time').textContent = `${fmt(t)} / ${fmt(ep.duration)}`
  drawTimeline()
  highlightEvents()
}

// ------------------------------------------------------------------ lecture

function play() {
  if (!studio) return
  if (t >= ep.duration - 0.01) t = 0
  playing = true
  $('play').textContent = '❚❚'
  lastTick = performance.now()
  if (audioReady && $('sound').checked && Number($('speed').value) === 1) {
    audio.currentTime = t
    audio.play()
  }
  requestAnimationFrame(tick)
}

function pause() {
  playing = false
  $('play').textContent = '▶︎'
  audio.pause()
}

function tick(now) {
  if (!playing) return
  const speed = Number($('speed').value)
  if (audioReady && !audio.paused) t = audio.currentTime
  else t += ((now - lastTick) / 1000) * speed
  lastTick = now
  const end = loopShot ? loopShot[1] : ep.duration
  if (t >= end) {
    if ($('loop').checked || loopShot) {
      t = loopShot ? loopShot[0] : 0
      if (!audio.paused) audio.currentTime = t
    } else {
      t = ep.duration
      pause()
    }
  }
  draw()
  requestAnimationFrame(tick)
}

function seek(x) {
  t = Math.max(0, Math.min(ep?.duration ?? 0, x))
  if (playing && !audio.paused) audio.currentTime = t
  draw()
}

// ------------------------------------------------------------------ timeline

const COLORS = ['#ffcc33', '#9b5de5', '#4dabf7', '#69db7c', '#ff8787', '#f783ac', '#ffa94d']
function lanes() {
  const ids = ['(scène)', ...Object.keys(ep.cast ?? {})]
  return ids
}

function drawTimeline() {
  const dpr = devicePixelRatio || 1
  const w = tl.clientWidth
  const h = tl.clientHeight
  if (tl.width !== w * dpr) {
    tl.width = w * dpr
    tl.height = h * dpr
  }
  const c = tl.getContext('2d')
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.clearRect(0, 0, w, h)
  const L = 110
  const X = (x) => L + (x / ep.duration) * (w - L - 12)
  const ids = lanes()
  const lh = Math.min(20, (h - 34) / ids.length)
  c.font = '11px system-ui'
  // graduations
  c.fillStyle = '#a99bb8'
  for (let s = 0; s <= ep.duration; s++) {
    c.fillRect(X(s), 0, 1, s % 5 ? 5 : 10)
    if (s % 5 === 0) c.fillText(`${s}s`, X(s) + 3, 11)
  }
  // musique
  for (const m of ep.music ?? []) {
    c.fillStyle = 'rgba(155,93,229,0.35)'
    c.fillRect(X(m.t0), 14, X(m.t1) - X(m.t0), 8)
    c.fillStyle = '#d0b4f0'
    c.fillText(m.style, X(m.t0) + 3, 21)
  }
  ids.forEach((id, i) => {
    const y = 26 + i * lh
    c.fillStyle = i % 2 ? '#261d2f' : '#2a2033'
    c.fillRect(0, y, w, lh)
    c.fillStyle = '#d6cbe3'
    c.fillText(id, 6, y + lh * 0.7)
    const color = COLORS[i % COLORS.length]
    for (const e of ep.track ?? []) {
      if ((e.a ?? '(scène)') !== id) continue
      const x = X(e.t)
      const dur = e.dur ?? (['walk', 'jump', 'hop', 'cheer', 'wave'].includes(e.do) ? 0.5 : 0)
      c.fillStyle = color
      c.globalAlpha = 0.85
      if (dur > 0) c.fillRect(x, y + 3, Math.max(2, X(e.t + dur) - x), lh - 6)
      else c.fillRect(x - 1, y + 2, 3, lh - 4)
      c.globalAlpha = 1
    }
  })
  // tête de lecture
  c.fillStyle = '#ffcc33'
  c.fillRect(X(t) - 1, 0, 2, h)
  if (loopShot) {
    c.fillStyle = 'rgba(255,204,51,0.12)'
    c.fillRect(X(loopShot[0]), 0, X(loopShot[1]) - X(loopShot[0]), h)
  }
  tl._X = { L, w }
}

function tlTime(ev) {
  const r = tl.getBoundingClientRect()
  const { L, w } = tl._X
  return ((ev.clientX - r.left - L) / (w - L - 12)) * ep.duration
}
let dragging = false
tl.addEventListener('pointerdown', (e) => {
  dragging = true
  tl.setPointerCapture(e.pointerId)
  seek(tlTime(e))
})
tl.addEventListener('pointermove', (e) => dragging && seek(tlTime(e)))
tl.addEventListener('pointerup', () => (dragging = false))

// ------------------------------------------------------------------ événements

function describe(e) {
  const skip = ['t', 'a', 'do', '_i']
  const args = Object.entries(e)
    .filter(([k]) => !skip.includes(k))
    .map(([k, v]) => `${k}: ${typeof v === 'number' ? Math.round(v * 100) / 100 : JSON.stringify(v)}`)
    .join(', ')
  return `<b>${e.a ? e.a + ' · ' : ''}${e.do}</b> ${args}`
}

function buildEvents() {
  const box = $('events')
  const evs = [...(ep.track ?? [])].sort((a, b) => a.t - b.t)
  box.innerHTML = evs.map((e, i) => `<div class="ev" data-t="${e.t}"><span class="t">${e.t.toFixed(2)}</span><span>${describe(e)}</span></div>`).join('')
  box.querySelectorAll('.ev').forEach((el) => (el.onclick = () => seek(Number(el.dataset.t) + 0.001)))
}

function highlightEvents() {
  let current = null
  document.querySelectorAll('.ev').forEach((el) => {
    const et = Number(el.dataset.t)
    el.classList.toggle('past', et < t - 0.5)
    el.classList.remove('now')
    if (et <= t) current = el
  })
  current?.classList.add('now')
}

// ------------------------------------------------------------------ commandes

$('play').onclick = () => (playing ? pause() : play())
$('start').onclick = () => seek(0)
$('prev').onclick = () => seek(Math.round(t * 30 - 1) / 30)
$('next').onclick = () => seek(Math.round(t * 30 + 1) / 30)
for (const id of ['safe', 'debug']) $(id).onchange = draw
$('sound').onchange = () => ($('sound').checked ? loadAudio() : (audio.pause(), (audioReady = false)))
$('speed').onchange = () => {
  if (Number($('speed').value) !== 1) audio.pause()
  else if (playing && audioReady) {
    audio.currentTime = t
    audio.play()
  }
}
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT') return
  if (e.code === 'Space') {
    e.preventDefault()
    playing ? pause() : play()
  } else if (e.key === 'ArrowLeft') seek(e.shiftKey ? t - 1 : Math.round(t * 30 - 1) / 30)
  else if (e.key === 'ArrowRight') seek(e.shiftKey ? t + 1 : Math.round(t * 30 + 1) / 30)
  else if (e.key === 'Home') seek(0)
  else if (e.key.toLowerCase() === 'l') {
    // boucle sur les 3 secondes autour de la tête de lecture
    loopShot = loopShot ? null : [Math.max(0, t - 0.5), Math.min(ep.duration, t + 2.5)]
    draw()
  }
})
addEventListener('resize', drawTimeline)

// rechargement automatique quand l'épisode est modifié
setInterval(async () => {
  if (!epId) return
  try {
    const m = await (await fetch(`/api/mtime?ep=${epId}`)).json()
    if (m !== mtime) load(true)
  } catch {}
}, 1000)

await listEpisodes()
await load()
window.done = true
