import {useEffect,useState} from 'react'
import {deletePhotoDraft,readPhotoDraft,savePhotoDraft} from './photoDraft.ts'
export function usePhotoDraft(userId:string,proposalId?:string){
 const [photo,setPhoto]=useState<Blob>(),[preview,setPreview]=useState(''),[restoring,setRestoring]=useState(Boolean(proposalId)),[error,setError]=useState('')
 useEffect(()=>{let live=true;setRestoring(Boolean(proposalId));setPhoto(undefined);setError('');if(proposalId)void readPhotoDraft(userId,proposalId).then(value=>{if(live)setPhoto(value)}).catch(()=>{/* A new selection remains possible when device storage is unavailable. */}).finally(()=>{if(live)setRestoring(false)});return()=>{live=false}},[userId,proposalId])
 useEffect(()=>{const url=photo?URL.createObjectURL(photo):'';setPreview(url);return()=>{if(url)URL.revokeObjectURL(url)}},[photo])
 const choose=async(value:Blob)=>{setPhoto(value);setError('');if(proposalId)try{await savePhotoDraft(userId,proposalId,value)}catch{setError('Cette photo n’a pas pu être gardée sur ce téléphone. Garde cette page ouverte jusqu’à l’enregistrement.')}}
 const clear=async()=>{if(proposalId)try{await deletePhotoDraft(userId,proposalId)}catch{/* A completed proposal is never restored as an open draft. */}}
 return {photo,preview,restoring,error,choose,clear}
}
