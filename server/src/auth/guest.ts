import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const GUEST_COOKIE = 'scrollup_guest'
const LIFETIME_SECONDS = 30 * 24 * 3600

/** Negative identifiers cannot overlap a Telegram account. The server signs every identity. */
export function createGuestSession(secret: string, now = new Date()): string {
  const id = -randomBytes(6).readUIntBE(0, 6) - 1
  const payload = `${id}.${Math.floor(now.getTime() / 1000) + LIFETIME_SECONDS}`
  return `${payload}.${signature(payload, secret)}`
}
function signature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(`scrollup-guest-v1:${payload}`).digest('hex')
}
export function verifyGuestSession(token: string, secret: string, now = new Date()): number | undefined {
  const match = /^(-[1-9]\d{0,14})\.(\d{1,12})\.([a-f0-9]{64})$/.exec(token)
  if (!match) return
  const id = Number(match[1]), expires = Number(match[2])
  if (!Number.isSafeInteger(id) || id >= 0 || expires <= Math.floor(now.getTime() / 1000)) return
  const expected = Buffer.from(signature(`${match[1]}.${match[2]}`, secret), 'hex')
  return timingSafeEqual(expected, Buffer.from(match[3]!, 'hex')) ? id : undefined
}
export function guestCookieValue(cookie: string | undefined): string {
  return cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${GUEST_COOKIE}=`))?.slice(GUEST_COOKIE.length + 1) ?? ''
}
export const guestCookieMaxAge = LIFETIME_SECONDS * 1000
