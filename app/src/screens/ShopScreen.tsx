import { AppHeader } from '../components/AppHeader.tsx'
import { useEffect, useRef, useState } from 'react'
import { Check, ExternalLink, Eye, Play, RotateCcw, Square, Search } from 'lucide-react'
import { getShopItem, SHOP_CATEGORIES, SHOP_CATEGORY_LABELS, SHOP_ITEMS, type ShopCategory, type ShopItem, type Melody } from '@scroll-up/shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Screen } from '../components/Screen.tsx'
import { ShopPreview } from '../components/ShopArt.tsx'
import { MinutonFigure } from '../components/Mascot.tsx'
import { BrandMark } from '../components/Brand.tsx'
import { PianoKeyboard } from '../components/PianoKeyboard.tsx'
import { api } from '../api/client.ts'
import { useShop } from '../lib/shop.ts'
import { formatNumber } from '../lib/format.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { setAmbientEnabled, suppressAmbient } from '../lib/ambient.ts'
import { openExternal } from '../telegram/webApp.ts'

const VISIBLE_CATEGORIES: ShopCategory[] = ['mascot', 'piano', ...SHOP_CATEGORIES.filter(id => !['mascot', 'piano', 'theme', 'cover'].includes(id))]
const ART_MASCOTS = new Set(['mascot-beret', 'mascot-pianiste', 'mascot-casque'])
type OutfitFilter = 'all' | 'sports' | 'arts' | 'adventure' | 'female'

const DAVY_PARTITION = 'https://www.musicnotes.com/sheetmusic/pirates-of-the-caribbean-dead-mans-chest/davy-jones/MN0095169'

/** Le logo Minuton remplace le nom de la monnaie, sans perdre son libellé accessible. */
function Price({ value, size = 24 }: { value: number; size?: number }) {
  return <span className="inline-flex items-center justify-center gap-1.5 font-numbers font-extrabold tabular-nums" aria-label={`${formatNumber(value)} minutons`}><span aria-hidden="true">{formatNumber(value)}</span><BrandMark size={size} /></span>
}

