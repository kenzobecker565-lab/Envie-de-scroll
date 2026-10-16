import type {PassionId} from '@scroll-up/shared'
import './PassionIllustration.css'
/** The approved Explorer illustrations, shared with the first passion selection. */
export function PassionIllustration({passion,className=''}:{passion:PassionId;className?:string}){
 return <span className={`passion-illustration ${className}`} data-passion={passion} aria-hidden="true"/>
}
