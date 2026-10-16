import {useEffect,useRef,useState} from 'react'
import type {ProposalDTO} from '@scroll-up/shared'
import {api} from '../api/client.ts'
export function useCreativeClock(initial:ProposalDTO|undefined,offset:number,external:boolean){
 const [proposal,setProposal]=useState(initial),[now,setNow]=useState(Date.now()),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const current=useRef(proposal),outside=useRef(external),locking=useRef(false),finished=useRef(false)
 current.current=proposal;outside.current=external
 const sync=async(action:'pause'|'resume')=>{if(!initial||locking.current)return false;locking.current=true;setBusy(true);setError('');try{const r=await api.session(initial.id,action);setProposal(r.proposal);setNow(Date.now());serverOffset.current=Date.parse(r.serverTime)-Date.now();return true}catch(e){setError((e as Error).message);return false}finally{locking.current=false;setBusy(false)}}
 const serverOffset=useRef(offset),cleanupTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined)
 useEffect(()=>{const interval=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(interval)},[])
 useEffect(()=>{
  clearTimeout(cleanupTimer.current)
  const leaving=()=>{if(initial&&!finished.current&&!outside.current)void api.session(initial.id,'pause',true).catch(()=>{})}
  window.addEventListener('pagehide',leaving)
  const hidden=()=>{if(document.hidden&&!outside.current&&current.current?.activeSince)void sync('pause')}
  document.addEventListener('visibilitychange',hidden)
  return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leaving);cleanupTimer.current=setTimeout(leaving,0)}
 },[initial?.id])
 const elapsed=proposal?Math.max(0,proposal.timerTracked?(proposal.activeSeconds??0)+(proposal.activeSince?Math.max(0,(now+serverOffset.current-Date.parse(proposal.activeSince))/1000):0):(now+serverOffset.current-Date.parse(proposal.createdAt))/1000):0
 return {elapsed,seconds:Math.max(0,(proposal?.duration??5)*60-Math.floor(elapsed)),paused:proposal?.timerTracked&&!proposal.activeSince,busy,error,toggle:()=>sync(proposal?.activeSince?'pause':'resume'),pause:()=>sync('pause'),resume:()=>sync('resume'),markFinished:()=>{finished.current=true}}
}
