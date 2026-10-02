import { useEffect, useRef, useState } from 'react'
import { ShoppingBag, Check, Play, RotateCcw } from 'lucide-react'
import { getShopItem, SHOP_CATEGORIES, SHOP_CATEGORY_LABELS, SHOP_ITEMS, type ShopCategory, type ShopItem, type Melody } from '@scroll-up/shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Screen } from '../components/Screen.tsx'
import { ShopSymbol } from '../components/ShopArt.tsx'
import { CoinIcon } from '../components/Coins.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { PianoKeyboard } from '../components/PianoKeyboard.tsx'
import { api } from '../api/client.ts'
import { useShop } from '../lib/shop.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { setAmbientEnabled, suppressAmbient } from '../lib/ambient.ts'

export function ShopScreen({ category: initial = 'ambiance', library = false }: { category?: ShopCategory; library?: boolean }) {
  const { dispatch } = useAppState()
  const { push, reset, replace } = useNavigation()
  const shop = useShop()
  const [category, setCategory] = useState(initial)
  const [mine, setMine] = useState(library)
  const [selected, setSelected] = useState<ShopItem>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string>()
  const audio = useRef<HTMLAudioElement | null>(null)
  const releaseAudio = useRef<(() => void) | undefined>(undefined)
  const stopPreview = () => { audio.current?.pause(); audio.current = null; releaseAudio.current?.(); releaseAudio.current = undefined }
  useEffect(() => { let alive = true; api.shop().then((value) => { if (alive) dispatch({ type: 'shop', shop: value }) }).catch((caught: Error) => { if (alive) setError(caught.message) }).finally(() => { if (alive) setLoading(false) }); return () => { alive = false; stopPreview() } }, [dispatch])
  const refresh = async () => { setError(undefined); setLoading(true); try { dispatch({ type: 'shop', shop: await api.shop() }) } catch (caught) { setError((caught as Error).message) } finally { setLoading(false) } }
  const purchase = async () => {
    if (!selected || busy) return
    setBusy(true); setError(undefined)
    try { const next = await api.buyItem(selected.id); dispatch({ type: 'shop', shop: next }); setNotice(`${selected.title} est débloqué !`); setSelected(undefined); stopPreview() } catch (caught) { setError((caught as Error).message) } finally { setBusy(false) }
  }
  const equip = async (item: ShopItem | null) => {
    setBusy(true); setError(undefined)
    try { const next = await api.equipItem(item?.category ?? category, item?.id ?? null); dispatch({ type: 'shop', shop: next }); if (item?.category === 'ambiance') setAmbientEnabled(true); setNotice(item ? `${item.title} est activé.` : 'Le style gratuit est rétabli.') } catch (caught) { setError((caught as Error).message) } finally { setBusy(false) }
  }
  const playPiano = (item: ShopItem) => {
    stopPreview()
    replace({ name: 'shop', category, library: mine })
    push({ name: 'bonusPiano', itemId: item.id })
  }
  const previewAudio = (item: ShopItem) => {
    stopPreview(); if (!item.audio) return
    releaseAudio.current = suppressAmbient('aperçu boutique')
    const player = new Audio(item.audio); audio.current = player; player.volume = 0.4
    player.onended = stopPreview
    player.play().catch(() => { stopPreview(); setError('L’aperçu audio n’a pas pu démarrer.') })
  }
  const items = SHOP_ITEMS.filter((item) => item.category === category && (!mine || shop.owned.includes(item.id)))
  return <Screen tabs>
    <Button variant="ghost" size="sm" onClick={() => reset([{ name: 'home' }, { name: 'progress' }])}>Retour à ma progression</Button>
    <h1 className="mt-3 font-display text-46 font-extrabold tracking-tight text-ink">Boutique</h1>
    <p className="mt-2 text-15 text-ink-soft">Tes moments créatifs deviennent des petits plaisirs à débloquer.</p>
    <Card tone="warm" className="mt-5 flex-row items-center gap-3">
      <span className="shrink-0"><CoinIcon size={40} /></span><div className="min-w-0 flex-1"><p className="font-numbers text-26 font-extrabold">{shop.balance} minutons disponibles</p><p className="text-13">{shop.earned} gagnés · {shop.spent} dépensés</p></div>
    </Card>
    <p className="mt-3 text-13 text-ink-soft">Achats permanents. Tes niveaux et tes récompenses restent basés sur tous les minutons gagnés.</p>
    <div className="mt-5 grid grid-cols-2 gap-2"><Button variant={!mine ? 'default' : 'secondary'} onClick={() => setMine(false)} aria-pressed={!mine}>Catalogue</Button><Button variant={mine ? 'default' : 'secondary'} onClick={() => setMine(true)} aria-pressed={mine}>Mes achats</Button></div>
    <div className="mt-4 flex flex-wrap gap-2" aria-label="Catégories de la boutique">{SHOP_CATEGORIES.map((id) => <Button key={id} size="sm" variant={id === category ? 'default' : 'secondary'} aria-pressed={id === category} onClick={() => { stopPreview(); setCategory(id) }}>{SHOP_CATEGORY_LABELS[id]}</Button>)}</div>
    {notice && <p role="status" className="mt-4 text-14 font-bold">{notice}</p>}
    {error && <div role="alert" className="mt-4 text-14 text-accent-strong"><p>{error}</p>{!selected && <Button variant="secondary" size="sm" onClick={() => void refresh()}><RotateCcw />Réessayer</Button>}</div>}
    {loading && <p role="status" className="mt-4 text-14">Chargement de tes achats…</p>}
    {!loading && category !== 'piano' && shop.equipped[category] && <Button variant="ghost" size="sm" className="mt-3" disabled={busy} onClick={() => void equip(null)}>Revenir au style gratuit</Button>}
    <div className="mt-5 flex flex-col gap-4">
      {items.map((item) => {
        const owned = shop.owned.includes(item.id), active = shop.equipped[item.category] === item.id
        return <Card key={item.id} className="gap-3">
          <ShopPreview item={item} />
          <div><h2 className="font-display text-22 font-extrabold">{item.title}</h2>{item.difficulty && <p className="text-13 font-bold">{item.difficulty}</p>}<p className="mt-1 text-14 text-ink-soft">{item.description}</p></div>
          {item.audio && <Button variant="secondary" size="sm" onClick={() => previewAudio(item)}><Play />Écouter un aperçu</Button>}
          {!item.available ? <p className="text-13 font-bold text-ink-soft">À venir · autorisation nécessaire</p> : owned ? <Button variant="secondary" disabled={busy || active} onClick={() => item.category === 'piano' ? playPiano(item) : void equip(item)}>{active ? <Check /> : item.category === 'piano' ? <Play /> : <Check />}{active ? 'Activé' : item.category === 'piano' ? 'Jouer ce morceau' : 'Activer'}</Button> : <Button disabled={loading || busy || shop.balance < item.price} onClick={() => { stopPreview(); setError(undefined); setSelected(item) }}><ShoppingBag />{item.price} minutons</Button>}
          {item.available && !owned && shop.balance < item.price && <p className="text-13 text-ink-soft">Encore {item.price - shop.balance} minutons pour le débloquer.</p>}
        </Card>
      })}
      {!items.length && <p className="rounded-md border-2 border-dashed border-ink-faint p-4 text-14 text-ink-soft">Aucun achat dans cette catégorie pour le moment.</p>}
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open && !busy) { setSelected(undefined); stopPreview() } }}><DialogContent>{selected && <><DialogHeader><DialogTitle>Débloquer {selected.title} ?</DialogTitle><DialogDescription>Un achat permanent pour {selected.price} minutons. Il te restera {shop.balance - selected.price} minutons disponibles.</DialogDescription></DialogHeader><ShopPreview item={selected} />{error && <p role="alert" className="text-14 text-accent-strong">{error}</p>}<Button disabled={busy} onClick={() => void purchase()}>{busy ? 'Achat en cours…' : `Confirmer · ${selected.price} minutons`}</Button><Button variant="ghost" disabled={busy} onClick={() => setSelected(undefined)}>Annuler</Button></>}</DialogContent></Dialog>
  </Screen>
}

