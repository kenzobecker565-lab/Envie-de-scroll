import { expect, it } from 'vitest'
import { deviceAuthorization } from './device.ts'
it('garde la clé de la même installation et crée une clé propre sur un autre téléphone',()=>{
  const makeStorage=()=>{const map=new Map<string,string>();return {getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v)}}}
  const storage=makeStorage(),fill=(b:Uint8Array<ArrayBuffer>)=>b.fill(13)
  const first=deviceAuthorization(storage,fill)
  expect(first).toMatch(/^device [a-f0-9]{64}$/)
  expect(deviceAuthorization(storage,()=>{throw new Error('Do not regenerate')})).toBe(first)
  expect(deviceAuthorization(makeStorage(),b=>b.fill(42))).not.toBe(first)
})
