import { Bell, Settings } from 'lucide-react'
import { Logo, BrandMark } from './Brand.tsx'
import { useShop } from '../lib/shop.ts'
import { useNavigation } from '../state/AppState.tsx'
import { formatNumber } from '../lib/format.ts'
export function AppHeader({ settings, onSettings }: { settings?: boolean; onSettings?: () => void }) {
 const shop=useShop(), {push}=useNavigation()
 return <header className="studio-header"><Logo height={29}/><div className="studio-header-tools"><button type="button" className="studio-wallet" onClick={()=>push({name:'shop'})} aria-label={`Boutique : ${formatNumber(shop.balance)} minutons disponibles`}><BrandMark size={22}/><span>{formatNumber(shop.balance)}</span></button><button type="button" className="studio-icon-button" aria-label={settings?'Mes réglages':'Préférences de rappel'} onClick={onSettings ?? (()=>push({name:'settings'}))}>{settings?<Settings size={19}/>:<Bell size={19}/>}</button></div></header>
}
