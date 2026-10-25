import {describe,it,expect} from 'vitest'
import {pianoPracticePlan,pianoPracticeExcerpt,PIANO_BEGINNER_CATALOG} from './pianoPractice.ts'
import {melody} from './keyboard.ts'

describe('apprendre un extrait au piano',()=>{
 const tune=melody('Étude','C4 D4 E4 | E4 D4 C4')
 it('fait répéter et rappeler chaque phrase avant deux essais complets sans aide',()=>{
  const plan=pianoPracticePlan(tune,5)
  expect(plan.slice(0,4).map(s=>s.support)).toEqual(['guided','guided','start','memory'])
  expect(plan.filter(s=>s.final)).toHaveLength(2)
  for(const s of plan.filter(s=>s.final)){expect(s.support).toBe('memory');expect(s.melody.notes).toEqual(tune.notes)}
 })
 it('ajoute de la consolidation dans les séances plus longues',()=>{
  expect(pianoPracticePlan(tune,15).length).toBeGreaterThan(pianoPracticePlan(tune,5).length)
  expect(pianoPracticePlan(tune,30).some(s=>s.title==='Relier les phrases 1 à 2')).toBe(true)
 })
 it('conserve le rythme des phrases isolées et réunies',()=>{
  const timed={...tune,beats:[1,2,3,4,5,6]}
  expect(pianoPracticePlan(timed,5)[4]!.melody.beats).toEqual([4,5,6])
  expect(pianoPracticePlan(timed,5).at(-1)!.melody.beats).toEqual(timed.beats)
 })
 it('limite les extraits selon la durée sans modifier les données originales',()=>{
  const original=melody('Étude','C4 D4 | E4 F4 | G4 A4 | B4 C5 | D5 E5')
  expect(pianoPracticeExcerpt(original,5).phrases).toHaveLength(1)
  expect(pianoPracticeExcerpt(original,15).phrases).toHaveLength(2)
  expect(pianoPracticeExcerpt(original,30).phrases).toHaveLength(4)
  expect(original.phrases).toHaveLength(5)
 })
 it('prépare trois propositions modernes par durée sans mélodies de substitution',()=>{
  for(const duration of [5,15,30])expect(PIANO_BEGINNER_CATALOG.filter(a=>a.duration===duration)).toHaveLength(3)
  expect(new Set(PIANO_BEGINNER_CATALOG.map(a=>a.id)).size).toBe(9)
 })
})