export function ShopScreen({ category: initial = 'mascot', library = false }: { category?: ShopCategory; library?: boolean }) {
  const { dispatch } = useAppState()
  const { push, replace } = useNavigation()
  const shop = useShop()
  const [category, setCategory] = useState<ShopCategory>(VISIBLE_CATEGORIES.includes(initial) ? initial : 'mascot')
  const [query, setQuery] = useState('')
  const [outfitFilter, setOutfitFilter] = useState<OutfitFilter>('all')
  const [mine, setMine] = useState(library)
  const [filters, setFilters] = useState(false)
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
  const claimCredit = async () => {
    if (busy) return
    setBusy(true); setError(undefined)
    try {
      dispatch({ type: 'shop', shop: await api.claimShopTestCredit() })
      setNotice('10 000 Minutons de test sont disponibles pour tes achats. Ta progression reste inchangée.')
    } catch (caught) { setError((caught as Error).message) }
    finally { setBusy(false) }
  }
  const purchase = async () => {
    if (!selected || busy) return
    setBusy(true); setError(undefined)
    try {
      dispatch({ type: 'shop', shop: await api.buyItem(selected.id) })
      setNotice(selected.category === 'theme' ? `${selected.title} est débloqué et activé !` : `${selected.title} est débloqué !`)
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
      if (category === 'mascot') { setOutfitFilter('all'); setQuery('') }
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
  const featured = ['mascot-basketteuse','mascot-judoka-f','mascot-athena','mascot-poney','mascot-judo','mascot-basket','mascot-beret','mascot-pianiste']
  const items = [...SHOP_ITEMS].sort((a,b) => (featured.includes(a.id)?featured.indexOf(a.id):99)-(featured.includes(b.id)?featured.indexOf(b.id):99)).filter((item) => item.category === category && (!mine || shop.owned.includes(item.id)) && (category !== 'mascot' || outfitFilter === 'all' || (outfitFilter === 'female' ? item.mascotGender === 'female' : (item.mascotGroup ?? (ART_MASCOTS.has(item.id) ? 'arts' : 'sports')) === outfitFilter)) && `${item.title} ${item.composer ?? ''} ${item.difficulty ?? ''}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')))
  const owned = selected ? shop.owned.includes(selected.id) : false
  const active = selected ? shop.equipped[selected.category] === selected.id : false

  return <Screen tabs className="studio-shop">
    <AppHeader/><div className="studio-page-heading"><h1>Boutique</h1><button type="button" className="studio-icon-button" aria-label="Rechercher dans la boutique" aria-expanded={filters} onClick={()=>setFilters(value=>!value)}><Search size={18}/></button></div>
    <div className="studio-shop-tabs" aria-label="Catégories de la boutique">{VISIBLE_CATEGORIES.map(id=><button type="button" key={id} aria-pressed={id===category} onClick={()=>{stopPreview();setQuery('');setCategory(id)}}>{SHOP_CATEGORY_LABELS[id]}</button>)}</div>
    {category === 'mascot' && <><section className="shop-current-outfit" aria-label="Minuton porté actuellement"><MinutonFigure size={58} outfit={shop.equipped.mascot} animated={false}/><div><small>Porté actuellement</small><strong>{getShopItem(shop.equipped.mascot ?? '')?.title ?? 'Minuton classique'}</strong></div><Check size={19} aria-hidden="true"/></section><div className="shop-outfit-filters" aria-label="Filtrer les tenues de Minuton">{([{id:'all',label:'Toutes les tenues'},{id:'female',label:'Féminins'},{id:'sports',label:'Sports'},{id:'arts',label:'Arts et musique'},{id:'adventure',label:'Univers'}] as const).map(filter=><button type="button" key={filter.id} aria-pressed={outfitFilter===filter.id} onClick={()=>setOutfitFilter(filter.id)}>{filter.label}</button>)}</div></>}
    <div className="studio-shop-library"><button type="button" aria-pressed={!mine} onClick={()=>setMine(false)}>À découvrir</button><button type="button" aria-pressed={mine} onClick={()=>setMine(true)}>Mes achats</button></div>
    {filters&&<label className="mt-3 flex items-center gap-2 rounded-md border border-outline bg-surface-200 px-3 py-2"><Search size={18}/><span className="sr-only">Rechercher dans cette collection</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Rechercher…" className="min-w-0 flex-1 bg-transparent text-14 outline-none" type="search"/></label>}
    {shop.canClaimTestCredit && <Button className="mt-4" variant="secondary" disabled={busy || loading} onClick={() => void claimCredit()}>Recevoir 10 000 Minutons de test</Button>}
    {shop.bonus > 0 && <p className="mt-2 text-12 text-ink-soft">Crédit de test inclus dans le solde · sans effet sur ta progression.</p>}
    {notice && <p role="status" className="mt-3 rounded-sm bg-good/15 p-3 text-14 font-bold">{notice}</p>}
    {error && !selected && <div role="alert" className="mt-3 text-14 text-accent-strong"><p>{error}</p><Button variant="secondary" size="sm" onClick={() => void refresh()}><RotateCcw />Réessayer</Button></div>}
    {loading && <p role="status" className="mt-4 text-14">Chargement de tes achats…</p>}
    {!loading && category !== 'piano' && shop.equipped[category] && <Button variant="ghost" size="sm" className="mt-3" disabled={busy} onClick={() => void equip(null)}>Revenir au style gratuit</Button>}

    <div className="studio-shop-grid">
      {items.map((item) => {
        const bought = shop.owned.includes(item.id), equipped = shop.equipped[item.category] === item.id
        return <Card key={item.id} padding="none" className="shop-product min-w-0 gap-0 overflow-hidden" data-category={item.category}>
          <button type="button" onClick={() => preview(item)} aria-label={`Prévisualiser ${item.title}`} className="relative block w-full text-left focus-visible:outline-4 focus-visible:outline-accent">
            <ShopPreview item={item} />
            {equipped && item.category === 'mascot' ? <span className="shop-worn-badge"><Check size={12} aria-hidden="true"/>Porté actuellement</span> : bought && <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-pill border-2 border-outline bg-good text-on-color"><Check size={15} aria-hidden="true" /><span className="sr-only">Acheté</span></span>}
          </button>
          <div className="shop-product-body">

            <h3 className="font-display text-17 leading-tight font-extrabold">{item.title.replace('Minuton ', '')}</h3>
            {item.composer && <p className="text-12 font-bold text-ink-soft">{item.composer}</p>}
            {item.edition && <p className="text-11 text-ink-soft">{item.edition}</p>}
            {item.difficulty && <p className="text-11 font-semibold text-ink-soft">{item.id === 'piano-davy-jones' ? 'Partition externe' : item.difficulty}</p>}
            <button type="button" onClick={() => preview(item)} className="shop-preview-link" aria-label={`Voir l’aperçu de ${item.title}`}><Eye size={15} aria-hidden="true" />Voir l’aperçu</button>
            {item.audio && <button type="button" onClick={() => previewAudio(item)} className="flex min-h-8 items-center gap-1.5 text-12 font-bold text-ink-soft" aria-label={`Écouter l’aperçu de ${item.title}`}>{playing === item.id ? <Square size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}{playing === item.id ? 'Arrêter' : 'Écouter'}</button>}
            <div className="shop-product-actions"><span className="shop-product-price"><Price value={item.price} size={18}/></span>
              {item.id === 'piano-davy-jones' ? <Button size="sm" variant="secondary" className="w-full px-2 text-12" onClick={() => playPiano(item)}><PianoIcon />Clavier libre</Button>
                : bought ? <Button size="sm" variant="secondary" className="w-full px-2 text-12" disabled={busy || equipped} onClick={() => item.category === 'piano' ? playPiano(item) : void equip(item)}>{equipped ? <Check /> : item.category === 'piano' ? <Play /> : <Check />}{equipped ? item.category === 'mascot' ? 'Porté' : 'Activé' : item.category === 'piano' ? 'Jouer' : item.category === 'mascot' ? 'Porter' : 'Activer'}</Button>
                : <Button size="sm" className="w-full px-2 text-17" disabled={loading || busy} onClick={() => preview(item)} aria-label={`Acheter ${item.title} pour ${item.price} minutons`}>Acheter</Button>}
            </div>
          </div>
        </Card>
      })}
    </div>
    {!items.length && <p className="mt-4 rounded-md border-2 border-dashed border-ink-faint p-4 text-14 text-ink-soft">{query ? 'Aucun résultat. Essaie un autre nom ou efface la recherche.' : 'Aucun article ici pour le moment. Essaie un autre filtre ou explore le catalogue.'}</p>}
    <p className="mt-5 text-center text-12 text-ink-soft">Tes achats ne diminuent pas tes niveaux ni tes badges.</p>

    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open && !busy) { setSelected(undefined); stopPreview() } }}>
      <DialogContent>
        {selected && <>
          <DialogHeader><DialogTitle>{selected.title}</DialogTitle><DialogDescription>{selected.description}{selected.edition && ` ${selected.edition}.`}</DialogDescription></DialogHeader>
          <ShopPreview item={selected} detail />
          {selected.audio && <Button variant="secondary" size="sm" onClick={() => previewAudio(selected)}>{playing === selected.id ? <Square /> : <Play />}{playing === selected.id ? 'Arrêter l’aperçu' : 'Écouter l’aperçu'}</Button>}
          {error && <p role="alert" className="text-14 text-accent-strong">{error}</p>}
          {selected.id === 'piano-davy-jones' ? <><Button variant="secondary" className="whitespace-normal" onClick={() => openExternal(DAVY_PARTITION)}><ExternalLink />Partition officielle</Button><Button onClick={() => playPiano(selected)}>Ouvrir le clavier libre</Button><p className="text-12 text-ink-soft">La partition s’ouvre chez Musicnotes et peut nécessiter un achat séparé. Sans débit de minutons. Le guidage intégré attend une autorisation.</p></>
            : owned ? <Button disabled={busy || active} onClick={() => selected.category === 'piano' ? playPiano(selected) : void equip(selected)}>{active ? selected.category === 'mascot' ? 'Porté actuellement' : 'Activé' : selected.category === 'piano' ? 'Jouer ce morceau' : selected.category === 'mascot' ? 'Porter cette tenue' : 'Activer cet objet'}</Button>
            : <>
              <div className="flex items-center justify-between gap-2 rounded-sm bg-surface-100 p-3"><span className="text-13 font-bold">Achat permanent</span><span className="text-22"><Price value={selected.price} size={28} /></span></div>
              {shop.balance >= selected.price ? <p className="flex items-center justify-between gap-2 text-13 text-ink-soft">Solde après l’achat <Price value={shop.balance - selected.price} size={20} /></p> : <p className="flex items-center justify-between gap-2 text-13 text-ink-soft">Il te manque <Price value={selected.price - shop.balance} size={20} /></p>}
              <Button disabled={busy || loading || shop.balance < selected.price} onClick={() => void purchase()} aria-label={`Confirmer l’achat de ${selected.title}`}>{busy ? 'Achat en cours…' : <>{selected.category === 'theme' ? 'Débloquer et activer' : 'Débloquer'} <Price value={selected.price} /></>}</Button>
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
    {item?.edition && <p className="mt-2 text-13 text-ink-soft">{item.composer} · {item.edition}</p>}
    {freeDavy ? <><p className="mt-2 text-14 text-ink-soft">Clavier libre pour t’entraîner avec ta partition. Les notes du morceau ne sont pas intégrées ici.</p><Button variant="secondary" className="mt-4 whitespace-normal" onClick={() => openExternal(DAVY_PARTITION)}><ExternalLink />Ouvrir la partition officielle</Button><div className="mt-5"><PianoKeyboard /></div></>
      : <><p className="mt-2 text-14 text-ink-soft">{item?.difficulty} · Répertoire bonus. Entraîne-toi librement, sans minutons supplémentaires.</p>{error ? <div role="alert" className="mt-5"><p>{error}</p><Button onClick={retry}>Réessayer</Button></div> : !melody ? <p className="mt-5" role="status">Chargement du morceau…</p> : <div className="mt-5"><PianoKeyboard melody={melody} onComplete={() => setComplete(true)} />{complete && <p role="status" className="mt-4 text-15 font-bold">{item?.edition ? 'Bravo, tu as joué cet extrait !' : 'Bravo, tu as joué le morceau !'} Tu peux le reprendre autant que tu veux.</p>}</div>}</>}
  </Screen>
}
