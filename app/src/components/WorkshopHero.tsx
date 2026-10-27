import type { PassionId } from '@scroll-up/shared'
import { PassionArtwork } from './PassionArtwork.tsx'
import { Mascot } from './Mascot.tsx'

export function WorkshopHero({passion,title,subtitle}:{passion:PassionId;title:string;subtitle:string}) {
 return <header className="iw-hero" data-passion={passion}>
  <PassionArtwork passion={passion}/>
  <div className="iw-hero-copy"><span>{subtitle}</span><h1>{title}</h1></div>
  <Mascot pose={passion==='logique'?'think':passion==='francais'?'write':'idea'} size={80}/>
 </header>
}
