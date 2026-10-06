import { expect, it } from 'vitest'
import { FRENCH_RULES, LOGIC_STUDIO, STUDIO_LESSONS, collection, reviewStudioConfig, studioConfig, studioCorrect, studioReviewRules, validateWorkshop, type StudioTask } from './index.ts'
const solution=(t:StudioTask)=>t.kind==='rewrite'?'Voici une proposition de réécriture complète.':t.kind==='repair'?t.repairs!.map(r=>r.right):t.solution
it('expose cinq expériences différentes par durée et des séquences plus longues, sans changer les anciens identifiants',()=>{
 for(const passion of ['logique','francais'] as const){let counts:number[]=[];for(const d of [5,15,30] as const){const a=collection(passion).find(g=>g.duration===d)!.activities;expect(a).toHaveLength(5);expect(new Set(a.map(t=>t.text)).size).toBe(5);counts.push(studioConfig(a[0]!.id)!.tasks.length)}expect(counts[1]).toBeGreaterThan(counts[0]!);expect(counts[2]).toBeGreaterThan(counts[1]!);expect(STUDIO_LESSONS[passion]).toHaveLength(5)}
 expect(new Set(LOGIC_STUDIO.flatMap(c=>c.tasks.map(t=>t.kind)))).toEqual(new Set(['input','order','circuit','deduction','route','selection']))
})
it('les réseaux ont une solution unique reliée à la source, dans le budget',()=>{
 for(const t of LOGIC_STUDIO.flatMap(c=>c.tasks).filter(t=>t.kind==='circuit')){const valid:number[][]=[];for(let mask=0;mask<2**t.circuit!.nodes.length;mask++){const nodes=Array.from({length:t.circuit!.nodes.length},(_,i)=>i).filter(i=>mask&(1<<i));if(studioCorrect(t,nodes))valid.push(nodes)}expect(valid,t.id).toEqual([t.solution]);expect(studioCorrect(t,[0,2,5,8])).toBe(false);expect(studioCorrect(t,[0,1,2,4,5,8,8])).toBe(false)}
})
it('valide et archive chaque nouveau parcours avec des corrections complètes calculées côté serveur',()=>{
 for(const passion of ['logique','francais'] as const)for(const d of [5,15,30] as const)for(const a of collection(passion).find(g=>g.duration===d)!.activities){const c=studioConfig(a.id)!;for(const t of c.tasks){expect(t.explanation.length).toBeGreaterThanOrEqual(2);expect(t.hints).toHaveLength(3);if(t.rule)expect(FRENCH_RULES.some(r=>r.id===t.rule),t.rule).toBe(true)}const answers=Object.fromEntries(c.tasks.map(t=>[t.id,solution(t)]));const r=validateWorkshop(a.id,{version:2,contentRevision:c.revision,passion,answers,summary:'faux score',studio:{steps:[]}});expect(r.studio!.steps.every(s=>s.correct!==false)).toBe(true);expect(r.summary).not.toBe('faux score');expect(r.studio!.steps.map(s=>s.task)).toEqual(c.tasks);expect(r.reviewRules).toEqual([])}
})
it('permet de finir une enquête non résolue et refuse les réponses mal formées',()=>{
 const r=validateWorkshop('logique-30-11',{version:2,contentRevision:3,passion:'logique',answers:{}});expect(r.studio!.steps.every(s=>s.correct===false&&s.response===null)).toBe(true)
 const c=studioConfig('logique-5-1')!;expect(()=>validateWorkshop(c.id,{version:2,contentRevision:c.revision,passion:'logique',answers:{[c.tasks[0]!.id]:99}})).toThrow();expect(()=>validateWorkshop(c.id,{version:2,passion:'francais',answers:{}})).toThrow();expect(()=>validateWorkshop(c.id,{version:2,contentRevision:c.revision,passion:'logique',answers:[]})).toThrow()
})
it('le français conserve les erreurs de règles exactes, exige toutes les réponses et accepte les mauvaises réponses étudiées',()=>{
 const c=studioConfig('francais-15-8')!,answers=Object.fromEntries(c.tasks.map(t=>[t.id,solution(t)]));const repair=c.tasks.find(t=>t.kind==='repair')!;answers[repair.id]=[repair.repairs![0]!.right,'FAUX'];expect(studioReviewRules(repair,answers[repair.id])).toEqual(['adjectif']);const r=validateWorkshop(c.id,{version:2,passion:'francais',answers,savedRules:['FAUSSE_REGLE']});expect(r.reviewRules).toEqual(['adjectif']);expect(()=>validateWorkshop(c.id,{version:2,passion:'francais',answers:{}})).toThrow()
})
it('la saisie accepte la casse et les apostrophes typographiques sans effacer les accents orthographiques',()=>{
 const t=studioConfig('francais-5-1')!.tasks.find(t=>t.kind==='input')!;expect(studioCorrect(t,'  '+String(t.solution).toUpperCase()+'  ')).toBe(true)
 const review=reviewStudioConfig(['adjectif','votre','style']);expect(new Set(review.tasks.map(t=>t.rule))).toEqual(new Set(['adjectif','votre','style']));expect(review.tasks.find(t=>t.kind==='rewrite')).toBeTruthy()
})
it('la réécriture garde la proposition entière et n’attribue pas de note automatique',()=>{
 const c=studioConfig('francais-30-15')!,t=c.tasks.find(t=>t.kind==='rewrite')!,text='Voici une autre formulation tout à fait personnelle.\nElle reste entière dans la galerie.';const answers=Object.fromEntries(c.tasks.map(t=>[t.id,solution(t)]));answers[t.id]=text;const r=validateWorkshop(c.id,{version:2,passion:'francais',answers});expect(r.studio!.steps.find(s=>s.task.id===t.id)).toMatchObject({response:text,correct:null});answers[t.id]='Court';expect(()=>validateWorkshop(c.id,{version:2,passion:'francais',answers})).toThrow()
})
