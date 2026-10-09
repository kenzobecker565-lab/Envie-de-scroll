/**
 * Vérification des `initData` Telegram.
 *
 * Quand Telegram ouvre la Mini App, il lui transmet des `initData` signées
 * avec le token du bot. Le serveur recalcule la signature : si elle
 * correspond, l'utilisateur est bien celui que Telegram annonce, sans
 * système de connexion séparé.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  allows_write_to_pm?: boolean
}

export interface ValidatedInitData {
  user: TelegramUser
  authDate: Date
}

export class InitDataError extends Error {}

/** Clé secrète : HMAC-SHA256 du token du bot, avec la clé « WebAppData ». */
function secretKey(botToken: string): Buffer {
  return createHmac('sha256', 'WebAppData').update(botToken).digest()
}

/** Chaîne de contrôle : les paires clé=valeur triées, sans `hash`, séparées par \n. */
function dataCheckString(params: URLSearchParams): string {
  return [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

export function signInitData(params: URLSearchParams, botToken: string): string {
  return createHmac('sha256', secretKey(botToken)).update(dataCheckString(params)).digest('hex')
}

export function validateInitData(
  raw: string,
  botToken: string,
  { maxAgeSeconds, now = new Date() }: { maxAgeSeconds: number; now?: Date },
): ValidatedInitData {
  const params = new URLSearchParams(raw)
  const hash = params.get('hash')
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) throw new InitDataError('Signature absente')

  const expected = Buffer.from(signInitData(params, botToken), 'hex')
  const received = Buffer.from(hash, 'hex')
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new InitDataError('Signature invalide')
  }

  const authDateSeconds = Number(params.get('auth_date'))
  if (!Number.isFinite(authDateSeconds) || authDateSeconds <= 0) throw new InitDataError('auth_date invalide')
  const authDate = new Date(authDateSeconds * 1000)
  const ageSeconds = (now.getTime() - authDate.getTime()) / 1000
  if (maxAgeSeconds > 0 && ageSeconds > maxAgeSeconds) throw new InitDataError('initData expirées')

  let user: TelegramUser
  try {
    user = JSON.parse(params.get('user') ?? '') as TelegramUser
  } catch {
    throw new InitDataError('Utilisateur illisible')
  }
  if (!user || typeof user.id !== 'number' || !Number.isSafeInteger(user.id)) throw new InitDataError('Utilisateur absent')

  return { user, authDate }
}
