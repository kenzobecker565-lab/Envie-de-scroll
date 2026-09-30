/**
 * ============================================================================
 *  PHOTOS DES DESSINS
 * ============================================================================
 *
 * Pas de service de stockage externe dans cette V1 : les photos sont
 * confiées à Telegram. Le bot les envoie dans un chat privé de stockage
 * (STORAGE_CHAT_ID) et on garde en base le `file_id` Telegram, sous la forme
 * « tg:<file_id> ». Pour les afficher, le serveur redemande le fichier à
 * Telegram et le relaie (le token du bot ne quitte jamais le serveur).
 *
 * Sans bot ou sans chat de stockage (développement), les photos envoyées
 * depuis l'app sont écrites sur le disque (« local:<fichier> »).
 */

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import type { Telegram } from 'telegraf'

export interface IncomingPhoto {
  buffer: Buffer
  mimetype: string
}

export interface PhotoContent {
  body: Readable
  contentType: string
}

export interface PhotoService {
  /** Où partent les photos envoyées depuis l'app. */
  readonly target: 'telegram' | 'local'
  /** Range une photo et renvoie sa référence (« tg:… » ou « local:… »). */
  save(photo: IncomingPhoto, caption: string): Promise<string>
  /** Relit une photo à partir de sa référence. */
  open(ref: string): Promise<PhotoContent | null>
}

const EXTENSIONS: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }
const CONTENT_TYPES: Record<string, string> = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

export function createPhotoService({
  telegram,
  storageChatId,
  localDir,
}: {
  telegram: Telegram | undefined
  storageChatId: string | undefined
  localDir: string
}): PhotoService {
  /** Adresses de téléchargement Telegram, valables au moins une heure. */
  const linkCache = new Map<string, { url: string; expires: number }>()

  async function telegramLink(fileId: string): Promise<string> {
    const cached = linkCache.get(fileId)
    if (cached && cached.expires > Date.now()) return cached.url
    if (!telegram) throw new Error('Bot non configuré')
    const url = (await telegram.getFileLink(fileId)).toString()
    linkCache.set(fileId, { url, expires: Date.now() + 50 * 60_000 })
    return url
  }

  return {
    target: telegram && storageChatId ? 'telegram' : 'local',

    async save(photo, caption) {
      if (telegram && storageChatId) {
        const message = await telegram.sendPhoto(storageChatId, { source: photo.buffer, filename: 'dessin.jpg' }, { caption })
        const largest = message.photo.at(-1)
        if (!largest) throw new Error('Telegram n’a pas renvoyé la photo')
        return `tg:${largest.file_id}`
      }
      fs.mkdirSync(localDir, { recursive: true })
      const name = `${randomUUID()}${EXTENSIONS[photo.mimetype] ?? '.jpg'}`
      await fs.promises.writeFile(path.join(localDir, name), photo.buffer)
      return `local:${name}`
    },

    async open(ref) {
      if (ref.startsWith('tg:')) {
        const response = await fetch(await telegramLink(ref.slice(3)))
        if (!response.ok || !response.body) return null
        return {
          body: Readable.fromWeb(response.body as import('node:stream/web').ReadableStream),
          contentType: response.headers.get('content-type')?.startsWith('image/') ? response.headers.get('content-type')! : 'image/jpeg',
        }
      }
      if (ref.startsWith('local:')) {
        const name = path.basename(ref.slice(6))
        const file = path.join(localDir, name)
        if (!fs.existsSync(file)) return null
        return { body: fs.createReadStream(file), contentType: CONTENT_TYPES[path.extname(name)] ?? 'image/jpeg' }
      }
      return null
    },
  }
}

/* ---------------------------- Adresses signées ---------------------------- */

/*
 * Une balise <img> ne peut pas envoyer l'en-tête d'authentification : les
 * adresses des photos portent donc une signature et une date d'expiration.
 * L'expiration est arrondie à des tranches de 6 h pour que l'adresse reste
 * identique un moment (et que le navigateur garde l'image en cache).
 */

const WINDOW_SECONDS = 6 * 3600

function signature(completionId: string, expires: number, secret: string): string {
  return createHmac('sha256', secret).update(`${completionId}.${expires}`).digest('base64url')
}

export function signedPhotoUrl(completionId: string, secret: string, now = new Date()): string {
  const expires = (Math.floor(now.getTime() / 1000 / WINDOW_SECONDS) + 2) * WINDOW_SECONDS
  return `/api/photos/${encodeURIComponent(completionId)}?e=${expires}&s=${signature(completionId, expires, secret)}`
}

export function verifyPhotoSignature(completionId: string, expires: string, sig: string, secret: string, now = new Date()): boolean {
  const expiresAt = Number(expires)
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 < now.getTime()) return false
  const expected = Buffer.from(signature(completionId, expiresAt, secret))
  const received = Buffer.from(sig)
  return expected.length === received.length && timingSafeEqual(expected, received)
}
