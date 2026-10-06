import {expect,it} from 'vitest'
import {POWER_GRID_SPEC,POWER_GRID_SOLUTION} from './logicPower.ts'
import {powerGridStatus,powerAnswerWellFormed} from './powerGrid.ts'
import {studioConfig,studioCorrect,studioAnswerLabel,validateWorkshop} from './index.ts'
// Enumerate every switch/orientation independently of the production checker.
function configurations(){
 const s=POWER_GRID_SPEC,mandatory=new Set([0,...s.targets.map(t=>t.node)]),results:{state:number[];stable:boolean;compatible:boolean}[]=[]
 function inspect(state:number[]){const active=state.flatMap((r,i)=>r>=0?[i]:[]),edges:[number,number][]=[]
  for(const a of active)for(const b of active){if(a>=b)continue;const na=s.nodes[a]!,nb=s.nodes[b]!,pa=na.ports[state[a]!]!,pb=nb.ports[state[b]!]!;if((nb.x-na.x===1&&nb.y===na.y&&(pa&2)&&(pb&8))||(nb.y-na.y===1&&nb.x===na.x&&(pa&4)&&(pb&1)))edges.push([a,b])}
  function connected(skip=-1){const queue=[0],seen=new Set([0]);while(queue.length){const a=queue.shift()!;for(const edge of edges){if(edge.includes(skip)||!edge.includes(a))continue;const b=edge[0]===a?edge[1]:edge[0];if(!seen.has(b)){seen.add(b);queue.push(b)}}}return seen}
  const seen=connected();if(active.some(i=>!seen.has(i)))return
  const stable=s.targets.every(t=>t.stabilizer===undefined||(active.includes(t.stabilizer)&&!connected(t.stabilizer).has(t.node))),compatible=s.incompatible.every(([a,b])=>!active.includes(a)||!active.includes(b));results.push({state:[...state],stable,compatible})
 }
 function walk(state:number[],cost:number){const i=state.length;if(cost>s.budget)return;if(i===s.nodes.length){inspect(state);return}if(!mandatory.has(i))walk([...state,-1],cost);for(let r=0;r<s.nodes[i]!.ports.length;r++)walk([...state,r],cost+s.nodes[i]!.cost)}walk([],0);return results
}
it('le plateau 4 × 4 a une solution unique avec toutes les contraintes, et chacune des contraintes supplémentaires écarte des alternatives',()=>{
 const choices=configurations(),valid=choices.filter(c=>c.stable&&c.compatible);expect(valid.map(v=>v.state)).toEqual([POWER_GRID_SOLUTION]);expect(choices.some(c=>!c.stable&&c.compatible)).toBe(true);expect(choices.some(c=>c.stable&&!c.compatible)).toBe(true);for(const c of choices)expect(powerGridStatus(POWER_GRID_SPEC,c.state).valid).toBe(c.stable&&c.compatible)
})
it('la solution relie les trois bâtiments, respecte le stabilisateur et inclut le coût de la source',()=>{
 const status=powerGridStatus(POWER_GRID_SPEC,POWER_GRID_SOLUTION);expect(status).toMatchObject({valid:true,cost:32,overloaded:false,issues:[]});expect(status.targets.every(t=>t.powered&&t.stabilized)).toBe(true);expect(status.energized).toHaveLength(11);const t=studioConfig('logique-5-4')!.tasks[0]!;expect(studioCorrect(t,POWER_GRID_SOLUTION)).toBe(true);expect(studioAnswerLabel(t,POWER_GRID_SOLUTION)).toContain('G : haut / bas / gauche')
})
it('une mauvaise orientation coupe les branches ; la surcharge coupe tout, même si des câbles sont connectés',()=>{
 const wrong=[...POWER_GRID_SOLUTION];wrong[5]=0;const disconnected=powerGridStatus(POWER_GRID_SPEC,wrong);expect(disconnected.valid).toBe(false);expect(disconnected.targets.some(t=>!t.powered)).toBe(true)
 const overloaded=[...POWER_GRID_SOLUTION];overloaded[9]=0;const status=powerGridStatus(POWER_GRID_SPEC,overloaded);expect(status.overloaded).toBe(true);expect(status.energized).toEqual([]);expect(status.targets.every(t=>!t.powered)).toBe(true);expect(status.issues.some(i=>i.includes('F et J'))).toBe(true)
})
it('le serveur accepte une tentative ratée ou vide sans accepter un réseau mal formé ni une ancienne version de contenu',()=>{
 const c=studioConfig('logique-5-4')!,t=c.tasks[0]!,wrong=POWER_GRID_SPEC.nodes.map((_,i)=>i===0?0:-1);const submission={version:2,contentRevision:c.revision,passion:'logique',answers:{[t.id]:wrong}};const r=validateWorkshop(c.id,submission);expect(r.studio!.steps[0]!.correct).toBe(false);expect(r.studio!.steps[0]!.task.power).toEqual(POWER_GRID_SPEC)
 expect(validateWorkshop(c.id,{...submission,answers:{}}).studio!.steps[0]!.response).toBeNull();expect(()=>validateWorkshop(c.id,{...submission,contentRevision:3})).toThrow('renouvelée');for(const bad of [[0],[1,...wrong.slice(1)],[0,...wrong.slice(1,5),9,...wrong.slice(6)],wrong.map(()=>null)]){expect(powerAnswerWellFormed(POWER_GRID_SPEC,bad)).toBe(false);expect(()=>validateWorkshop(c.id,{...submission,answers:{[t.id]:bad}})).toThrow('Réseau')}
})
it('la nouvelle enquête du badge donne une seule personne et un instant unique, avec toutes les preuves visibles',()=>{
 const people=[{name:'Ari',last:13,in:4,out:5,exit:21},{name:'Nora',last:11,in:6,out:7,exit:24},{name:'Sam',last:15,in:2,out:6,exit:22},{name:'Léo',last:12,in:5,out:4,exit:20}],possibilities=people.flatMap(p=>Array.from({length:60},(_,m)=>m).filter(m=>m>14&&m<=18&&m>=p.last+p.in&&m<=p.exit-p.out).map(m=>[p.name,`14:${String(m).padStart(2,'0')}`]));const c=studioConfig('logique-5-1')!,t=c.tasks[0]!;expect(possibilities).toEqual([t.solution]);expect(t.cards).toHaveLength(4);expect(t.evidenceLayout).toBe('all');expect(c.revision).toBe(4);expect(t.evidence.map(e=>e.text).join(' ')).not.toContain('déclarations');expect(studioCorrect(t,['Nora','14:17'])).toBe(true);expect(studioCorrect(t,['Ari','14:17'])).toBe(false)
})
