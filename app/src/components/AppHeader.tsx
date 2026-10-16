import { ArrowLeft, Settings } from 'lucide-react'
import { Logo, BrandMark } from './Brand.tsx'
import { Mascot } from './Mascot.tsx'
import { useShop } from '../lib/shop.ts'
import { useNavigation } from '../state/AppState.tsx'
import { formatNumber } from '../lib/format.ts'
import './AppHeader.css'
export function AppHeader({ settings, onSettings, onBack, backLabel }: { settings?: boolean; onSettings?: () => void; onBack?:()=>void; backLabel?:string }) {
 const shop=useShop(), {push,route}=useNavigation()
 return <header className="studio-header"><div className="studio-header-brand">{onBack&&<button type="button" className="studio-header-back" onClick={onBack} aria-label={backLabel??'Retour'}><ArrowLeft size={22}/></button>}<Logo height={29}/></div><div className="studio-header-tools"><button type="button" className="studio-wallet" data-tour-target="wallet" onClick={()=>push({name:'shop'})} aria-label={`Boutique : ${formatNumber(shop.balance)} minutons disponibles`}><BrandMark size={22}/><span>{formatNumber(shop.balance)}</span></button><button type="button" className="studio-profile-avatar" data-tour-target="profile" aria-label="Mon profil" onClick={()=>{if(route.name!=='profile')push({name:'profile'})}}><Mascot size={35} animated={false}/></button>{settings&&<button type="button" className="studio-icon-button" data-tour-target="settings" aria-label="Mes réglages" onClick={onSettings??(()=>push({name:'settings'}))}><Settings size={19}/></button>}</div></header>
}
