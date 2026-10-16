import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader.tsx'
import { MinutonFigure, type MinutonPose } from './Mascot.tsx'
import './Carnet.css'

/** Shared art direction; each screen keeps ownership of its actions and data. */
export function CarnetHeader({ title, subtitle, pose='idea', action, variant='standard', onBack, backLabel }: { title:string; subtitle:string; pose?:MinutonPose; action?:ReactNode; variant?:'standard'|'banner'; onBack?:()=>void; backLabel?:string }) {
 return <div className={`carnet-cover${variant==='banner'?' carnet-banner':''}`}>
  <AppHeader onBack={onBack} backLabel={backLabel}/>
  <div className="carnet-heading"><div><h1>{title}</h1><p>{subtitle}</p></div><MinutonFigure pose={pose} size={variant==='banner'?210:105} animated={false}/>{action&&<div className="carnet-header-action">{action}</div>}</div>
 </div>
}
