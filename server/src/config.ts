/**
 * Configuration du serveur, lue dans les variables d'environnement
 * (ou dans server/.env : voir .env.example pour la liste commentée).
 */

import { createHash, randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const SERVER_ROOT = path.resolve(import.meta.dirname, '..')

export interface Config {
  port: number
  production: boolean
  /** Chemin absolu du fichier SQLite. */
  databaseFile: string
  /** Token du bot (BotFather). Sans lui : pas de bot, et seule l'auth de développement marche. */
  botToken: string | undefined
  /** Chat privé (groupe ou canal) où le bot range les photos. */
  storageChatId: string | undefined
  /** Adresse HTTPS publique de la Mini App (boutons du bot). */
  webAppUrl: string | undefined
  /** `polling` (par défaut), `webhook` (production derrière HTTPS) ou `off`. */
  botMode: 'polling' | 'webhook' | 'off'
  /** Secret du webhook Telegram (en-tête X-Telegram-Bot-Api-Secret-Token). */
  webhookSecret: string
  /** Accepte `Authorization: dev <id>` (développement hors Telegram). Jamais en production. */
  devAuth: boolean
  /** Durée de validité des initData Telegram, en secondes. */
  initDataMaxAge: number
  /** Clé qui signe les adresses des photos. */
  signingSecret: string
  /** Relances : heure locale d'envoi (0-23). */
  reminderHour: number
  remindersEnabled: boolean
  /** Dossier des photos quand elles ne sont pas stockées sur Telegram (développement). */
  localPhotoDir: string
  /** Build de la Mini App à servir (même origine que l'API), s'il existe. */
  appDistDir: string | undefined
}

function loadEnvFile(): void {
  try {
    process.loadEnvFile(path.join(SERVER_ROOT, '.env'))
  } catch {
    // Pas de fichier .env : on garde l'environnement tel quel.
  }
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback
  return ['1', 'true', 'yes', 'oui', 'on'].includes(value.toLowerCase())
}

function int(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function resolveDatabaseFile(url: string): string {
  const file = url.startsWith('file:') ? url.slice('file:'.length) : url
  return path.isAbsolute(file) ? file : path.resolve(SERVER_ROOT, file)
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  if (env === process.env) loadEnvFile()

  const production = env.NODE_ENV === 'production'
  const botToken = env.BOT_TOKEN?.trim() || undefined
  const devAuth = !production && bool(env.DEV_AUTH, !botToken)
  const mode = env.BOT_MODE?.trim()
  const botMode = mode === 'webhook' || mode === 'off' ? mode : 'polling'

  // Secret de signature : explicite, sinon dérivé du token (stable entre deux
  // redémarrages), sinon aléatoire (développement sans bot).
  const signingSecret =
    env.SIGNING_SECRET?.trim() ||
    (botToken ? createHash('sha256').update(`scroll-up-signing:${botToken}`).digest('hex') : randomBytes(32).toString('hex'))

  const appDist = path.resolve(SERVER_ROOT, env.APP_DIST_DIR ?? '../app/dist')

  return {
    port: int(env.PORT, 3000),
    production,
    databaseFile: resolveDatabaseFile(env.DATABASE_URL ?? 'file:./data/scroll-up.db'),
    botToken,
    storageChatId: env.STORAGE_CHAT_ID?.trim() || undefined,
    webAppUrl: env.WEBAPP_URL?.trim() || undefined,
    botMode: botToken ? botMode : 'off',
    webhookSecret: createHash('sha256').update(`scroll-up-webhook:${botToken ?? ''}`).digest('hex').slice(0, 48),
    devAuth,
    initDataMaxAge: int(env.INIT_DATA_MAX_AGE, 24 * 3600),
    signingSecret,
    reminderHour: Math.min(23, Math.max(0, int(env.REMINDER_HOUR, 19))),
    remindersEnabled: bool(env.REMINDERS_ENABLED, true),
    localPhotoDir: path.resolve(SERVER_ROOT, env.LOCAL_PHOTO_DIR ?? 'data/photos'),
    appDistDir: fs.existsSync(path.join(appDist, 'index.html')) ? appDist : undefined,
  }
}
