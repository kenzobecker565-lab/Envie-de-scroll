import { afterEach, describe, expect, it, vi } from 'vitest'
import { rememberTutorial, tutorialSeen, tourCardPosition } from './tutorial.ts'

afterEach(() => vi.unstubAllGlobals())
describe('tutoriel de première utilisation', () => {
  it('mémorise les passages par compte quand une sauvegarde réseau est interrompue', () => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key), setItem: (key: string, value: string) => values.set(key, value) })
    expect(tutorialSeen({ id: '1', tutorialCompleted: false })).toBe(false)
    rememberTutorial('1')
    expect(tutorialSeen({ id: '1', tutorialCompleted: false })).toBe(true)
    expect(tutorialSeen({ id: '2', tutorialCompleted: false })).toBe(false)
  })
  it('respecte le compte même sans stockage disponible sur ce téléphone', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('unavailable') }, setItem: () => { throw new Error('unavailable') } })
    expect(() => rememberTutorial('1')).not.toThrow()
    expect(tutorialSeen({ id: '1', tutorialCompleted: true })).toBe(true)
    expect(tutorialSeen({ id: '2', tutorialCompleted: false })).toBe(false)
  })
  it('place une bulle au-dessus des passions proches de la barre de navigation', () => {
    const target = { x: 16, y: 630, width: 358, height: 100 }
    const card = tourCardPosition(target, { width: 390, height: 844 }, 240)
    expect(card.side).toBe('above')
    expect(card.top + 240).toBeLessThan(target.y)
    expect(card.showPointer).toBe(true)
  })
  it('garde la bulle dans les limites des petits écrans', () => {
    for (const height of [480, 568, 844]) {
      const card = tourCardPosition({ x: 250, y: 210, width: 50, height: 40 }, { width: 320, height }, 260)
      expect(card.left).toBeGreaterThanOrEqual(16)
      expect(card.top).toBeGreaterThanOrEqual(16)
      expect(card.left + card.width).toBeLessThanOrEqual(304)
      expect(card.top + 260).toBeLessThanOrEqual(height - 16)
      expect(card.pointer).toBeLessThanOrEqual(card.width - 26)
    }
  })
})
