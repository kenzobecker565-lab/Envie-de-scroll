import { expect,it } from 'vitest'
import { LOGIC_STUDIO, routeResult, studioAnswerLabel, studioCorrect, validateWorkshop } from './index.ts'
const task=(caseIndex:number,index=0)=>LOGIC_STUDIO[caseIndex]!.tasks[index]!
function permute<T>(values:T[]):T[][]{if(!values.length)return [[]];return values.flatMap((v,i)=>permute(values.filter((_,j)=>j!==i)).map(p=>[v,...p]))}
it('le clavier approuvé a exactement un code et exige de respecter chaque nombre exact de chiffres',()=>{
 const solutions:string[]=[];for(let n=0;n<1000;n++){const c=String(n).padStart(3,'0');if(new Set(c).size!==3)continue;const hit=(s:string)=>[...s].reduce((a,v,i)=>[a[0]!+Number(v===c[i]),a[1]!+Number(c.includes(v))],[0,0]);if(JSON.stringify(['714','789','437','021','013'].map(hit))===JSON.stringify([[1,1],[0,1],[0,2],[0,0],[0,1]]))solutions.push(c)}expect(solutions).toEqual([task(1).solution]);expect(task(1).evidence[1]!.text).toContain('714');expect(task(1).evidence[1]!.text).toContain('021')
})
it('la tournée approuvée a un seul parcours, attente et services compris',()=>{
 const t=task(5),solutions:number[][]=[];function walk(p:number[]){if(p.length>1){const back=[...p,0];if(routeResult(t,back).valid)solutions.push(back)}for(let i=1;i<t.route!.labels.length;i++)if(!p.includes(i))walk([...p,i])}walk([0]);expect(solutions).toEqual([t.solution]);expect(routeResult(t,t.solution)).toEqual({valid:true,elapsed:35,visits:[{node:1,start:8},{node:2,start:15},{node:3,start:24}]});expect(routeResult(t,[0,1,2,5,3,0]).valid).toBe(false);expect(routeResult(t,[0,4,1,2,1,3,0]).valid).toBe(false);expect(routeResult(t,[0,4,1,2,0,3,0]).valid).toBe(false)
})
it('les répartitions de colis, d’œuvres et de canaux ont des solutions uniques déductibles des contraintes',()=>{
 const p=permute([0,1,2,3]);const checks=[{t:task(4),f:(x:number[])=>x[0]!+1===x[1]&&Math.abs(x[2]!-x[3]!)===1&&![0,3].includes(x[3]!)&&x[0]!==2},{t:task(6),f:(x:number[])=>![0,3].includes(x[0]!)&&x[1]!<x[2]!&&Math.abs(x[3]!-x[0]!)===1&&x[2]!==3},{t:task(14,1),f:(x:number[])=>x[0]!+1===x[2]&&x[1]!>x[3]!&&x[2]!==3&&x[3]!==0}];for(const {t,f} of checks){const solutions=p.filter(f).map(x=>x.map((v,i)=>t.fields![i]!.options![v]!));expect(solutions).toEqual([t.solution])}
})
it('les rencontres croisées n’admettent qu’un tableau horaire/couleur',()=>{
 const p=permute([0,1,2,3]),t=task(7),solutions:string[][]=[];for(const times of p)for(const colors of p){if(times[0]!==times[3]!+1||times[2]!==3||times[1]!>=times[3]!||colors[2]!==0||colors[1]!==3||colors[0]!>=colors[3]!||colors[3]===3)continue;solutions.push(times.flatMap((v,i)=>[t.fields![2*i]!.options![v]!,t.fields![2*i+1]!.options![colors[i]!]!]))}expect(solutions).toEqual([t.solution])
})
it('les faits et exactement deux mensonges déterminent un seul tableau à l’observatoire',()=>{
 const solutions:string[][]=[],t=task(10);for(const persons of permute([0,1,2,3,4]))for(const sectors of permute([0,1,2,3,4])){const pos=(p:number)=>persons.indexOf(p),room=(r:number)=>sectors.indexOf(r);if(room(2)!==2||room(3)!==room(1)+2||pos(0)>=pos(3)||pos(1)+1!==pos(2)||pos(4)===0||pos(4)===room(3)||[room(1),room(2)].includes(pos(3))||room(0)>=room(4))continue;const claims=[pos(0)===room(0),pos(1)===room(4),pos(2)===room(2),pos(3)<pos(2),pos(4)>room(3)];if(claims.filter(x=>!x).length!==2)continue;solutions.push([0,1,2,3,4].flatMap(i=>[t.fields![2*i]!.options![pos(i)]!,t.fields![2*i+1]!.options![sectors[pos(i)]!]!]))}expect(solutions).toEqual([t.solution])
})
it('le chargement nécessite la compatibilité, pas seulement une somme de ressources',()=>{
 const crates=[[3,4,0,1],[2,0,2,1],[4,3,2,0],[5,5,1,2],[1,0,0,2],[3,2,1,3],[4,4,0,2],[2,1,2,0]],valid:number[][]=[];for(let a=0;a<8;a++)for(let b=a+1;b<8;b++)for(let c=b+1;c<8;c++){const ids=[a,b,c],sum=[0,1,2,3].map(k=>ids.reduce((s,i)=>s+crates[i]![k]!,0));if(sum[0]!<=10&&sum[1]!>=9&&sum[2]!>=3&&sum[3]!>=3&&!(ids.includes(0)&&ids.includes(3)))valid.push(ids)}expect(valid).toEqual([task(8,1).solution])
})
it('l’attribution maximise réellement la vente sous budgets après retrait du dépôt tardif',()=>{
 const offers=[[240,250,245],[230,245,235],[220,240,260],[260,230,255]],budgets=[480,480,470,500];let best=0,solutions:string[][]=[];const t=task(13,1);for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){if(a===3)continue;const ids=[a,b,c],spent=budgets.map((_,person)=>ids.reduce((s,winner,lot)=>s+(winner===person?offers[winner]![lot]!:0),0));if(spent.some((s,i)=>s>budgets[i]!))continue;const total=spent.reduce((a,b)=>a+b,0);if(total<best)continue;if(total>best){best=total;solutions=[]}solutions.push(ids.map((v,i)=>t.fields![i]!.options![v]!))}expect(best).toBe(745);expect(solutions).toEqual([t.solution]);expect(studioCorrect(task(13,3),'782.25')).toBe(true)
})
it('l’addition à lettres a une seule solution, avec des retenues cohérentes',()=>{
 const solutions:string[][]=[];for(let e=2;e<9;e++){const n=e+1;if(n===8||n===9)continue;for(let d=2;d<9;d++){const y=e+d-10;const digits=[9,e,n,d,1,0,8,y];if(y<0||new Set(digits).size!==8)continue;const send=9000+100*e+10*n+d,more=1000+80+e,money=10000+100*n+10*e+y;if(send+more===money)solutions.push(digits.map(String))}}expect(solutions).toEqual([task(12).solution])
})
it('archive les tableaux partiels, le carnet et les solutions serveur ; rejette l’ancienne version et les tableaux mal formés',()=>{
 const c=LOGIC_STUDIO[10]!,t=c.tasks[0]!,partial=t.fields!.map((_,i)=>i===0?'21:00':'');const result=validateWorkshop(c.id,{version:2,contentRevision:3,passion:'logique',answers:{[t.id]:partial},notebook:'Mon raisonnement\nreste entier.'});expect(result.studio!.notebook).toBe('Mon raisonnement\nreste entier.');expect(result.studio!.steps[0]!.correct).toBe(false);expect(studioAnswerLabel(t,partial)).toContain('Nora · entrée : 21:00');expect(()=>validateWorkshop(c.id,{version:2,passion:'logique',answers:{}})).toThrow('renouvelée');expect(()=>validateWorkshop(c.id,{version:2,contentRevision:3,passion:'logique',answers:{[t.id]:['99:99']}})).toThrow('Tableau');expect(()=>validateWorkshop(c.id,{version:2,contentRevision:3,passion:'logique',answers:{},notebook:'x'.repeat(6001)})).toThrow('Carnet')
})
