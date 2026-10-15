import { describe, expect, it } from 'vitest'
import { activitiesFor } from './activities.ts'
import { ACTIVE_PASSION_IDS } from './passions.ts'
import { activityBrief } from './activityBriefs.ts'

describe('les repères des activités proposées',()=>{
 it('accompagne les 90 activités actives sans modifier leurs consignes',()=>{
  const titles=new Set<string>()
  for(const passion of ACTIVE_PASSION_IDS)for(const duration of [5,15,30] as const){
   const activities=activitiesFor(passion,duration)
   expect(activities).toHaveLength(5)
   for(const activity of activities){
    const original=structuredClone(activity),brief=activityBrief(activity)
    expect(brief,activity.id).toBeDefined()
    expect(brief!.title.length).toBeGreaterThan(3)
    expect(brief!.outcome.length).toBeGreaterThan(10)
    expect(brief!.materials.length).toBeGreaterThan(10)
    expect(brief!.steps).toHaveLength(3)
    expect(activity).toEqual(original)
    titles.add(brief!.title)
   }
  }
  expect(titles.size).toBeGreaterThanOrEqual(75)
 })
 it('réserve exactement le temps choisi aux trois étapes créatives',()=>{
  for(const passion of ['dessin','ecriture'] as const)for(const duration of [5,15,30] as const)for(const activity of activitiesFor(passion,duration)){
   const steps=activityBrief(activity)!.steps
   expect(steps.every(step=>step.minutes!>0)).toBe(true)
   expect(steps.reduce((sum,step)=>sum+step.minutes!,0)).toBe(duration)
  }
 })
 it('ne substitue pas un ancien croquis aux nouvelles leçons de dessin',()=>{
  const activity=activitiesFor('dessin',5)[0]!
  expect(activityBrief({...activity,id:'dessin-lesson-1'})).toBeUndefined()
 })
})
