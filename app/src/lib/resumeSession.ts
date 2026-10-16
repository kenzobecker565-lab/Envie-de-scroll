import {getPathStep,isFixedActivityId,type ProposalDTO} from '@scroll-up/shared'
import {lessonStack} from './useLesson.ts'
import type {Route} from '../state/AppState.tsx'
export function sessionStack(proposal:ProposalDTO):Route[]{
 const lesson=getPathStep(proposal.activityId)
 return lesson?lessonStack(lesson,{name:'activity'}):[{name:'home'},{name:!proposal.activityId.startsWith('dessin-v2-')&&(proposal.external||proposal.passion==='ecriture'||(proposal.passion==='dessin'&&!proposal.activityId.startsWith('dessin-v2-')))?'creativeSession':'activity'}]
}
export function sessionFlow(proposal:ProposalDTO,serverTime:string){
 return {duration:proposal.duration,passion:proposal.passion,proposal,external:proposal.external,pad:!proposal.external,scrollFlow:true,clockOffset:Date.parse(serverTime)-Date.now(),...(isFixedActivityId(proposal.activityId)?{fixedStep:proposal.activityId}:{})}
}
