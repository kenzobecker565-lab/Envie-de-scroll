/**
 * Musique d'ambiance, en boucle, très douce. Dix styles au choix (jazz noir,
 * lo-fi, piano, bossa nova… et la pluie), ou « au hasard » : un style
 * différent à chaque ouverture. La liste est dans shared/src/ambiances.ts.
 *
 * - Elle démarre au premier toucher (les navigateurs refusent le son avant).
 * - On la coupe ou la remet d'un geste (accueil, réglages) ; le choix et le
 *   style sont gardés sur ce téléphone.
 * - Elle se retire toute seule quand l'app passe en arrière-plan, et pendant
 *   les activités Musique et Cinéma (on écoute ou on regarde autre chose).
 * - Changer de style : fondu de sortie, puis le nouveau morceau en fondu d'entrée.
 *
 * Le volume passe par Web Audio (GainNode) : sur iPhone, le volume d'une
 * balise <audio> ne se règle pas depuis la page.
 */

import { useSyncExternalStore } from 'react'
import { DEFAULT_AMBIANCE, getAmbiance, isAmbianceChoice, resolveAmbiance, type AmbianceChoice, type AmbianceId } from '@scroll-up/shared'

const STORAGE_KEY = 'scroll-up:music'
const STYLE_KEY = 'scroll-up:music-style'
/** Volume de croisière (0 à 1) : un fond, jamais au premier plan. */
const LEVEL = 0.32
const FADE_SECONDS = 1.2
/** Fondu de sortie quand on change de style. */
const SWITCH_SECONDS = 0.35

let enabled = readEnabled()
let choice: AmbianceChoice = readChoice()
/** Le style joué (pour « au hasard », tiré à l'ouverture). */
let current: AmbianceId = resolveAmbiance(choice)
let unlocked = false
const suppressed = new Set<string>()
const listeners = new Set<() => void>()
let snapshot = { enabled, choice, current }

let audio: HTMLAudioElement | undefined
let context: AudioContext | undefined
let gain: GainNode | undefined
let pauseTimer: number | undefined
let switchTimer: number | undefined

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

function readChoice(): AmbianceChoice {
  try {
    const stored = window.localStorage.getItem(STYLE_KEY)
    return isAmbianceChoice(stored) ? stored : DEFAULT_AMBIANCE
  } catch {
    return DEFAULT_AMBIANCE
  }
}

function store(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Stockage indisponible : le choix vaut pour cette ouverture.
  }
}

function notify() {
  snapshot = { enabled, choice, current }
  listeners.forEach((listener) => listener())
}

/** Crée le lecteur (au premier toucher seulement). */
function ensurePlayer(): boolean {
  if (audio) return true
  try {
    audio = new Audio(getAmbiance(current).src)
    audio.loop = true
    audio.preload = 'auto'
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Context) {
      context = new Context()
      gain = context.createGain()
      gain.gain.value = 0
      context.createMediaElementSource(audio).connect(gain).connect(context.destination)
    } else {
      audio.volume = 0
    }
    return true
  } catch {
    audio = undefined
    return false
  }
}

function fadeTo(target: number, seconds = FADE_SECONDS) {
  if (gain && context) {
    const now = context.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(target, now + seconds)
  } else if (audio) {
    audio.volume = target
  }
}

/** Joue ou coupe, selon le choix de l'utilisateur et le moment. */
function apply() {
  const shouldPlay = enabled && unlocked && suppressed.size === 0 && document.visibilityState === 'visible'
  if (shouldPlay) {
    if (!ensurePlayer() || !audio) return
    window.clearTimeout(pauseTimer)
    void context?.resume().catch(() => {})
    audio.play().then(
      () => fadeTo(LEVEL),
      () => {
        // Lecture refusée (réglage du téléphone…) : on réessaiera au prochain toucher.
        unlocked = false
      },
    )
  } else if (audio && !audio.paused) {
    fadeTo(0)
    window.clearTimeout(pauseTimer)
    pauseTimer = window.setTimeout(() => audio?.pause(), FADE_SECONDS * 1000)
  }
  notify()
}

/** Passe au morceau du style `next` : fondu de sortie s'il joue déjà, puis le nouveau. */
function load(next: AmbianceId) {
  current = next
  window.clearTimeout(switchTimer)
  if (!audio) {
    apply()
    return
  }
  const swap = () => {
    if (!audio) return
    audio.src = getAmbiance(current).src
    apply()
  }
  if (audio.paused) swap()
  else {
    fadeTo(0, SWITCH_SECONDS)
    switchTimer = window.setTimeout(swap, SWITCH_SECONDS * 1000)
    notify()
  }
}

/** À appeler une fois au démarrage : attend le premier toucher, suit la visibilité de l'app. */
export function initAmbient(): void {
  const unlock = () => {
    if (unlocked) return
    unlocked = true
    apply()
  }
  window.addEventListener('pointerdown', unlock, { capture: true })
  window.addEventListener('keydown', unlock, { capture: true })
  document.addEventListener('visibilitychange', apply)
}

export function isAmbientEnabled(): boolean {
  return enabled
}

/** Coupe ou remet la musique, et s'en souvient sur ce téléphone. */
export function setAmbientEnabled(next: boolean): void {
  enabled = next
  store(STORAGE_KEY, next ? 'on' : 'off')
  // Le geste qui a déclenché ce choix compte comme premier toucher.
  unlocked = true
  apply()
}

/**
 * Choisit un style (ou « au hasard » : un autre que celui qui joue), le fait
 * entendre tout de suite, et s'en souvient sur ce téléphone.
 */
export function setAmbiance(next: AmbianceChoice): void {
  choice = next
  store(STYLE_KEY, next)
  enabled = true
  store(STORAGE_KEY, 'on')
  unlocked = true
  const track = resolveAmbiance(next, next === 'hasard' ? current : null)
  if (track !== current) load(track)
  else apply()
}

/**
 * Met la musique en retrait tant qu'une raison le demande (ex. une activité
 * Musique). Renvoie la fonction qui la rend.
 */
export function suppressAmbient(reason: string): () => void {
  suppressed.add(reason)
  apply()
  return () => {
    suppressed.delete(reason)
    apply()
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Le choix de l'utilisateur (musique voulue ou coupée), qui fait se redessiner le composant. */
export function useAmbientEnabled(): boolean {
  return useSyncExternalStore(subscribe, isAmbientEnabled)
}

/** Musique voulue ou non, style choisi et style joué. */
export function useAmbiance(): { enabled: boolean; choice: AmbianceChoice; current: AmbianceId } {
  return useSyncExternalStore(subscribe, () => snapshot)
}
