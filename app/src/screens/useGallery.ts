import {useCallback,useEffect,useRef,useState} from 'react'
import type {CompletionDTO,PassionId} from '@scroll-up/shared'
import {api} from '../api/client.ts'
import {mergeCreations} from '../lib/gallery.ts'
export function useGallery(passion?:PassionId){
 const [items,setItems]=useState<CompletionDTO[]>([]),[cursor,setCursor]=useState<string|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('')
 const version=useRef(0),busy=useRef(false)
 const load=useCallback(async(from?:string)=>{
  if(busy.current)return;busy.current=true;const generation=version.current;setLoading(true);setError('')
  try{const page=await api.completions(from,passion,50);if(generation===version.current){setItems(old=>from?mergeCreations(old,page.items):page.items);setCursor(page.nextCursor)}}catch(e){if(generation===version.current)setError((e as Error).message)}finally{if(generation===version.current){busy.current=false;setLoading(false)}}
 },[passion])
 useEffect(()=>{version.current++;busy.current=false;setItems([]);setCursor(null);void load();return()=>{version.current++;busy.current=false}},[load])
 const update=(item:CompletionDTO)=>setItems(old=>old.map(value=>value.id===item.id?item:value))
 return {items,cursor,loading,error,load,update}
}
