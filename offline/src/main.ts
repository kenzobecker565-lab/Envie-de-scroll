/**
 * Point d'entrée de la version hors ligne : démarre le serveur local, puis
 * l'application Scroll-up habituelle (app/src/main.tsx), sans Telegram.
 */
import { createLocalApi } from './localApi.ts'

async function start() {
  try {
    ;(globalThis as { __SCROLLUP_LOCAL_API__?: unknown }).__SCROLLUP_LOCAL_API__ = await createLocalApi()
  } catch (error) {
    console.error('[hors ligne] Démarrage impossible', error)
  }
  await import('../../app/src/main.tsx')
}

void start()
