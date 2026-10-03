import { useEquipped } from '../lib/shop.ts'
import { cn } from '@/lib/utils'
export type MascotMood = 'happy' | 'cheer' | 'wink' | 'think' | 'sleepy'
const COSTUMES: Record<string,number> = {'mascot-judo':0,'mascot-basket':1,'mascot-beret':2,'mascot-pianiste':3,'mascot-casque':4,'mascot-equitation':5,'mascot-football':6,'mascot-tennis':7,'mascot-boxe':8,'mascot-natation':9,'mascot-cyclisme':10,'mascot-rugby':11,'mascot-baseball':12,'mascot-ski':13,'mascot-skate':14}
export function Mascot({ mood='happy', size=64, className, animated=true, accessory }: { accessory?:string; mood?:MascotMood; size?:number; className?:string; animated?:boolean }) {
 const equipped=useEquipped('mascot')
 return <MinutonFigure mood={mood} size={size} className={className} animated={animated} outfit={accessory ?? equipped?.id}/>
}
/** Assets extracted from the approved 2D character. The same drawing is used in previews and when equipped. */
export function MinutonFigure({ mood='happy', size=64, className, animated=true, outfit }: { outfit?:string; mood?:MascotMood; size?:number; className?:string; animated?:boolean }) {
 const cell=outfit?COSTUMES[outfit]:undefined
 return <span aria-hidden="true" className={cn('minuton-art',animated&&'minuton-alive',className)} data-mood={mood} style={{width:size,height:size*1.1}}>{cell===undefined||outfit==='mascot-basket'?<img src={outfit==='mascot-basket'?'/art/minuton-basket-approved.webp':'/art/minuton-approved.webp'} alt="" draggable={false}/>:<span className="minuton-costume" data-costume={outfit} style={{backgroundPosition:`${(cell%4)*100/3}% ${Math.floor(cell/4)*100/3}%`}}/>}</span>
}
