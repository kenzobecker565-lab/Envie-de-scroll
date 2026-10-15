import { activitiesFor } from './activities.ts'
import { ACTIVE_PASSION_IDS } from './passions.ts'
import { collection, passionLevel } from './progress.ts'
import type { Activity, Duration, PassionId } from './types.ts'
import type { PassionStatsDTO } from './api.ts'

/** Read-only recommendations: browsing ideas never creates or abandons a session. */
export function scrollSuggestions(passions: readonly PassionId[], duration: Duration, tried: readonly string[] = [], recent: readonly string[] = [], random = Math.random): Activity[] {
 const preferred = ACTIVE_PASSION_IDS.filter(id => passions.includes(id))
 const pool = (preferred.length ? preferred : ACTIVE_PASSION_IDS).map(passion => ({passion, items:activitiesFor(passion,duration)}))
 const score = (a:Activity) => (recent.includes(a.id)?4:0)+(tried.includes(a.id)?1:0)
 const shuffled = <T,>(items:readonly T[]) => items.map(value=>({value,order:random()})).sort((a,b)=>a.order-b.order).map(x=>x.value)
 const candidates = shuffled(pool).map(group => shuffled(group.items).sort((a,b)=>score(a)-score(b)))
 const result:Activity[]=[]
 for(let round=0;result.length<3;round++) {
  let added=false
  for(const group of candidates){const item=group[round];if(item&&result.length<3){result.push(item);added=true}}
  if(!added)break
 }
 return result
}
export function discoveredActivities(passion:PassionId, tried:readonly string[]) {
 const ids=new Set(collection(passion).flatMap(group=>group.activities.map(a=>a.id)))
 return {count:new Set(tried.filter(id=>ids.has(id))).size,total:ids.size}
}
/** XP is earned practice time, never the wallet balance or test shop credits. */
export function experience(passion:PassionId, minutes:number) {
 const practice=Math.max(0,Math.floor(minutes)),level=passionLevel(passion,practice)
 return {...level,xp:practice*10,nextXp:level.next?level.next.minutes*10:null}
}
export function progressFor(passion:PassionId, rows:readonly PassionStatsDTO[]) {
 const row=rows.find(value=>value.passion===passion)
 return {...experience(passion,row?.minutes??0),...discoveredActivities(passion,row?.tried??[])}
}
export const ATELIER_AMBIANCES=['lavande','sauge','crepuscule'] as const
export const ATELIER_FRAMES=['bois','violet','papier'] as const
export const ATELIER_DECORS=['atelier','epure'] as const
export interface AtelierAppearance { ambiance:typeof ATELIER_AMBIANCES[number]; frames:typeof ATELIER_FRAMES[number]; decor:typeof ATELIER_DECORS[number]; mascot:boolean }
export const DEFAULT_ATELIER:AtelierAppearance={ambiance:'lavande',frames:'bois',decor:'atelier',mascot:true}
export function parseAtelierAppearance(value:unknown):AtelierAppearance {
 let v:Record<string,unknown>={}
 try{const raw=typeof value==='string'?JSON.parse(value):value;if(raw&&typeof raw==='object'&&!Array.isArray(raw))v=raw as Record<string,unknown>}catch{/* Use shared defaults for old accounts. */}
 return {ambiance:ATELIER_AMBIANCES.includes(v.ambiance as AtelierAppearance['ambiance'])?v.ambiance as AtelierAppearance['ambiance']:DEFAULT_ATELIER.ambiance,frames:ATELIER_FRAMES.includes(v.frames as AtelierAppearance['frames'])?v.frames as AtelierAppearance['frames']:DEFAULT_ATELIER.frames,decor:ATELIER_DECORS.includes(v.decor as AtelierAppearance['decor'])?v.decor as AtelierAppearance['decor']:DEFAULT_ATELIER.decor,mascot:typeof v.mascot==='boolean'?v.mascot:true}
}
