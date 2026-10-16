import {afterEach,describe,expect,it,vi} from 'vitest'
import {discoverySeen,rememberDiscovery,guideForRoute} from './discoveryGuides.ts'
afterEach(()=>vi.unstubAllGlobals())
describe('découverte progressive',()=>{
 it('ne coupe ni une création, ni sa validation, ni l’ouverture d’une création dans la galerie',()=>{
  for(const name of ['home','signal','ideas','activity','creativeSession','done'] as const)expect(guideForRoute({name})).toBeUndefined()
  expect(guideForRoute({name:'gallery',passion:'ecriture',focus:'creation'})).toBeUndefined()
  expect(guideForRoute({name:'atelier',focus:'creation'})).toBeUndefined()
 })
 it('distingue les fonctions plutôt que de rejouer un guide pour chaque passion',()=>{
  expect(guideForRoute({name:'passionSpace',passion:'dessin',mode:'practice'})).toBe('practice')
  expect(guideForRoute({name:'passionSpace',passion:'piano',mode:'practice'})).toBe('practice')
  expect(guideForRoute({name:'passionSpace',passion:'dessin',mode:'learn'})).toBe('learning')
  expect(guideForRoute({name:'gallery',passion:'ecriture'})).toBe('notebook')
 })
 it('garde un passage hors réseau par compte et par fonction',()=>{
  const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key),setItem:(key:string,v:string)=>values.set(key,v)})
  rememberDiscovery('1','explorer')
  expect(discoverySeen({id:'1'},'explorer')).toBe(true)
  expect(discoverySeen({id:'2'},'explorer')).toBe(false)
  expect(discoverySeen({id:'1'},'gallery')).toBe(false)
 })
 it('respecte les guides vus sur un autre appareil même sans stockage local',()=>{
  vi.stubGlobal('localStorage',{getItem:()=>{throw Error('unavailable')},setItem:()=>{throw Error('unavailable')}})
  expect(()=>rememberDiscovery('1','gallery')).not.toThrow()
  expect(discoverySeen({id:'1',completedGuides:['gallery']},'gallery')).toBe(true)
  expect(discoverySeen({id:'1',completedGuides:['gallery']},'shop')).toBe(false)
 })
})
