import { describe, expect, it } from 'vitest'
import { workshopCoins, workshopSolved } from './workshopCoins.ts'
import type { WorkshopResult } from './workshops.ts'

const studio = (corrects: (boolean | null)[]): WorkshopResult =>
  ({ version: 2, passion: 'logique', summary: '', studio: { title: '', steps: corrects.map((correct) => ({ correct })) } }) as unknown as WorkshopResult

describe('workshopSolved', () => {
  it('demande que chaque étape notée soit juste', () => {
    expect(workshopSolved(studio([true, true]))).toBe(true)
    expect(workshopSolved(studio([true, false]))).toBe(false)
    expect(workshopSolved(studio([false]))).toBe(false)
  })

  it('ignore les étapes sans note (réécriture libre) mais pas une séance sans aucune note', () => {
    expect(workshopSolved(studio([true, null]))).toBe(true)
    expect(workshopSolved(studio([null]))).toBe(false)
  })

  it('lit aussi les anciens formats : dossiers notés, beat réussi, français sans correction non', () => {
    expect(workshopSolved({ version: 1, passion: 'logique', summary: '', logicResults: [{ id: 'a', correct: true }] })).toBe(true)
    expect(workshopSolved({ version: 1, passion: 'logique', summary: '', logicResults: [{ id: 'a', correct: false }] })).toBe(false)
    expect(workshopSolved({ version: 1, passion: 'rythme', summary: '' })).toBe(true)
    expect(workshopSolved({ version: 1, passion: 'francais', summary: '' })).toBe(false)
  })
})

describe('workshopCoins', () => {
  it('donne la durée entière quand tout est résolu, même vite', () => {
    expect(workshopCoins(30, { solved: true, elapsedMs: 2_000 })).toBe(30)
  })

  it('sinon, compte les minutes passées, sans dépasser la durée', () => {
    expect(workshopCoins(30, { solved: false, elapsedMs: 3_000 })).toBe(0)
    expect(workshopCoins(30, { solved: false, elapsedMs: 7 * 60_000 + 59_000 })).toBe(7)
    expect(workshopCoins(5, { solved: false, elapsedMs: 3 * 3_600_000 })).toBe(5)
    expect(workshopCoins(5, { solved: false, elapsedMs: -1 })).toBe(0)
  })
})
