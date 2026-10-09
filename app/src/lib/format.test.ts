import { describe, expect, it } from 'vitest'
import { formatDay, formatMonth, formatNumber, monthKey, plural } from './format.ts'

describe('mises en forme', () => {
  it('accorde au pluriel', () => {
    expect(plural(1, 'activité')).toBe('1 activité')
    expect(plural(3, 'activité')).toBe('3 activités')
    expect(plural(2, 'activité réalisée', 'activités réalisées')).toBe('2 activités réalisées')
  })

  it('sépare les milliers à la française', () => {
    expect(formatNumber(1234).replace(/\s/g, ' ')).toBe('1 234')
  })

  it('dit « Aujourd’hui », « Hier », sinon la date', () => {
    const now = new Date(2026, 8, 30, 18)
    expect(formatDay(new Date(2026, 8, 30, 9).toISOString(), now)).toBe('Aujourd’hui')
    expect(formatDay(new Date(2026, 8, 29, 23).toISOString(), now)).toBe('Hier')
    expect(formatDay(new Date(2026, 8, 12, 12).toISOString(), now)).toBe('12 septembre')
    expect(formatDay(new Date(2025, 2, 3, 12).toISOString(), now)).toBe('3 mars 2025')
  })

  it('regroupe par mois', () => {
    const iso = new Date(2026, 8, 12, 12).toISOString()
    expect(formatMonth(iso)).toBe('Septembre 2026')
    expect(monthKey(iso)).toBe(monthKey(new Date(2026, 8, 1, 12).toISOString()))
  })
})
