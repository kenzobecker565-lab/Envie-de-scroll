import { ChevronRight } from 'lucide-react'
import { getPassion, passionLevel, type PassionId, type PassionStatsDTO } from '@scroll-up/shared'
const panels: Record<PassionId, [number,number]> = { piano:[0,451], dessin:[451,389], ecriture:[840,378], cinema:[1218,412], musique:[1630,418] }
export function PassionArtwork({ passion, className='' }: { passion:PassionId; className?:string }) {
 const [left,width]=panels[passion]
 return <span aria-hidden="true" className={`studio-passion-art ${className}`} style={{backgroundSize:`${2048/width*100}% auto`,backgroundPosition:`${left/(2048-width)*100}% 35%`}}/>
}
export function PassionPoster({ passion, stats, onOpen, compact=false }: { passion:PassionId; stats:PassionStatsDTO; onOpen:()=>void; compact?:boolean }) {
 const level=passionLevel(passion,stats.minutes), percent=Math.round(level.progress*100)
 return <button type="button" className={`studio-passion-poster ${compact?'is-compact':''}`} data-passion={passion} onClick={onOpen} aria-label={`${getPassion(passion).label}, niveau ${level.level}, ${percent} % vers le niveau suivant`}><PassionArtwork passion={passion}/><span className="studio-passion-caption"><strong>{passion==='cinema'?'Cinéma':getPassion(passion).label}</strong><span className="studio-passion-progress"><span className="studio-gauge"><i style={{width:`${percent}%`}}/></span><span>{percent} %</span></span></span><span className="studio-passion-arrow"><ChevronRight size={20}/></span></button>
}
