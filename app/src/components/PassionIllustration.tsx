import type {PassionId} from '@scroll-up/shared'
import './PassionIllustration.css'
// Exact illustration windows from the approved mockup; preserve its artwork without redrawing it.
const EDITORIAL_WINDOWS:Partial<Record<PassionId,string>>={
 dessin:'60 126 456 286',piano:'570 126 456 286',
 ecriture:'60 532 456 290',sport:'570 532 456 290',
 francais:'60 940 456 287',logique:'570 940 456 287',
}
/** Classic illustrations remain available; Explorer cards use the approved editorial artwork. */
export function PassionIllustration({passion,className='',variant='classic'}:{passion:PassionId;className?:string;variant?:'classic'|'editorial'}){
 const window=variant==='editorial'?EDITORIAL_WINDOWS[passion]:undefined
 if(window)return <svg className={`passion-illustration ${className}`} data-passion={passion} data-variant="editorial" viewBox={window} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" style={{overflow:'hidden'}}><image href="/art/explorer-passions-editorial-v2.webp" width="1086" height="1448"/></svg>
 return <span className={`passion-illustration ${className}`} data-passion={passion} aria-hidden="true"/>
}
