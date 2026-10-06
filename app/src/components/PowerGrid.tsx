import {useState} from 'react'
import {Check,Filter,Power,Radio,RotateCw,RotateCcw,Zap} from 'lucide-react'
import {portLabel,powerAnswerWellFormed,powerGridStatus,type StudioTask} from '@scroll-up/shared'
import {Button} from './ui/button.tsx'
import './PowerGrid.css'
export function PowerGrid({task,answer,onChange}:{task:StudioTask;answer:unknown;onChange:(value:number[])=>void}){
 const spec=task.power!,state=powerAnswerWellFormed(spec,answer)?answer:spec.nodes.map((_,i)=>i===0?0:-1),status=powerGridStatus(spec,state)
 const [selected,setSelected]=useState(1),[undo,setUndo]=useState<number[][]>([])
 const node=spec.nodes[selected]!,orientation=state[selected]!>=0?state[selected]!:0,mask=node.ports[orientation]!,stabilizer=spec.targets.find(t=>t.stabilizer!==undefined)?.stabilizer
 const update=(next:number[])=>{setUndo(v=>[...v,state]);onChange(next)}
 const toggle=()=>{const next=[...state];next[selected]=next[selected]!>=0?-1:0;update(next)}
 const rotate=()=>{const next=[...state];next[selected]=(next[selected]!+1)%node.ports.length;update(next)}
 const at=(n:{x:number;y:number})=>({x:(n.x+.5)*75,y:(n.y+.5)*75})
 const paths=spec.nodes.flatMap((n,a)=>spec.nodes.slice(a+1).flatMap((other,j)=>Math.abs(n.x-other.x)+Math.abs(n.y-other.y)===1?[[a,a+j+1] as [number,number]]:[]))
 return <div className="power-workshop">
  <div className="power-budget" data-over={status.cost>spec.budget}><Zap size={17}/><strong>Énergie {status.cost} / {spec.budget}</strong><span>{status.cost>spec.budget?'Budget dépassé':'unités'}</span></div>
  <div className="power-targets" aria-live="polite">{status.targets.map((t,i)=><div key={t.label} data-powered={t.powered&&t.stabilized}>{i===0?<Filter size={17}/>:i===1?<Radio size={17}/>:<Power size={17}/>}<span><strong>{t.label}</strong><small>{!t.powered?'Hors tension':!t.stabilized?'Non stabilisé':'Alimenté'}</small></span></div>)}</div>
  {status.overloaded&&<p role="status" className="power-overload">Surcharge : F et J sont actifs ensemble. Le réseau est coupé.</p>}
  <p className="power-instructions">Sélectionne un relais, puis active-le ou fais-le pivoter. Les câbles lumineux sont réellement reliés à S.</p>
  <div className="power-board"><svg viewBox="0 0 300 300" aria-hidden="true">{paths.map(([a,b])=>{const na=at(spec.nodes[a]!),nb=at(spec.nodes[b]!),connected=status.edges.some(([x,y])=>x===a&&y===b),lit=connected&&status.energized.includes(a)&&status.energized.includes(b);return <line key={`${a}-${b}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} className={lit?'lit':connected?'connected':''}/>})}</svg>
   {spec.nodes.map((n,i)=>{const active=state[i]!>=0,ports=n.ports[active?state[i]!:0]!,terminal=spec.targets.find(t=>t.node===i),lit=status.energized.includes(i);return <button type="button" key={n.label} className="power-tile" style={{left:`${(n.x+.5)*25}%`,top:`${(n.y+.5)*25}%`}} aria-pressed={selected===i} aria-label={`Sélectionner ${n.label}, coût ${n.cost}${i===stabilizer?', stabilisateur':''}${terminal?`, ${terminal.label}`:''}, ${active?'actif':'coupé'}, connexions ${portLabel(ports)}`} onClick={()=>setSelected(i)} data-active={active} data-lit={lit} data-selected={selected===i} data-special={i===0||i===stabilizer||!!terminal}><span className="power-tile-label">{n.label}{i===0?<Zap size={10}/>:i===stabilizer?<Filter size={10}/>:terminal?<Power size={10}/>:null}</span><svg viewBox="0 0 60 60" aria-hidden="true">{[1,2,4,8].map((p,j)=>ports&p?<line key={p} x1="30" y1="30" x2={[30,60,30,0][j]} y2={[0,30,60,30][j]}/>:null)}<circle cx="30" cy="30" r="5"/></svg><span className="power-tile-cost">{n.cost} u.{active&&<Check size={9}/>}</span></button>})}
  </div>
  <div className="power-controls"><div><strong>{selected===0?'Source S':`Relais ${node.label}`}{selected===stabilizer?' · stabilisateur':''}</strong><small>{state[selected]!>=0?'Actif':'Coupé'} · {portLabel(mask)} · {node.ports.length>1?'orientable':'fixe'}</small></div><div className="power-control-buttons"><Button variant="secondary" disabled={selected===0} onClick={toggle}><Power size={16}/>{state[selected]!>=0?'Couper':'Activer'}</Button><Button variant="secondary" disabled={node.ports.length===1||state[selected]!<0} onClick={rotate}><RotateCw size={16}/>Pivoter</Button></div></div>
  <div className="studio-action-pair"><Button variant="secondary" size="sm" disabled={!undo.length} onClick={()=>{onChange(undo.at(-1)!);setUndo(v=>v.slice(0,-1))}}>Annuler</Button><Button variant="secondary" size="sm" onClick={()=>update(spec.nodes.map((_,i)=>i===0?0:-1))}><RotateCcw size={15}/>Réinitialiser</Button></div>
  <p className="power-legend">S : source · G : stabilisateur des Archives · F et J : incompatibles. Un relais actif isolé coûte quand même ses unités.</p>
 </div>
}
