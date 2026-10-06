import {afterEach,expect,it,vi} from 'vitest'
import {studioConfig} from '@scroll-up/shared'
import {loadStudioDraft} from './StudioSession.tsx'
afterEach(()=>vi.unstubAllGlobals())
it('reprend le carnet entier et les réponses après rechargement',()=>{
 const c=studioConfig('logique-30-11')!,t=c.tasks[0]!,notebook='Hypothèse une\nComparer les horaires puis les mensonges.'
 vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify({version:2,answers:{[t.id]:['21:00']},index:1,checked:[t.id],hints:{[t.id]:2},started:true,review:false,savedRules:[],notebook})})
 const draft=loadStudioDraft('proposal:r3',c);expect(draft.notebook).toBe(notebook);expect(draft.answers[t.id]).toEqual(['21:00']);expect(draft.checked).toEqual([t.id]);expect(draft.hints[t.id]).toBe(2);expect(draft.index).toBe(1)
})
it('un ancien brouillon sans carnet reste lisible et un stockage indisponible ne bloque pas la séance',()=>{
 const c=studioConfig('francais-5-1')!;vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify({version:2,answers:{},checked:[],hints:{}})});expect(loadStudioDraft('old',c).notebook).toBe('');vi.stubGlobal('localStorage',{getItem:()=>{throw new Error('unavailable')}});expect(loadStudioDraft('broken',c)).toMatchObject({started:false,notebook:'',answers:{}})
})
it('borne le carnet et l’étape puis élimine les corrections d’une autre version du contenu',()=>{
 const c=studioConfig('logique-5-2')!;vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify({version:2,answers:{},checked:['old-task'],hints:{},index:99,notebook:'x'.repeat(7000)})});const draft=loadStudioDraft('r3',c);expect(draft.index).toBe(0);expect(draft.notebook).toHaveLength(6000);expect(draft.checked).toEqual([])
})
