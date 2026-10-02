import { useEffect, useRef, useState } from 'react'
import { Check, ExternalLink, Eye, Play, RotateCcw, Square } from 'lucide-react'
import { getShopItem, SHOP_CATEGORIES, SHOP_CATEGORY_LABELS, SHOP_ITEMS, type ShopCategory, type ShopItem, type Melody } from '@scroll-up/shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Screen } from '../components/Screen.tsx'
import { ShopPreview } from '../components/ShopArt.tsx'
import { BrandMark } from '../components/Brand.tsx'
import { PianoKeyboard } from '../components/PianoKeyboard.tsx'
import { api } from '../api/client.ts'
import { useShop } from '../lib/shop.ts'
import { formatNumber } from '../lib/format.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { setAmbientEnabled, suppressAmbient } from '../lib/ambient.ts'
import { openExternal } from '../telegram/webApp.ts'

const DAVY_PARTITION = 'https://www.musicnotes.com/sheetmusic/pirates-of-the-caribbean-dead-mans-chest/davy-jones/MN0095169'

/** Le logo Minuton remplace le nom de la monnaie, sans perdre son libellé accessible. */
function Price({ value, size = 24 }: { value: number; size?: number }) {
  return <span className="inline-flex items-center justify-center gap-1.5 font-numbers font-extrabold tabular-nums" aria-label={`${formatNumber(value)} minutons`}><span aria-hidden="true">{formatNumber(value)}</span><BrandMark size={size} /></span>
}

