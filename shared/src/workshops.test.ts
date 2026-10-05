import { describe, expect, it } from 'vitest'
import { ACTIVE_PASSION_IDS, activePassions } from './passions.ts'
import { BEAT_TASKS, FRENCH_QUESTIONS, FRENCH_RULES, LOGIC_CASES, WORKSHOP_ACTIVITIES, emptyPattern, puzzleCorrect, referencePattern, solveCase, validateWorkshop, workshopConfig } from './workshops.ts'

describe('six ateliers V1',()=>{
 it('migre les préférences sans modifier les données historiques',()=>{
  expect(ACTIVE_PASSION_IDS).toEqual(['dessin','piano','ecriture','rythme','logique','francais'])
  expect(activePassions(['musique','cinema','dessin'])).toEqual(['dessin','rythme','logique'])
 })
 it('propose trois leçons et quinze défis par nouvel atelier',()=>{
  for(const id of ['rythme','logique','francais'])expect(WORKSHOP_ACTIVITIES.filter(a=>a.passion===id)).toHaveLength(18)
 })
 it('vérifie l’unicité de chaque dossier de déduction et enquête',()=>{
  for(const p of LOGIC_CASES){if(p.kind!=='grid')continue;expect(solveCase(p.clues),p.id).toEqual([p.solution]);expect(puzzleCorrect(p,p.solution)).toBe(true);expect(puzzleCorrect(p,{rooms:[0,0,0,0],times:[0,0,0,0]})).toBe(false)}
 })
 it('les six coffres ont exactement une solution parmi tous les codes autorisés',()=>{
  const digits='1234567';const codes=[...digits].flatMap(a=>[...digits].filter(b=>b!==a).flatMap(b=>[...digits].filter(c=>c!==a&&c!==b).flatMap(c=>[...digits].filter(d=>d!==a&&d!==b&&d!==c).map(d=>a+b+c+d))))
  for(const p of LOGIC_CASES.filter(p=>p.kind==='code'&&p.family==='Contraintes')){if(p.kind!=='code')continue;const lines=[...p.prompt.matchAll(/(\d{4}) : (\d) chiffre\(s\) bien placé\(s\), (\d) chiffre\(s\) présent\(s\) mais mal placé\(s\)/g)];expect(lines.length).toBeGreaterThan(1);const solutions=codes.filter(code=>lines.every(m=>{const guess=m[1]!;const exact=[...guess].filter((v,i)=>code[i]===v).length,present=[...guess].filter(v=>code.includes(v)).length;return exact===Number(m[2])&&present-exact===Number(m[3])}));expect(solutions,p.id).toEqual([p.answer])}
 })
 it('chaque exercice a une règle, deux choix distincts et une correction',()=>{
  expect(FRENCH_QUESTIONS).toHaveLength(48);for(const q of FRENCH_QUESTIONS){expect(FRENCH_RULES.some(r=>r.id===q.rule)).toBe(true);expect(q.options[0]).not.toBe(q.options[1]);expect(q.options[q.answer]).toBeTruthy()}
 })
 it('vérifie les dossiers et calcule le résultat français sans score fourni par le client',()=>{
  for(const a of WORKSHOP_ACTIVITIES.filter(a=>a.passion!=='rythme')){const c=workshopConfig(a.id)!;const answers=Object.fromEntries(a.passion==='logique'?c.cases.map(p=>[p.id,p.kind==='grid'?p.solution:p.answer]):c.questions.map(q=>[q.id,q.answer]));const result=validateWorkshop(a.id,{version:1,passion:a.passion,answers});expect(result.summary).toBeTruthy();if(a.passion==='francais')expect(()=>validateWorkshop(a.id,{version:1,passion:a.passion,answers:{}})).toThrow();else expect(validateWorkshop(a.id,{version:1,passion:a.passion,answers:{}}).logicResults?.every(r=>!r.correct)).toBe(true)}
  const c=workshopConfig('francais-5-1')!,answers=Object.fromEntries(c.questions.map(q=>[q.id,1-q.answer]));expect(validateWorkshop('francais-5-1',{version:1,passion:'francais',answers}).reviewRules!.length).toBeGreaterThan(0)
 })
 it('refuse les séquences mal formées, les défis non respectés et les sections identiques',()=>{
  const base={version:1,passion:'rythme',beat:{name:'Mon beat',tempo:90,palette:'hip-hop',patterns:[referencePattern()]}}
  expect(validateWorkshop('rythme-5-1',base).beat?.name).toBe('Mon beat')
  expect(()=>validateWorkshop('rythme-5-1',{...base,beat:{...base.beat,patterns:[emptyPattern()]}})).toThrow()
  expect(()=>validateWorkshop('rythme-5-5',{...base,beat:{...base.beat,tempo:200}})).toThrow()
  expect(()=>validateWorkshop('rythme-15-10',{...base,beat:{...base.beat,patterns:[referencePattern(),referencePattern()]}})).toThrow()
  expect(BEAT_TASKS).toHaveLength(5)
 })
})
