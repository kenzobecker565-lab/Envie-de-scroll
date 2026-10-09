import { describe,it,expect } from 'vitest'
import { ACTIVE_PASSION_IDS,activePassions } from './passions.ts'
import { getActivity,isFixedActivityId } from './activities.ts'
import { SPORT_ACTIVITIES,SPORT_EXERCISES,SPORT_LESSONS,sportPosition,sportProgram,validateSport } from './sport.ts'
describe('Sport V1',()=>{
 it('propose cinq séances distinctes pour chaque durée et six leçons libres',()=>{
  for(const duration of [5,15,30])expect(new Set(SPORT_ACTIVITIES.filter(a=>a.duration===duration&&a.number<16).map(a=>a.text)).size).toBe(5)
  expect(SPORT_LESSONS).toHaveLength(6);expect(ACTIVE_PASSION_IDS).toHaveLength(6);expect(ACTIVE_PASSION_IDS).not.toContain('rythme')
  expect(activePassions(['rythme','musique','sport'])).toEqual(['sport'])
 })
 it('respecte exactement les durées avec les pauses, sans retour au calme',()=>{
  for(const a of SPORT_ACTIVITIES){const p=sportProgram(a.id)!;expect(p.segments.reduce((s,v)=>s+v.seconds,0),a.id).toBe(a.duration*60);expect(p.segments.filter(s=>s.kind==='exercise')).toHaveLength(a.duration===5?4:a.duration===15?12:24);expect(p.segments.every(s=>['warmup','exercise','rest'].includes(s.kind))).toBe(true);expect(getActivity(a.id)?.text).toBe(a.text)}
 })
 it('équilibre les côtés et retrouve les positions aux frontières des intervalles',()=>{
  const p=sportProgram('sport-5-1')!;expect(sportPosition(p.segments,59999).segment?.kind).toBe('warmup');expect(sportPosition(p.segments,60000).segment?.exercise).toBe('squat');expect(sportPosition(p.segments,90000).segment?.kind).toBe('rest');expect(sportPosition(p.segments,300000).segment).toBeUndefined()
  for(const id of ['sport-15-9','sport-30-13','sport-30-15']){const moves=sportProgram(id)!.session.exercises;expect(moves.includes('sideleft')).toBe(moves.includes('sideright'))}
 })
 it('expose les leçons comme activités fixes et les variantes dans le catalogue',()=>{
  SPORT_LESSONS.forEach((_,i)=>{expect(isFixedActivityId(`sport-lesson-${i+1}`)).toBe(true);expect(sportProgram(`sport-lesson-${i+1}`)?.lesson).toBe(i)})
  for(const exercise of Object.values(SPORT_EXERCISES)){expect(exercise.steps).toHaveLength(3);if(exercise.easyExercise)expect(SPORT_EXERCISES[exercise.easyExercise]).toBeDefined()}
 })
 it('refuse les séances incomplètes, les données invalides et les résumés forgés',()=>{
  for(const activeSeconds of [0,299,301,NaN,'300'])expect(()=>validateSport('sport-5-1',{version:1,activeSeconds})).toThrow()
  expect(()=>validateSport('sport-5-1',{version:1,activeSeconds:300,easy:'yes'})).toThrow()
  expect(validateSport('sport-lesson-2',{version:1,activeSeconds:300,summary:'faux'})).toMatchObject({lesson:1,summary:'Trouver ses pompes · 5 min'})
 })
})
