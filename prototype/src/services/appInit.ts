import { db, isMemoryDatabase, switchToMemoryDatabase } from '../db/database'
import { platform } from '../platform'
import { seedDemoDataOnce } from './demoData'

/** Délai au-delà duquel on considère que le stockage du navigateur ne répond pas. */
const STORAGE_TIMEOUT_MS = 4000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Le stockage ne répond pas')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

/**
 * Démarrage de l'application : ouverture de la base locale, puis
 * installation des données de démonstration au tout premier lancement.
 *
 * Si le navigateur refuse le stockage (certaines navigations privées, aperçus
 * intégrés…), l'app bascule sur une base en mémoire : tout fonctionne, mais
 * rien n'est conservé après la fermeture de la page. Un bandeau le signale.
 */
export function initializeApp(): Promise<void> {
  // Un seul démarrage, même si l'app le demande deux fois (mode strict de React).
  initialization ??= start()
  return initialization
}

let initialization: Promise<void> | undefined

async function start(): Promise<void> {
  try {
    await withTimeout(db.open(), STORAGE_TIMEOUT_MS)
  } catch (error) {
    console.warn('Stockage du navigateur indisponible : les données restent en mémoire.', error)
    switchToMemoryDatabase()
    await db.open()
  }
  await seedDemoDataOnce()
  platform.ready()
}

/** Vrai si les données ne sont gardées qu'en mémoire (stockage du navigateur refusé). */
export function isStorageTemporary(): boolean {
  return isMemoryDatabase
}

/**
 * Demande au navigateur de protéger la base contre l'effacement automatique
 * (quand l'appareil manque d'espace). Appelé à la fin de l'onboarding, quand
 * l'utilisateur a montré qu'il comptait utiliser l'app ; certains navigateurs
 * affichent alors une petite demande d'autorisation, d'autres décident seuls.
 */
export function requestPersistentStorage(): void {
  navigator.storage?.persist?.().catch(() => {
    // Refus ou API absente : les données restent enregistrées normalement.
  })
}
