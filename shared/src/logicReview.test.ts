import { expect, it } from 'vitest'
import { explainPuzzle } from './logicReview.ts'
import { LOGIC_CASES, validateWorkshop, workshopConfig } from './workshops.ts'
it('explique chaque famille en plusieurs étapes et fournit la solution exacte',()=>{
 for(const p of LOGIC_CASES){const review=explainPuzzle(p);expect(review.steps.length,p.id).toBeGreaterThanOrEqual(4);expect(review.mistakes.length).toBeGreaterThan(0)
  if(p.kind==='grid'){expect(review.solution).toHaveLength(4);expect(review.steps.join(' ')).toContain('Il en reste 1,');expect(review.steps.join(' ')).not.toContain('Il en reste 0,')}
  else expect(review.solution).toEqual([p.answer])
 }
})
it('identifie les indices contredits par une réponse complète incorrecte',()=>{
 const p=LOGIC_CASES[0]!;if(p.kind!=='grid')throw new Error('grid expected')
 expect(explainPuzzle(p,p.solution).mistakes).toEqual([])
 const wrong={rooms:[...p.solution.rooms].reverse(),times:[...p.solution.times].reverse()}
 expect(explainPuzzle(p,wrong).mistakes.some(text=>text.includes('contredit l’indice'))).toBe(true)
 expect(explainPuzzle(p,{rooms:[0,0,0,0],times:[0,0,0,0]}).mistakes[0]).toContain('plusieurs fois')
})
it('termine un code incorrect sans déclarer le dossier résolu et garde une correction accessible',()=>{
 const config=workshopConfig('logique-5-2')!,p=config.cases[0]!
 const result=validateWorkshop(config.activity.id,{version:1,passion:'logique',answers:{[p.id]:'FAUX'}})
 expect(result.summary).toContain('étudié');expect(result.logicResults).toEqual([{id:p.id,correct:false}]);expect(result.answers![p.id]).toBe('FAUX');expect(explainPuzzle(p,result.answers![p.id]).steps.length).toBeGreaterThan(3)
})
