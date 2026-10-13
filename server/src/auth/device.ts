import { createHmac } from 'node:crypto'
import type { TelegramUser } from './initData.ts'

/** An installation owns a random 256-bit bearer key. IDs are in a separate,
 * negative namespace; knowing a public user ID cannot authenticate a device. */
export function deviceUser(token: string, secret: string): TelegramUser | undefined {
  if (!/^[a-f0-9]{64}$/.test(token)) return undefined
  const digest = createHmac('sha256', secret).update(`scroll-up-device-v1:${token}`).digest('hex')
  const id = -(Number.parseInt(digest.slice(0, 13), 16) + 1)
  return { id, first_name:'Testeur Android', language_code:'fr', allows_write_to_pm:false }
}