export function ShopScreen({ category: initial = 'ambiance', library = false }: { category?: ShopCategory; library?: boolean }) {
  const { dispatch } = useAppState()
  const { push, replace } = useNavigation()
  const shop = useShop()
  const [category, setCategory] = useState(initial)
  const [mine, setMine] = useState(library)
  const [selected, setSelected] = useState<ShopItem>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string>()
  const [playing, setPlaying] = useState<string>()
  const audio = useRef<HTMLAudioElement | null>(null)
  const releaseAudio = useRef<(() => void) | undefined>(undefined)

  const stopPreview = () => {
    audio.current?.pause()
    audio.current = null
    releaseAudio.current?.()
    releaseAudio.current = undefined
    setPlaying(undefined)
  }
  useEffect(() => {
    let alive = true
    api.shop().then((value) => { if (alive) dispatch({ type: 'shop', shop: value }) })
      .catch((caught: Error) => { if (alive) setError(caught.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false; audio.current?.pause(); releaseAudio.current?.() }
  }, [dispatch])

  const refresh = async () => {
    setError(undefined); setLoading(true)
    try { dispatch({ type: 'shop', shop: await api.shop() }) }
    catch (caught) { setError((caught as Error).message) }
    finally { setLoading(false) }
  }
  const purchase = async () => {
    if (!selected || busy) return
    setBusy(true); setError(undefined)
    try {
      dispatch({ type: 'shop', shop: await api.buyItem(selected.id) })
      setNotice(`${selected.title} est débloqué !`)
      setSelected(undefined); stopPreview()
    } catch (caught) { setError((caught as Error).message) }
    finally { setBusy(false) }
  }
  const equip = async (item: ShopItem | null) => {
    setBusy(true); setError(undefined)
    try {
      dispatch({ type: 'shop', shop: await api.equipItem(item?.category ?? category, item?.id ?? null) })
      if (item?.category === 'ambiance') setAmbientEnabled(true)
      setNotice(item ? `${item.title} est activé.` : 'Le style gratuit est rétabli.')
      setSelected(undefined); stopPreview()
    } catch (caught) { setError((caught as Error).message) }
    finally { setBusy(false) }
  }
  const playPiano = (item: ShopItem) => {
    stopPreview()
    replace({ name: 'shop', category, library: mine })
    push({ name: 'bonusPiano', itemId: item.id })
  }
  const previewAudio = (item: ShopItem) => {
    if (playing === item.id) { stopPreview(); return }
    stopPreview()
    if (!item.audio) return
    releaseAudio.current = suppressAmbient('aperçu boutique')
    const player = new Audio(item.audio)
    audio.current = player; player.volume = 0.4; setPlaying(item.id)
    player.onended = stopPreview
    player.play().catch(() => { stopPreview(); setError('L’aperçu audio n’a pas pu démarrer.') })
  }
  const preview = (item: ShopItem) => { stopPreview(); setError(undefined); setSelected(item) }
  const items = SHOP_ITEMS.filter((item) => item.category === category && (!mine || shop.owned.includes(item.id)))
  const owned = selected ? shop.owned.includes(selected.id) : false
  const active = selected ? shop.equipped[selected.category] === selected.id : false

  return <Screen tabs>
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-12 font-bold tracking-wider text-ink-soft uppercase">Fais-toi plaisir</p><h1 className="font-display text-40 font-extrabold tracking-tight text-ink">Boutique</h1></div>
      <span className="rounded-pill border-[2.5px] border-outline bg-warm px-3 py-2 text-22 text-on-color shadow-chip" aria-label={`Solde disponible : ${shop.balance} minutons`}><Price value={shop.balance} size={30} /></span>
    </header>
    <p className="mt-3 text-14 text-ink-soft">Des petits plaisirs pour ta pause créative. À toi pour toujours.</p>
    <div className="mt-5 grid grid-cols-2 gap-2">
      <Button size="sm" variant={!mine ? 'default' : 'secondary'} onClick={() => setMine(false)} aria-pressed={!mine}>À découvrir</Button>
      <Button size="sm" variant={mine ? 'default' : 'secondary'} onClick={() => setMine(true)} aria-pressed={mine}>Mes achats</Button>
    </div>
    <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Catégories de la boutique">
      {SHOP_CATEGORIES.map((id) => <Button key={id} size="sm" variant={id === category ? 'default' : 'ghost'} aria-pressed={id === category} onClick={() => { stopPreview(); setCategory(id) }}>{SHOP_CATEGORY_LABELS[id]}</Button>)}
    </div>
    <div className="mt-4 flex items-center justify-between gap-2">
      <h2 className="font-display text-22 font-extrabold">{SHOP_CATEGORY_LABELS[category]}</h2>
      <span className="text-12 font-bold text-ink-soft">{items.length} {items.length > 1 ? 'articles' : 'article'}</span>
    </div>
    {notice && <p role="status" className="mt-3 rounded-sm bg-good/15 p-3 text-14 font-bold">{notice}</p>}
    {error && !selected && <div role="alert" className="mt-3 text-14 text-accent-strong"><p>{error}</p><Button variant="secondary" size="sm" onClick={() => void refresh()}><RotateCcw />Réessayer</Button></div>}
    {loading && <p role="status" className="mt-4 text-14">Chargement de tes achats…</p>}
    {!loading && category !== 'piano' && shop.equipped[category] && <Button variant="ghost" size="sm" className="mt-3" disabled={busy} onClick={() => void equip(null)}>Revenir au style gratuit</Button>}

    <div className="mt-4 grid grid-cols-1 min-[360px]:grid-cols-2 items-stretch gap-3">
      {items.map((item) => {
        const bought = shop.owned.includes(item.id), equipped = shop.equipped[item.category] === item.id
        return <Card key={item.id} padding="none" className="min-w-0 gap-0">
          <button type="button" onClick={() => preview(item)} aria-label={`Prévisualiser ${item.title}`} className="relative block w-full text-left focus-visible:outline-4 focus-visible:outline-accent">
            <ShopPreview item={item} />
            {bought && <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-pill border-2 border-outline bg-good text-on-color"><Check size={15} aria-hidden="true" /><span className="sr-only">Acheté</span></span>}
          </button>
          <div className="flex flex-1 flex-col gap-2 p-3">
            <h3 className="font-display text-17 leading-tight font-extrabold">{item.title}</h3>
            {item.difficulty && <p className="text-11 font-semibold text-ink-soft">{item.id === 'piano-davy-jones' ? 'Partition externe' : item.difficulty}</p>}
            <button type="button" onClick={() => preview(item)} className="flex min-h-8 items-center gap-1.5 text-12 font-bold text-ink-soft" aria-label={`Voir l’aperçu de ${item.title}`}><Eye size={15} aria-hidden="true" />Voir l’aperçu</button>
            {item.audio && <button type="button" onClick={() => previewAudio(item)} className="flex min-h-8 items-center gap-1.5 text-12 font-bold text-ink-soft" aria-label={`Écouter l’aperçu de ${item.title}`}>{playing === item.id ? <Square size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}{playing === item.id ? 'Arrêter' : 'Écouter'}</button>}
            <div className="mt-auto pt-1">
              {item.id === 'piano-davy-jones' ? <Button size="sm" variant="secondary" className="w-full px-2 text-12" onClick={() => playPiano(item)}><PianoIcon />Clavier libre</Button>
                : bought ? <Button size="sm" variant="secondary" className="w-full px-2 text-12" disabled={busy || equipped} onClick={() => item.category === 'piano' ? playPiano(item) : void equip(item)}>{equipped ? <Check /> : item.category === 'piano' ? <Play /> : <Check />}{equipped ? 'Activé' : item.category === 'piano' ? 'Jouer' : 'Activer'}</Button>
                : <Button size="sm" className="w-full px-2 text-17" disabled={loading || busy} onClick={() => preview(item)} aria-label={`Acheter ${item.title} pour ${item.price} minutons`}><Price value={item.price} /></Button>}
            </div>
          </div>
        </Card>
      })}
    </div>
    {!items.length && <p className="mt-4 rounded-md border-2 border-dashed border-ink-faint p-4 text-14 text-ink-soft">Aucun achat dans cette catégorie. Explore le catalogue pour trouver ton prochain plaisir.</p>}
    <p className="mt-5 text-center text-12 text-ink-soft">Tes achats ne diminuent pas tes niveaux ni tes badges.</p>

    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open && !busy) { setSelected(undefined); stopPreview() } }}>
      <DialogContent>
        {selected && <>
          <DialogHeader><DialogTitle>{selected.title}</DialogTitle><DialogDescription>{selected.description}</DialogDescription></DialogHeader>
          <ShopPreview item={selected} detail />
          {selected.category === 'cover' && <p className="text-13 text-ink-soft">Voici son rendu sur une carte de projet sans photo. Les projets avec une photo conservent leur image.</p>}
          {selected.audio && <Button variant="secondary" size="sm" onClick={() => previewAudio(selected)}>{playing === selected.id ? <Square /> : <Play />}{playing === selected.id ? 'Arrêter l’aperçu' : 'Écouter l’aperçu'}</Button>}
          {error && <p role="alert" className="text-14 text-accent-strong">{error}</p>}
          {selected.id === 'piano-davy-jones' ? <><Button variant="secondary" className="whitespace-normal" onClick={() => openExternal(DAVY_PARTITION)}><ExternalLink />Partition officielle</Button><Button onClick={() => playPiano(selected)}>Ouvrir le clavier libre</Button><p className="text-12 text-ink-soft">La partition s’ouvre chez Musicnotes et peut nécessiter un achat séparé. Sans débit de minutons. Le guidage intégré attend une autorisation.</p></>
            : owned ? <Button disabled={busy || active} onClick={() => selected.category === 'piano' ? playPiano(selected) : void equip(selected)}>{active ? 'Activé' : selected.category === 'piano' ? 'Jouer ce morceau' : 'Activer cet objet'}</Button>
            : <>
              <div className="flex items-center justify-between gap-2 rounded-sm bg-surface-100 p-3"><span className="text-13 font-bold">Achat permanent</span><span className="text-22"><Price value={selected.price} size={28} /></span></div>
              {shop.balance >= selected.price ? <p className="flex items-center justify-between gap-2 text-13 text-ink-soft">Solde après l’achat <Price value={shop.balance - selected.price} size={20} /></p> : <p className="flex items-center justify-between gap-2 text-13 text-ink-soft">Il te manque <Price value={selected.price - shop.balance} size={20} /></p>}
              <Button disabled={busy || loading || shop.balance < selected.price} onClick={() => void purchase()} aria-label={`Confirmer l’achat de ${selected.title}`}>{busy ? 'Achat en cours…' : <>Débloquer <Price value={selected.price} /></>}</Button>
            </>}
          <Button variant="ghost" disabled={busy} onClick={() => { setSelected(undefined); stopPreview() }}>Fermer l’aperçu</Button>
        </>}
      </DialogContent>
    </Dialog>
  </Screen>
}

