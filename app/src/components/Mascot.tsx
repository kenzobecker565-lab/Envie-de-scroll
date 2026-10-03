import { useEquipped } from '../lib/shop.ts'
import { cn } from '@/lib/utils'
export type MinutonPose = 'welcome' | 'think' | 'idea' | 'draw' | 'write' | 'piano' | 'cheer' | 'wait'
export type MascotMood = 'happy' | 'cheer' | 'wink' | 'think' | 'sleepy'
const COSTUMES: Record<string,number> = {'mascot-judo':0,'mascot-basket':1,'mascot-beret':2,'mascot-pianiste':3,'mascot-casque':4,'mascot-equitation':5,'mascot-football':6,'mascot-tennis':7,'mascot-boxe':8,'mascot-natation':9,'mascot-cyclisme':10,'mascot-rugby':11,'mascot-baseball':12,'mascot-ski':13,'mascot-skate':14}
export function Mascot({ mood='happy', size=64, className, animated=true, pose, accessory }: { accessory?:string; pose?:MinutonPose; mood?:MascotMood; size?:number; className?:string; animated?:boolean }) {
 const equipped=useEquipped('mascot')
 return <MinutonFigure pose={pose} mood={mood} size={size} className={className} animated={animated} outfit={accessory ?? equipped?.id}/>
}
/** Eight approved 2D poses for classic Minuton; purchased outfits keep their exact shop artwork. */
export function MinutonFigure({ mood='happy', size=64, className, animated=true, pose, outfit }: { outfit?:string; pose?:MinutonPose; mood?:MascotMood; size?:number; className?:string; animated?:boolean }) {
 const selectedPose=pose ?? ({happy:'welcome',cheer:'cheer',wink:'idea',think:'think',sleepy:'wait'} as const)[mood]
 const cell=outfit?COSTUMES[outfit]:undefined
 return <span aria-hidden="true" className={cn('minuton-art',animated&&'minuton-alive',className)} data-mood={mood} data-pose={cell===undefined?selectedPose:undefined} style={{width:size,height:size*1.1}}>{cell===undefined||outfit==='mascot-basket'?<img src={outfit==='mascot-basket'?'/art/minuton-basket-approved.webp':`/art/minuton-${selectedPose}.webp`} alt="" draggable={false}/>:<span className="minuton-costume" data-costume={outfit} style={{backgroundPosition:`${(cell%4)*100/3}% ${Math.floor(cell/4)*100/3}%`}}/>}</span>
}
