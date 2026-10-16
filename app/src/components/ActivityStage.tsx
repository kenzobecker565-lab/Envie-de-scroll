import type {ReactNode} from 'react'
import {ArrowLeft,Pause,Play} from 'lucide-react'
import type {PassionId} from '@scroll-up/shared'
import {Logo} from './Brand.tsx'
import {MinutonFigure} from './Mascot.tsx'
import {Screen} from './Screen.tsx'
import {useNavigation} from '../state/AppState.tsx'
import type {useCreativeClock} from '../lib/useCreativeClock.ts'
import './ActivityStage.css'
const HEADINGS:Partial<Record<PassionId,string>>={piano:'Au piano',dessin:'À toi de dessiner',ecriture:'Laisse venir les mots',sport:'Un moment pour bouger',logique:'À toi de trouver',francais:'Joue avec les mots'}
const POSES={piano:'gallery-piano',dessin:'gallery-drawing',ecriture:'gallery-writing',sport:'gallery-sport',logique:'gallery-logic',francais:'gallery-reading'} as const
export function ActivityStage({passion,children,clock,className=''}:{passion:PassionId;children:ReactNode;clock?:ReactNode;className?:string}){
 const {back,canGoBack}=useNavigation()
 return <Screen className={`scroll-flow activity-stage stage-${passion} ${className}`}><header className="activity-stage-cover"><div className="activity-stage-brand">{canGoBack&&<button type="button" aria-label="Retour" onClick={back}><ArrowLeft size={23}/></button>}<Logo height={30}/></div><div className="activity-stage-heading"><h1>{HEADINGS[passion]??'À toi de jouer'}</h1><MinutonFigure pose={POSES[passion as keyof typeof POSES]??'idea'} size={140} animated={false}/></div></header>{clock&&<div className="activity-stage-clock">{clock}</div>}<div className="activity-stage-content">{children}</div></Screen>
}
export function ActivityClock({clock}:{clock:ReturnType<typeof useCreativeClock>}){
 return <><div className="stage-clock-chip"><button type="button" disabled={clock.busy} aria-label={clock.paused?'Reprendre le chronomètre':'Mettre le chronomètre en pause'} onClick={()=>void clock.toggle()}>{clock.paused?<Play size={18}/>:<Pause size={18}/>}</button><output aria-label="Temps restant">{Math.floor(clock.seconds/60).toString().padStart(2,'0')}:{String(clock.seconds%60).padStart(2,'0')}</output></div>{clock.paused&&<small className="stage-clock-note">En pause · les minutes ne sont pas comptées.</small>}{clock.error&&<p role="alert" className="stage-clock-note">{clock.error}</p>}</>
}
