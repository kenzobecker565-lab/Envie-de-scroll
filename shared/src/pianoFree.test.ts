import {describe,it,expect} from 'vitest'
import {PIANO_FREE_PIECES,pianoFreeMelody} from './pianoFree.ts'
import {activitiesFor,getActivity,isBaseActivity} from './activities.ts'
import {keyboardMelody,guideFor} from './guides.ts'
import {collectionSize} from './progress.ts'
import {scrollSuggestions} from './scrollFlow.ts'
import {isNote,keyboardWindow} from './keyboard.ts'
import {isPianoPracticeActivity,pianoPracticePlan,pianoPracticeExcerpt} from './pianoPractice.ts'

describe('catalogue piano domaine public',()=>{
 it('relie les neuf extraits jouables au catalogue, au guide et à la collection',()=>{
  expect(collectionSize('piano')).toBe(9)
  for(const d of [5,15,30] as const){
   const items=activitiesFor('piano',d);expect(items).toHaveLength(3)
   expect(scrollSuggestions(['piano'],d).map(a=>a.id).sort()).toEqual(items.map(a=>a.id).sort())
  }
  for(const piece of PIANO_FREE_PIECES){
   expect(getActivity(piece.id)?.duration).toBe(piece.duration)
   expect(isBaseActivity(piece.id)).toBe(true)
   expect(isPianoPracticeActivity(piece.id)).toBe(true)
   expect(guideFor(piece.id)?.tips.length).toBeGreaterThan(1)
   const tune=keyboardMelody(piece.id)!
   expect(tune).toEqual(pianoFreeMelody(piece.id))
   expect(tune.notes.every(isNote)).toBe(true)
   expect(tune.beats,piece.id).toHaveLength(tune.notes.length)
   expect(tune.beats!.every(b=>b>0&&Number.isFinite(b))).toBe(true)
   expect(pianoPracticeExcerpt(tune,piece.duration).notes).toEqual(tune.notes)
   for(const step of pianoPracticePlan(tune,piece.duration))expect(keyboardWindow(step.melody.notes),piece.id+' '+step.title).not.toBeNull()
  }
 })
 it('garde les anciens identifiants et leurs mélodies pour les créations déjà enregistrées',()=>{
  for(const id of ['piano-5-1','piano-15-6','piano-30-11']){
   expect(getActivity(id)).toBeDefined();expect(keyboardMelody(id)).toBeDefined()
   expect([5,15,30].flatMap(d=>activitiesFor('piano',d as 5|15|30)).some(a=>a.id===id)).toBe(false)
  }
 })
 it('les versions longues prolongent réellement la boucle plutôt que la répéter à l’identique',()=>{
  for(const name of ['cancan','elise']){
   const short=PIANO_FREE_PIECES.find(p=>p.id.includes(name)&&p.duration!==30)!
   const long=PIANO_FREE_PIECES.find(p=>p.id.includes(name)&&p.duration===30)!
   expect(pianoFreeMelody(long.id)!.notes.length).toBeGreaterThan(pianoFreeMelody(short.id)!.notes.length)
   expect(pianoFreeMelody(long.id)!.phrases).toHaveLength(4)
  }
 })
})
