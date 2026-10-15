import { activityBrief, getActivity, keyboardMelody, type CompletionDTO } from '@scroll-up/shared'
export function creationTitle(item:CompletionDTO){
 const activity=getActivity(item.activityId)
 if(item.passion==='piano')return keyboardMelody(item.activityId)?.title??item.exploredTitle??item.activityText
 if(item.passion==='ecriture'&&item.text)return item.text.trim().split('\n').find(Boolean)!.slice(0,70)
 return (activity?activityBrief(activity)?.title:undefined)??item.activityText
}
export function hasCreation(item:CompletionDTO){return Boolean(item.photoUrl||item.text?.trim()||item.workshop||item.sport||item.passion==='piano')}
/** Lossless pagination: no trimmed words, no dropped whitespace, no UTF-16 surrogate splits. */
export function paginateText(text:string,limit=650):string[]{
 if(!text)return ['']
 const pages:string[]=[];let rest=text
 while(rest.length>limit){let cut=rest.lastIndexOf('\n',limit);if(cut<limit*.45)cut=rest.lastIndexOf(' ',limit);if(cut<limit*.45)cut=limit
 if(/[\uD800-\uDBFF]/.test(rest[cut-1]??''))cut--
 pages.push(rest.slice(0,cut));rest=rest.slice(cut)}
 if(rest)pages.push(rest)
 return pages
}
export function mergeCreations(previous:CompletionDTO[],next:CompletionDTO[]){return [...new Map([...previous,...next].map(item=>[item.id,item])).values()]}
export function calendarMonth(year:number,month:number){const first=new Date(year,month,1),days=new Date(year,month+1,0).getDate();return [...Array((first.getDay()+6)%7).fill(null),...Array.from({length:days},(_,i)=>i+1)] as (number|null)[]}
