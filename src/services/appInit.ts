import { db } from '../db/database'
import { platform } from '../platform'
import { seedDemoDataOnce } from './demoData'

/**
 * Démarrage de l'application : ouverture de la base locale, puis
 * installation des données de démonstration au tout premier lancement.
 * Si IndexedDB est indisponible (certains modes de navigation privée),
 * la promesse est rejetée et l'app affiche un message d'erreur clair.
 */
export async function initializeApp(): Promise<void> {
  await db.open()
  await seedDemoDataOnce()
  platform.ready()
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
