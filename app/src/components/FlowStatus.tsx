import { Mascot, MinutonFigure, type MinutonPose } from './Mascot.tsx'
/** Honest, accessible progress without an invented percentage. */
export function FlowStatus({ title, description, pose = 'think', boot = false }: { title: string; description?: string; pose?: MinutonPose; boot?: boolean }) {
  return <section className="flow-status" role="status" aria-live="polite" aria-busy="true">
    {boot ? <MinutonFigure pose={pose} size={132}/> : <Mascot pose={pose} size={108}/>}
    <div><h2>{title}</h2>{description && <p>{description}</p>}<span className="flow-dots" aria-hidden="true"><i/><i/><i/></span></div>
  </section>
}
