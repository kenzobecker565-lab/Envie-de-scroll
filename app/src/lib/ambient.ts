/**
 * Musique d'ambiance (jazz noir), en boucle, très douce.
 *
 * - Elle démarre au premier toucher (les navigateurs refusent le son avant).
 * - On la coupe ou la remet d'un geste (accueil, réglages) ; le choix est
 *   gardé sur ce téléphone.
 * - Elle se retire toute seule quand l'app passe en arrière-plan, et pendant
 *   les activités Musique et Cinéma (on écoute ou on regarde autre chose).
 *
 * Le volume passe par Web Audio (GainNode) : sur iPhone, le volume d'une
 * balise <audio> ne se règle pas depuis la page.
 */

import { useSyncExternalStore } from 'react'

const SRC = '/music/jazz-noir.mp3'
const STORAGE_KEY = 'scroll-up:music'
/** Volume de croisière (0 à 1) : un fond, jamais au premier plan. */
const LEVEL = 0.32
const FADE_SECONDS = 1.2

let enabled = readEnabled()
let unlocked = false
const suppressed = new Set<string>()
const listeners = new Set<() => void>()

let audio: HTMLAudioElement | undefined
let context: AudioContext | undefined
let gain: GainNode | undefined
let pauseTimer: number | undefined

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

/** Crée le lecteur (au premier toucher seulement). */
function ensurePlayer(): boolean {
  if (audio) return true
  try {
    audio = new Audio(SRC)
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

function fadeTo(target: number) {
  if (gain && context) {
    const now = context.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(target, now + FADE_SECONDS)
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
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
  } catch {
    // Stockage indisponible : le choix vaut pour cette ouverture.
  }
  // Le geste qui a déclenché ce choix compte comme premier toucher.
  unlocked = true
  apply()
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
