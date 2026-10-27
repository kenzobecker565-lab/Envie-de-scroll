/**
 * Point d'entrée du serveur : API REST + bot Telegram + relances.
 * Lancement : `npm run dev` (à la racine du dépôt) ou `npm start` en production.
 */

import { adminNotifier, configureBotProfile, createBot } from './bot/bot.ts'
import { startReminderLoop } from './bot/reminders.ts'
import { loadConfig } from './config.ts'
import { createPrisma } from './db.ts'
import { createApp } from './http/app.ts'
import { createPhotoService } from './photos/photos.ts'

const config = loadConfig()
const prisma = createPrisma(config.databaseFile)
const bot = config.botToken ? createBot(config, prisma) : undefined

const photos = createPhotoService({ telegram: bot?.telegram, storageChatId: config.storageChatId, localDir: config.localPhotoDir })

const webhookPath = '/telegram/webhook'
const webhook =
  bot && config.botMode === 'webhook'
    ? { path: webhookPath, handler: bot.webhookCallback(webhookPath, { secretToken: config.webhookSecret }) }
    : undefined

const notify = bot ? adminNotifier(bot, prisma, config.adminIds) : undefined
const app = createApp({ prisma, config, photos, webhook, notify, botUsername: () => bot?.botInfo?.username })

const server = app.listen(config.port, () => {
  console.log(`[serveur] API prête sur http://localhost:${config.port}/api`)
  if (config.appDistDir) console.log(`[serveur] Mini App servie depuis ${config.appDistDir}`)
  if (config.devAuth) console.log('[serveur] Authentification de développement active (hors Telegram)')
  console.log(`[photos] Stockage : ${photos.target === 'telegram' ? 'chat privé Telegram' : `disque (${config.localPhotoDir})`}`)
})

let stopReminders: (() => void) | undefined

async function startBot() {
  if (!bot || config.botMode === 'off') {
    console.log(bot ? '[bot] BOT_MODE=off : bot désactivé (le token sert à vérifier les initData)' : '[bot] BOT_TOKEN absent : bot désactivé')
    return
  }
  // Vérifie le token une fois pour toutes : sans lui, inutile d'aller plus loin.
  try {
    bot.botInfo = await bot.telegram.getMe()
    console.log(`[bot] Connecté : @${bot.botInfo.username}`)
  } catch (error) {
    if (isUnauthorized(error)) {
      console.error('[bot] Telegram refuse BOT_TOKEN (401) : vérifie le token donné par @BotFather. Bot et relances arrêtés.')
      return
    }
    console.error('[bot] Telegram injoignable pour le moment, on continue quand même', error)
  }
  if (!config.webAppUrl?.startsWith('https://')) {
    console.warn('[bot] WEBAPP_URL absente ou non HTTPS : le bot ne pourra pas afficher le bouton qui ouvre la Mini App')
  }
  await configureBotProfile(bot, config.webAppUrl).catch((error) => console.error('[bot] Configuration du profil', error))

  if (config.botMode === 'webhook') {
    if (!config.webAppUrl) throw new Error('BOT_MODE=webhook demande WEBAPP_URL (adresse publique du serveur)')
    const url = new URL(webhookPath, config.webAppUrl).toString()
    await bot.telegram.setWebhook(url, { secret_token: config.webhookSecret })
    console.log(`[bot] Webhook : ${url}`)
  } else if (config.botMode === 'polling') {
    launchPolling(bot)
  }

  if (config.remindersEnabled) {
    stopReminders = startReminderLoop(prisma, bot.telegram, { reminderHour: config.reminderHour, webAppUrl: config.webAppUrl })
    console.log(`[relances] Actives, vers ${config.reminderHour} h (heure locale de chacun)`)
  }
}

let stopping = false

function isUnauthorized(error: unknown): boolean {
  return (error as { response?: { error_code?: number } }).response?.error_code === 401
}

/**
 * Long polling, relancé tout seul s'il s'interrompt (coupure réseau, ancienne
 * instance encore active pendant un redéploiement…), avec une attente
 * croissante. Un token refusé par Telegram (401) arrête tout : inutile
 * d'insister, il faut corriger BOT_TOKEN.
 */
function launchPolling(target: NonNullable<typeof bot>, attempt = 0): void {
  target
    .launch({ dropPendingUpdates: false }, () => {
      attempt = 0
      console.log('[bot] À l’écoute des messages (long polling)')
    })
    .catch((error: unknown) => {
      if (stopping) return
      if (isUnauthorized(error)) {
        console.error('[bot] Telegram refuse BOT_TOKEN (401) : vérifie le token donné par @BotFather. Le bot reste arrêté.')
        return
      }
      const delay = Math.min(60_000, 5_000 * 2 ** attempt)
      console.error(`[bot] Polling interrompu, nouvel essai dans ${delay / 1000} s`, error)
      setTimeout(() => launchPolling(target, attempt + 1), delay).unref()
    })
}

startBot().catch((error) => console.error('[bot]', error))

function shutdown(signal: string) {
  console.log(`[serveur] ${signal} : arrêt`)
  stopping = true
  stopReminders?.()
  try {
    if (config.botMode === 'polling') bot?.stop(signal)
  } catch {
    // Le bot n'avait pas démarré.
  }
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0))
  })
  setTimeout(() => process.exit(0), 3000).unref()
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
