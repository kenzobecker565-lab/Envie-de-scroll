import { ChevronRight } from 'lucide-react'
import { getPassion, passionLevel, type PassionId, type PassionStatsDTO } from '@scroll-up/shared'
const panels: Partial<Record<PassionId, [number,number]>> = { piano:[0,451], dessin:[451,389], ecriture:[840,378], cinema:[1218,412], musique:[1630,418] }
export function PassionArtwork({ passion, className='' }: { passion:PassionId; className?:string }) {
 if (passion==='sport'||passion==='rythme'||passion==='logique'||passion==='francais') {
  return <span aria-hidden="true" className={`studio-passion-art ${className}`} style={{backgroundImage:`url('/art/passion-${passion}.webp')`,backgroundSize:'cover',backgroundPosition:'center 35%'}}/>
 }
 const [left,width]=panels[passion]!
 return <span aria-hidden="true" className={`studio-passion-art ${className}`} style={{backgroundSize:`${2048/width*100}% auto`,backgroundPosition:`${left/(2048-width)*100}% 35%`}}/>
}
export function PassionPoster({ passion, stats, onOpen, compact=false }: { passion:PassionId; stats:PassionStatsDTO; onOpen:()=>void; compact?:boolean }) {
 const level=passionLevel(passion,stats.coins), percent=Math.round(level.progress*100)
 const count=passion==='dessin'?stats.drawings:passion==='cinema'||passion==='musique'?stats.explored:stats.activities
 const unit=passion==='dessin'?'dessin':passion==='ecriture'?'texte':passion==='cinema'?'film exploré':passion==='musique'?'écoute':'activité'
 return <button type="button" className={`studio-passion-poster ${compact?'is-compact':''}`} data-passion={passion} onClick={onOpen} aria-label={`${getPassion(passion).label}, niveau ${level.level}, ${percent} % vers le niveau suivant`}><PassionArtwork passion={passion}/><span className="studio-passion-caption"><strong>{passion==='cinema'?'Cinéma':getPassion(passion).label}</strong>{!compact&&<small className="studio-passion-count">{count?`${count} ${unit}${count>1?'s':''}`:'À découvrir'}</small>}<span className="studio-passion-progress"><span className="studio-gauge"><i style={{width:`${percent}%`}}/></span><span>{percent} %</span></span></span><span className="studio-passion-arrow"><ChevronRight size={20}/></span></button>
}