export function ShopPreview({ item }: { item: ShopItem }) {
  return <div className="flex min-h-24 items-center justify-center gap-3 rounded-md border-2 border-outline p-4 text-on-color" style={{ background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})` }} aria-label={`Aperçu : ${item.title}`}>
    {item.category === 'mascot' ? <Mascot mood="wink" size={72} accessory={item.id} /> : item.category === 'palette' ? item.colors.map((color) => <span key={color} className="h-7 w-7 rounded-pill border-2 border-outline" style={{ background: color }} />) : <ShopSymbol item={item} />}
  </div>
}

export function BonusPianoScreen({ itemId }: { itemId: string }) {
  const item = getShopItem(itemId)
  const [melody, setMelody] = useState<Melody>()
  const [error, setError] = useState<string>()
  const [complete, setComplete] = useState(false)
  const load = () => { setError(undefined); api.bonusMelody(itemId).then((data) => setMelody(data.melody)).catch((caught: Error) => setError(caught.message)) }
  useEffect(() => { load(); return suppressAmbient('morceau bonus') }, [itemId])
  return <Screen><h1 className="font-display text-40 font-extrabold tracking-tight">{item?.title ?? 'Morceau bonus'}</h1><p className="mt-2 text-14 text-ink-soft">{item?.difficulty} · Répertoire bonus. Entraîne-toi librement, sans minutons supplémentaires.</p>{error ? <div role="alert" className="mt-5"><p>{error}</p><Button onClick={load}>Réessayer</Button></div> : !melody ? <p className="mt-5" role="status">Chargement du morceau…</p> : <div className="mt-5"><PianoKeyboard melody={melody} onComplete={() => setComplete(true)} />{complete && <p role="status" className="mt-4 text-15 font-bold">Bravo, tu as joué le morceau ! Tu peux le reprendre autant que tu veux.</p>}</div>}</Screen>
}
