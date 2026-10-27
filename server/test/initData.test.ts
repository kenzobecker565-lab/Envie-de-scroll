import { describe, expect, it } from 'vitest'
import { InitDataError, validateInitData } from '../src/auth/initData.ts'
import { makeInitData, TEST_BOT_TOKEN as TOKEN } from './helpers.ts'

const now = new Date(1_790_000_000 * 1000 + 60_000)

describe('validation des initData Telegram', () => {
  it('accepte des données signées avec le token du bot', () => {
    const raw = makeInitData({ id: 777, first_name: 'Léa', allows_write_to_pm: true })
    const { user, authDate } = validateInitData(raw, TOKEN, { maxAgeSeconds: 3600, now })
    expect(user).toMatchObject({ id: 777, first_name: 'Léa', allows_write_to_pm: true })
    expect(authDate.getTime()).toBe(1_790_000_000 * 1000)
  })

  it('refuse une signature faite avec un autre token', () => {
    const raw = makeInitData({ id: 777, first_name: 'Léa' }, { token: '999:AUTRE' })
    expect(() => validateInitData(raw, TOKEN, { maxAgeSeconds: 3600, now })).toThrow(InitDataError)
  })

  it('refuse des données modifiées après signature', () => {
    const raw = makeInitData({ id: 777, first_name: 'Léa' })
    const tampered = raw.replace(encodeURIComponent('"id":777'), encodeURIComponent('"id":778'))
    expect(tampered).not.toBe(raw)
    expect(() => validateInitData(tampered, TOKEN, { maxAgeSeconds: 3600, now })).toThrow('Signature invalide')
  })

  it('refuse des données expirées', () => {
    const raw = makeInitData({ id: 777, first_name: 'Léa' })
    const later = new Date(now.getTime() + 2 * 3600_000)
    expect(() => validateInitData(raw, TOKEN, { maxAgeSeconds: 3600, now: later })).toThrow('expirées')
  })

  it('refuse des données sans signature', () => {
    expect(() => validateInitData('user=%7B%7D&auth_date=1', TOKEN, { maxAgeSeconds: 0, now })).toThrow('Signature absente')
  })
})
