import { it, expect } from 'vitest'
import type { CompletionDTO } from '@scroll-up/shared'
import { atelierSelection, ATELIER_CAPACITY } from './atelier.ts'
it('expose les plus récents sans muter ni supprimer les éléments de la réserve', () => {
  const items = Array.from(
    { length: 9 },
    (_, i) =>
      ({ id: String(i), passion: 'dessin', createdAt: `2026-10-${String(i + 1).padStart(2, '0')}` }) as CompletionDTO,
  )
  expect(atelierSelection([...items, items[8]!], 'dessin').map((i) => i.id)).toEqual(['8', '7', '6', '5', '4', '3'])
  expect(items).toHaveLength(9)
  expect(items[0]!.id).toBe('0')
  expect(atelierSelection(items, 'piano')).toEqual([])
  expect(Object.values(ATELIER_CAPACITY).reduce((a, b) => a + b, 0)).toBe(19)
})

it('garde une création ancienne épinglée sans perdre l’ordre ni modifier l’historique', () => {
  const items = Array.from({length:9},(_,i) => ({id:String(i),passion:'dessin',createdAt:`2026-10-${String(i+1).padStart(2,'0')}`}) as CompletionDTO)
  expect(atelierSelection(items,'dessin','0').map(item => item.id)).toEqual(['0','8','7','6','5','4'])
  expect(atelierSelection(items,'dessin').map(item => item.id)).toEqual(['8','7','6','5','4','3'])
  expect(items[0]!.id).toBe('0')
})
