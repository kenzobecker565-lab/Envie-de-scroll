import { describe, expect, it } from 'vitest'
import { activitiesFor, isFixedActivityId } from './activities.ts'
import { scrollSuggestions, discoveredActivities, experience, parseAtelierAppearance, DEFAULT_ATELIER } from './scrollFlow.ts'
describe('le parcours envie de scroller',()=>{
 it('propose trois activités différentes à la bonne durée parmi les seules passions enregistrées',()=>{
  for(const duration of [5,15,30] as const){const items=scrollSuggestions(['dessin','piano','ecriture'],duration,[],[],()=>.5);expect(items).toHaveLength(3);expect(new Set(items.map(a=>a.id)).size).toBe(3);expect(new Set(items.map(a=>a.passion)).size).toBe(3);expect(items.every(a=>a.duration===duration&&!isFixedActivityId(a.id))).toBe(true)}
 })
 it('propose trois choix avec une seule passion et écarte le lot précédent quand c’est possible',()=>{
  const first=scrollSuggestions(['dessin'],5,[],[],()=>.5),next=scrollSuggestions(['dessin'],5,[],first.map(a=>a.id),()=>.5)
  expect(first).toHaveLength(3);expect(next).toHaveLength(3);expect(next.slice(0,2).every(a=>!first.some(b=>a.id===b.id))).toBe(true)
 })
 it('ne double pas les découvertes et ne compte ni les leçons ni une autre passion',()=>{
  const id=activitiesFor('dessin',5)[0]!.id
  expect(discoveredActivities('dessin',[id,id,'dessin-lesson-1','piano-5-1'])).toEqual({count:1,total:15})
 })
 it('calcule des XP et un niveau à partir des minutes, sans dépendre du portefeuille',()=>{
  expect(experience('dessin',15).xp).toBe(150);expect(experience('dessin',-1).xp).toBe(0);expect(experience('dessin',30).level).toBeGreaterThan(experience('dessin',15).level)
 })
 it('restaure les décors connus et remplace les anciennes préférences invalides',()=>{
  expect(parseAtelierAppearance('{bad')).toEqual(DEFAULT_ATELIER);expect(parseAtelierAppearance({ambiance:'sauge',frames:'papier',decor:'epure',mascot:false})).toEqual({ambiance:'sauge',frames:'papier',decor:'epure',mascot:false})
 })
})

it('conserve les préférences de galerie valides et filtre les anciennes données abîmées',()=>{
 const appearance={...DEFAULT_ATELIER,notebook:{title:'  Mon carnet  ',color:'sauge',motif:'etoile'},exposed:['a','a','b',17]}
 expect(parseAtelierAppearance(appearance)).toEqual({...DEFAULT_ATELIER,notebook:{title:'Mon carnet',color:'sauge',motif:'etoile'},exposed:['a','b']})
 expect(parseAtelierAppearance({...appearance,notebook:{title:'Titre',color:'inconnu',motif:'etoile'},exposed:null})).toEqual(DEFAULT_ATELIER)
})
