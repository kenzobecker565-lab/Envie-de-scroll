/** Ports: haut=1, droite=2, bas=4, gauche=8. Each port set is one distinct orientation. */
export type PowerGridSpec = {
 nodes:{label:string;x:number;y:number;cost:number;ports:number[]}[];
 targets:{node:number;label:string;stabilizer?:number}[];
 incompatible:[number,number][];
 budget:number;
}
export type PowerGridStatus = {valid:boolean;cost:number;energized:number[];edges:[number,number][];issues:string[];overloaded:boolean;targets:{label:string;powered:boolean;stabilized:boolean}[]}
export const PORT_NAMES=['haut','droite','bas','gauche'] as const
export function portLabel(mask:number):string{return PORT_NAMES.filter((_,i)=>mask&(1<<i)).join(' / ')}
export function powerAnswerWellFormed(spec:PowerGridSpec,value:unknown):value is number[]{return Array.isArray(value)&&value.length===spec.nodes.length&&value.every((r,i)=>Number.isInteger(r)&&r>=-1&&r<spec.nodes[i]!.ports.length)&&value[0]===0}
export function powerGridStatus(spec:PowerGridSpec,value:unknown):PowerGridStatus{
 const wellFormed=powerAnswerWellFormed(spec,value),state=wellFormed?value:spec.nodes.map((_,i)=>i===0?0:-1),active=state.flatMap((r,i)=>r>=0?[i]:[])
 const cost=active.reduce((s,i)=>s+spec.nodes[i]!.cost,0),edges:[number,number][]=[]
 for(let a=0;a<spec.nodes.length;a++)for(let b=a+1;b<spec.nodes.length;b++){
  if(state[a]!<0||state[b]!<0)continue
  const na=spec.nodes[a]!,nb=spec.nodes[b]!,pa=na.ports[state[a]!]!,pb=nb.ports[state[b]!]!
  if((nb.x===na.x+1&&nb.y===na.y&&(pa&2)&&(pb&8))||(nb.y===na.y+1&&nb.x===na.x&&(pa&4)&&(pb&1)))edges.push([a,b])
 }
 const reach=(removed=-1)=>{const seen=new Set([0]);let changed=true;while(changed){changed=false;for(const [a,b] of edges){if(a===removed||b===removed)continue;if(seen.has(a)&&!seen.has(b)){seen.add(b);changed=true}if(seen.has(b)&&!seen.has(a)){seen.add(a);changed=true}}}return seen}
 const seen=reach(),overloaded=spec.incompatible.some(([a,b])=>active.includes(a)&&active.includes(b)),issues:string[]=[]
 if(!wellFormed)issues.push('Construis ton réseau avant de vérifier.')
 if(cost>spec.budget)issues.push(`Budget dépassé : ${cost} unités utilisées pour ${spec.budget} disponibles.`)
 for(const [a,b] of spec.incompatible)if(active.includes(a)&&active.includes(b))issues.push(`Surcharge : ${spec.nodes[a]!.label} et ${spec.nodes[b]!.label} ne peuvent pas être activés ensemble.`)
 const targets=spec.targets.map(t=>{const connected=seen.has(t.node),stabilized=t.stabilizer===undefined||(seen.has(t.stabilizer)&&!reach(t.stabilizer).has(t.node));if(!connected)issues.push(`${t.label} n’est pas relié à S : vérifie les relais actifs et leurs orientations.`);else if(!stabilized)issues.push(`${t.label} reçoit un courant non stabilisé : toute alimentation doit passer par ${spec.nodes[t.stabilizer!]!.label}.`);return {label:t.label,powered:connected&&!overloaded,stabilized}})
 if(active.some(i=>!seen.has(i)))issues.push('Un ou plusieurs relais actifs sont isolés de S et consomment quand même leur coût.')
 return {valid:wellFormed&&issues.length===0,cost,energized:overloaded?[]:[...seen],edges,issues,overloaded,targets}
}
