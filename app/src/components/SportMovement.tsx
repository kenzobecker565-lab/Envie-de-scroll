import { useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { SPORT_EXERCISES, type SportExerciseId } from '@scroll-up/shared'
import './SportMovement.css'

type Point=[number,number]
type Pose={head:Point;shoulder:Point;hip:Point;arms:[Point,Point][];legs:[Point,Point][]}
const stand:Pose={head:[120,37],shoulder:[120,66],hip:[120,121],arms:[[[100,94],[100,121]],[[143,94],[143,121]]],legs:[[[104,161],[104,202]],[[139,161],[142,202]]]}
/** Explicit limb joints keep each schematic to two arms and two legs. */
function poseFor(exercise:SportExerciseId,low:boolean):Pose {
 const {pose}=SPORT_EXERCISES[exercise]
 if(pose==='squat')return low?{head:[101,62],shoulder:[107,91],hip:[90,130],arms:[[[143,87],[183,87]],[[149,92],[189,92]]],legs:[[[145,145],[134,202]],[[155,154],[148,202]]]}:stand
 if(pose==='lunge')return low?{head:[107,58],shoulder:[107,87],hip:[107,133],arms:[[[84,111],[83,143]],[[132,111],[133,143]]],legs:[[[155,149],[152,202]],[[80,185],[49,202]]]}:{...stand,legs:[[[137,161],[158,202]],[[82,164],[54,202]]]}
 if(pose==='wall')return low?{head:[142,50],shoulder:[142,79],hip:[107,131],arms:[[[162,79],[202,83]],[[165,86],[202,90]]],legs:[[[80,166],[61,202]],[[88,166],[69,202]]]}:{head:[107,41],shoulder:[109,70],hip:[88,129],arms:[[[158,76],[202,83]],[[158,83],[202,90]]],legs:[[[74,167],[61,202]],[[82,170],[69,202]]]}
 if(pose==='push'||pose==='plank')return {head:low&&pose==='push'?[166,122]:[154,96],shoulder:low&&pose==='push'?[148,144]:[135,122],hip:[89,151],arms:pose==='plank'?[[[145,174],[180,183]],[[139,174],[174,185]]]:low?[[[147,163],[171,194]],[[141,165],[165,194]]]:[[[151,156],[160,194]],[[145,156],[154,194]]],legs:[[[62,186],[26,167]],[[70,190],[34,171]]]}
 if(pose==='bridge')return {head:[43,177],shoulder:[69,187],hip:low?[130,136]:[125,185],arms:[[[93,190],[117,198]],[[85,196],[111,202]]],legs:[[[170,137],[186,195]],[[164,143],[180,201]]]}
 if(pose==='bird')return {head:[162,112],shoulder:[141,135],hip:[90,138],arms:low?[[[174,133],[210,130]],[[143,166],[148,195]]]:[[[145,165],[148,195]],[[137,165],[140,195]]],legs:low?[[[49,139],[15,140]],[[87,186],[50,191]]]:[[[82,183],[48,194]],[[91,186],[56,199]]]}
 if(pose==='sideplank')return {head:low?[80,113]:[80,140],shoulder:low?[91,142]:[91,167],hip:low?[143,157]:[143,188],arms:[[[76,178],[42,190]],[[116,148],[143,157]]],legs:[[[182,183],[153,205]],[[188,186],[160,210]]]}
 if(pose==='march')return low?{...stand,legs:[[[153,132],[162,168]],[[109,164],[109,202]]],arms:[[[100,87],[130,69]],[[148,100],[154,121]]]}:{...stand,legs:[[[80,132],[75,166]],[[137,164],[137,202]]],arms:[[[91,103],[85,122]],[[145,83],[128,69]]]}
 if(pose==='calf')return low?{...stand,head:[120,30],shoulder:[120,59],hip:[120,114],legs:[[[106,153],[106,193]],[[139,153],[139,193]]]}:stand
 if(pose==='leg')return low?{...stand,legs:[[[82,150],[53,181]],[[137,161],[137,202]]]}:stand
 if(pose==='side')return low?{...stand,legs:[[[91,163],[77,202]],[[144,162],[163,202]]]}:stand
 if(pose==='shoulders')return low?{...stand,arms:[[[93,84],[94,116]],[[149,84],[148,116]]]}:stand
 return stand
}
function Human({exercise,low,side}:{exercise:SportExerciseId;low:boolean;side?:'left'|'right'}) {
 const p=poseFor(exercise,low),name=SPORT_EXERCISES[exercise].pose
 const line=(a:Point,b:Point,c:Point,color:string,width:number,key:string)=><polyline key={key} points={`${a.join(',')} ${b.join(',')} ${c.join(',')}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"/>
 return <svg viewBox="0 0 240 230" role="img" aria-label={`${SPORT_EXERCISES[exercise].title} : ${low?'mouvement':'départ'}`}>
  <g transform={(side??SPORT_EXERCISES[exercise].side)==='right'?'translate(240 0) scale(-1 1)':undefined}>
  <ellipse cx="123" cy="216" rx="77" ry="5" fill="#DED3EB"/>
  {name==='wall'&&<path d="M211 42V210" stroke="#8A69AF" strokeWidth="5"/>}
  {p.legs.map(([knee,foot],i)=><g key={'leg'+i}>{line(p.hip,knee,foot,'#35204F',20,'outline')}{line(p.hip,knee,foot,'#F3BB99',14,'skin')}{line(p.hip,[p.hip[0]+(knee[0]-p.hip[0])*.65,p.hip[1]+(knee[1]-p.hip[1])*.65],[p.hip[0]+(knee[0]-p.hip[0])*.8,p.hip[1]+(knee[1]-p.hip[1])*.8],'#9152DD',17,'shorts')}<path d={`M${foot[0]-4},${foot[1]}h17`} stroke="#35204F" strokeWidth="10" strokeLinecap="round"/><path d={`M${foot[0]-4},${foot[1]-2}h15`} stroke="#955BE0" strokeWidth="5" strokeLinecap="round"/></g>)}
  <path d={`M${p.shoulder[0]},${p.shoulder[1]} L${p.hip[0]},${p.hip[1]}`} stroke="#35204F" strokeWidth="36" strokeLinecap="round"/><path d={`M${p.shoulder[0]},${p.shoulder[1]} L${p.hip[0]},${p.hip[1]}`} stroke="#FFF2D9" strokeWidth="30" strokeLinecap="round"/>
  {p.arms.map(([elbow,hand],i)=>{const root:Point=['squat','lunge','march','calf','leg','side','shoulders'].includes(name)?[p.shoulder[0]+(i===0?-12:12),p.shoulder[1]]:p.shoulder;return <g key={'arm'+i}>{line(root,elbow,hand,'#35204F',12,'outline')}{line(root,elbow,hand,'#F3BB99',8,'skin')}</g>})}
  <path d={`M${p.shoulder[0]},${p.shoulder[1]-12}L${p.head[0]},${p.head[1]+12}`} stroke="#35204F" strokeWidth="12"/><path d={`M${p.shoulder[0]},${p.shoulder[1]-12}L${p.head[0]},${p.head[1]+12}`} stroke="#F3BB99" strokeWidth="8"/>
  <circle cx={p.head[0]} cy={p.head[1]} r="17" fill="#F3BB99" stroke="#35204F" strokeWidth="3"/>
  <path d={`M${p.head[0]-15},${p.head[1]+2}Q${p.head[0]-24},${p.head[1]-22} ${p.head[0]+7},${p.head[1]-18}Q${p.head[0]+17},${p.head[1]-14} ${p.head[0]+15},${p.head[1]-5}Q${p.head[0]+3},${p.head[1]-13} ${p.head[0]-4},${p.head[1]-3}Z`} fill="#4D277B" stroke="#35204F" strokeWidth="2"/>
  <circle cx={p.head[0]+8} cy={p.head[1]+1} r="1.7" fill="#35204F"/><path d={`M${p.head[0]+6},${p.head[1]+9}q4 2 7-1`} fill="none" stroke="#35204F" strokeWidth="1.5"/>
 </g></svg>
}
export function SportMovement({exercise,compact=false,side}:{exercise:SportExerciseId;compact?:boolean;side?:'left'|'right'}){
 const [playing,setPlaying]=useState(false)
 return <div className={`sport-movement ${compact?'is-compact':''}`} data-playing={playing}>
  <div className="sport-poses"><div className="sport-pose-start"><Human exercise={exercise} low={false} side={side}/><small>Départ</small></div><div className="sport-pose-end"><Human exercise={exercise} low side={side}/><small>Mouvement</small></div></div>
  <button type="button" className="sport-play" aria-pressed={playing} onClick={()=>setPlaying(!playing)}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'Arrêter la démonstration':'Voir les deux positions en boucle'}</button>
 </div>
}
export function SportInstructions({exercise,easy,onEasy}:{exercise:SportExerciseId;easy:boolean;onEasy?:(easy:boolean)=>void}){
 const e=SPORT_EXERCISES[exercise],shown=easy&&e.easyExercise?e.easyExercise:exercise
 return <section className="iw-card sport-instructions"><h2>{easy&&e.easyExercise?SPORT_EXERCISES[shown].title+' · variante':e.title}</h2><SportMovement exercise={shown}/><ol>{SPORT_EXERCISES[shown].steps.map((step,i)=><li key={step}><span>{i+1}</span>{step}</li>)}</ol><p className="sport-cue">{e.cue}</p><details><summary>Version plus facile</summary><p>{e.easier}</p>{onEasy&&<button className="iw-text-button" type="button" aria-pressed={easy} onClick={()=>onEasy(!easy)}>{easy?'Version plus facile sélectionnée · changer':'Choisir cette version pour la séance'}</button>}</details><details><summary>Le repère à garder</summary><p>{e.mistake}</p></details></section>
}
