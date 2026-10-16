import {useEffect,useState} from 'react'
import {DISCOVERY_GUIDES,type DiscoveryGuide} from '@scroll-up/shared'
import {api} from '../api/client.ts'
import {useAppState,useNavigation} from '../state/AppState.tsx'
import {DISCOVERY_TOURS,discoverySeen,guideForRoute,rememberDiscovery} from '../lib/discoveryGuides.ts'
import {tutorialSeen} from '../lib/tutorial.ts'
import {GuidedTour} from './GuidedTour.tsx'
/** A guide belongs to the feature actually opened; it never redirects the user. */
export function ContextualGuides(){
 const {state,dispatch}=useAppState(),{route}=useNavigation()
 const [active,setActive]=useState<{id:DiscoveryGuide;routeKey:string}>()
 const routeKey=JSON.stringify(route),candidate=guideForRoute(route)
 useEffect(()=>{
  for(const id of DISCOVERY_GUIDES)if(discoverySeen(state.me.user,id)&&!state.me.user.completedGuides?.includes(id))void api.finishGuide(id).then(()=>dispatch({type:'guideCompleted',id})).catch(()=>{})
 },[state.me.user.id,dispatch])
 useEffect(()=>{
  setActive(undefined)
  if(state.tutorialOpen||!tutorialSeen(state.me.user)||!candidate||discoverySeen(state.me.user,candidate))return
  let interval:ReturnType<typeof setInterval>|undefined
  const timer=setTimeout(()=>{
   interval=setInterval(()=>{
    if(!document.querySelector(DISCOVERY_TOURS[candidate].anchor)||document.querySelector('[role="dialog"]'))return
    clearInterval(interval);setActive({id:candidate,routeKey})
   },150)
  },500)
  return()=>{clearTimeout(timer);clearInterval(interval)}
 },[routeKey,candidate,state.tutorialOpen,state.me.user.id,state.me.user.tutorialCompleted,state.me.user.completedGuides])
 if(!active||active.routeKey!==routeKey||state.tutorialOpen)return null
 const finish=()=>{rememberDiscovery(state.me.user.id,active.id);dispatch({type:'guideCompleted',id:active.id});setActive(undefined);void api.finishGuide(active.id).catch(()=>{})}
 return <GuidedTour key={active.id} steps={DISCOVERY_TOURS[active.id].steps} onFinish={finish}/>
}
