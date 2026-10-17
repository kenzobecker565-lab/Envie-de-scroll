/** The chosen support belongs to one account and one open session. */
const key=(userId:string,proposalId:string)=>`scroll-up:support:${userId}:${proposalId}`
export function readSessionSupport(userId:string,proposalId:string|undefined,fallback:boolean){if(!proposalId)return fallback;try{const value=localStorage.getItem(key(userId,proposalId));return value==='outside'?true:value==='inside'?false:fallback}catch{return fallback}}
export function saveSessionSupport(userId:string,proposalId:string,outside:boolean){try{localStorage.setItem(key(userId,proposalId),outside?'outside':'inside')}catch{/* The current session still works without device storage. */}}
export function clearSessionSupport(userId:string,proposalId:string){try{localStorage.removeItem(key(userId,proposalId))}catch{/* no-op */}}