function PianoIcon() { return <Play aria-hidden="true" /> }

export function BonusPianoScreen({ itemId }: { itemId: string }) {
  const item = getShopItem(itemId)
  const freeDavy = itemId === 'piano-davy-jones'
  const [melody, setMelody] = useState<Melody>()
  const [error, setError] = useState<string>()
  const [complete, setComplete] = useState(false)
  useEffect(() => {
    let alive = true
    if (!freeDavy) api.bonusMelody(itemId).then((data) => { if (alive) setMelody(data.melody) }).catch((caught: Error) => { if (alive) setError(caught.message) })
    const release = suppressAmbient('morceau bonus')
    return () => { alive = false; release() }
  }, [itemId, freeDavy])
  const retry = () => { setError(undefined); api.bonusMelody(itemId).then((data) => setMelody(data.melody)).catch((caught: Error) => setError(caught.message)) }
  return <Screen>
    <h1 className="font-display text-40 font-extrabold tracking-tight">{item?.title ?? 'Morceau bonus'}</h1>
    {freeDavy ? <><p className="mt-2 text-14 text-ink-soft">Clavier libre pour t’entraîner avec ta partition. Les notes du morceau ne sont pas intégrées ici.</p><Button variant="secondary" className="mt-4 whitespace-normal" onClick={() => openExternal(DAVY_PARTITION)}><ExternalLink />Ouvrir la partition officielle</Button><div className="mt-5"><PianoKeyboard /></div></>
      : <><p className="mt-2 text-14 text-ink-soft">{item?.difficulty} · Répertoire bonus. Entraîne-toi librement, sans minutons supplémentaires.</p>{error ? <div role="alert" className="mt-5"><p>{error}</p><Button onClick={retry}>Réessayer</Button></div> : !melody ? <p className="mt-5" role="status">Chargement du morceau…</p> : <div className="mt-5"><PianoKeyboard melody={melody} onComplete={() => setComplete(true)} />{complete && <p role="status" className="mt-4 text-15 font-bold">Bravo, tu as joué le morceau ! Tu peux le reprendre autant que tu veux.</p>}</div>}</>}
  </Screen>
}
