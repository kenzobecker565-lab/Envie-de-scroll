import { AppHeader } from '../components/AppHeader.tsx'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, ExternalLink, Heart, RotateCcw, Search, Ghost, Trophy, Palette, Sparkles, Gift } from 'lucide-react'
import { getShopItem, SHOP_ITEMS, type ShopCategory, type ShopItem, type Melody } from '@scroll-up/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useAppState } from '../state/AppState.tsx'
import { suppressAmbient } from '../lib/ambient.ts'
import { openExternal } from '../telegram/webApp.ts'

const DAVY_PARTITION = 'https://www.musicnotes.com/sheetmusic/pirates-of-the-caribbean-dead-mans-chest/davy-jones/MN0095169'
const ART_MASCOTS = new Set(['mascot-beret', 'mascot-pianiste', 'mascot-casque'])
const ALL_SKINS = SHOP_ITEMS.filter(item => item.category === 'mascot')
const SKINS = ALL_SKINS.filter(item => item.available)
const COLLECTIONS = [
  { id: 'sports', title: 'Sports', subtitle: 'Entre sur le terrain', outfits: ['mascot-basket', 'mascot-basketteuse'], Icon: Trophy },
  { id: 'arts', title: 'Arts et musique', subtitle: 'Exprime ta créativité', outfits: ['mascot-beret', 'mascot-danseuse'], Icon: Palette },
  { id: 'olympus', title: 'Dieux de l’Olympe', subtitle: 'Entre dans la légende', outfits: ['mascot-zeus', 'mascot-athena'], Icon: Sparkles },
  { id: 'halloween', title: 'Halloween', subtitle: 'Des costumes à frissonner', outfits: ['mascot-halloween-vampire', 'mascot-halloween-sorciere'], Icon: Ghost },
] as const
const SHOWCASE = [COLLECTIONS[3], COLLECTIONS[0], COLLECTIONS[2], COLLECTIONS[1]]
type CollectionId = typeof COLLECTIONS[number]['id']
type Shelf = 'discover' | 'owned' | 'favorites'
type Gender = 'all' | 'male' | 'female'
const groupOf = (item: ShopItem) => item.mascotGroup ?? (ART_MASCOTS.has(item.id) ? 'arts' : 'sports')
const countOf = (id: CollectionId) => SKINS.filter(item => groupOf(item) === id).length

function Price({ value, size = 24 }: { value: number; size?: number }) {
  return <span className="inline-flex items-center justify-center gap-1.5 font-numbers font-extrabold tabular-nums" aria-label={`${formatNumber(value)} minutons`}><span aria-hidden="true">{formatNumber(value)}</span><BrandMark size={size} /></span>
}

function CollectionArt({ outfits }: { outfits: readonly string[] }) {
  return <div className="skin-collection-art" aria-hidden="true">{outfits.map(id => <MinutonFigure key={id} outfit={id} size={150} animated={false}/>)}</div>
}

function SwipeSurface({ children, onStep, label, className }: { children: ReactNode; onStep: (direction: number) => void; label: string; className: string }) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)
  return <div className={className} role="region" aria-label={label} tabIndex={0}
    onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); onStep(event.key === 'ArrowRight' ? 1 : -1) } }}
    onTouchStart={event => { swiped.current = false; const touch = event.touches[0]; start.current = touch ? { x: touch.clientX, y: touch.clientY } : null }}
    onTouchCancel={() => { start.current = null }}
    onTouchEnd={event => { const touch = event.changedTouches[0], origin = start.current; start.current = null; if (!touch || !origin) return; const dx = touch.clientX - origin.x, dy = touch.clientY - origin.y; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { swiped.current = true; onStep(dx < 0 ? 1 : -1) } }}
    onClickCapture={event => { if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false } }}>
    {children}
  </div>
}

export function ShopScreen({ library = false }: { category?: ShopCategory; library?: boolean }) {
  const { state, dispatch } = useAppState()
  const shop = useShop()
  const [shelf, setShelf] = useState<Shelf>(library ? 'owned' : 'discover')
  const [collection, setCollection] = useState<CollectionId>()
  const [showcaseIndex, setShowcaseIndex] = useState(0)
  const [skinIndex, setSkinIndex] = useState(0)
  const [gender, setGender] = useState<Gender>('all')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [selected, setSelected] = useState<ShopItem>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string>()
  const [codeOpen, setCodeOpen] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string>()
  const favoriteKey = `scroll-up:skin-favorites:${state.me.user.id}`
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { const saved: unknown = JSON.parse(localStorage.getItem(favoriteKey) ?? '[]'); return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string' && ALL_SKINS.some(item => item.id === id)) : [] }
    catch { return [] }
  })
  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(value => value !== id) : [...favorites, id]
    setFavorites(next)
    try { localStorage.setItem(favoriteKey, JSON.stringify(next)) } catch { /* Les favoris restent utilisables pendant la session. */ }
  }
  useEffect(() => {
    let alive = true
    api.shop().then(value => { if (alive) dispatch({ type: 'shop', shop: value }) })
      .catch((caught: Error) => { if (alive) setError(caught.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
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
    try { dispatch({ type: 'shop', shop: await api.claimShopTestCredit() }); setNotice('10 000 Minutons de test sont disponibles. Ta progression reste inchangée.') }
    catch (caught) { setError((caught as Error).message) }
    finally { setBusy(false) }
  }
  const redeemCode = async () => {
    if (busy || !code.trim()) return
    setBusy(true); setCodeError(undefined); setError(undefined)
    try {
      const result = await api.redeemSkinCode(code)
      const item = getShopItem(result.redeemedItemId)
      dispatch({ type: 'shop', shop: result })
      setNotice(`${item?.title ?? 'Ta tenue'} est disponible dans Mes achats.`)
      setCodeOpen(false); setCode(''); changeShelf('owned'); setSelected(item)
    } catch (caught) { setCodeError((caught as Error).message) }
    finally { setBusy(false) }
  }
  const purchase = async () => {
    if (!selected || busy) return
    setBusy(true); setError(undefined)
    try {
      dispatch({ type: 'shop', shop: await api.buyItem(selected.id) })
      setNotice(`${selected.title} rejoint tes achats. Tu peux maintenant porter cette tenue.`)
      // L’aperçu reste ouvert pour proposer de porter immédiatement la nouvelle tenue.
    } catch (caught) { setError((caught as Error).message) }
    finally { setBusy(false) }
  }
  const equip = async (item: ShopItem | null) => {
    if (busy) return
    setBusy(true); setError(undefined)
    try {
      dispatch({ type: 'shop', shop: await api.equipItem('mascot', item?.id ?? null) })
      setNotice(item ? `${item.title} est porté.` : 'Minuton classique est de retour.')
      setSelected(undefined)
    } catch (caught) { setError((caught as Error).message) }
    finally { setBusy(false) }
  }
  const preview = (item: ShopItem) => { setError(undefined); setSelected(item) }
  const changeShelf = (next: Shelf) => { setShelf(next); setCollection(undefined); setGender('all'); setQuery('') }
  const openCollection = (id: CollectionId) => { setSkinIndex(0); setCollection(id); setGender('all'); setQuery(''); setSearchOpen(false) }
  const activeCollection = COLLECTIONS.find(value => value.id === collection)
  const accessibleSkins = ALL_SKINS.filter(item => item.available || shop.owned.includes(item.id))
  const visibleSkins = shelf === 'discover' ? SKINS : accessibleSkins
  const visibleFavorites = favorites.filter(id => accessibleSkins.some(item => item.id === id))
  const items = visibleSkins.filter(item => (!collection || groupOf(item) === collection)
    && (shelf !== 'owned' || shop.owned.includes(item.id))
    && (shelf !== 'favorites' || favorites.includes(item.id))
    && (gender === 'all' || (gender === 'female' ? item.mascotGender === 'female' : item.mascotGender !== 'female'))
    && item.title.toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr')))
  const ownedCount = ALL_SKINS.filter(item => shop.owned.includes(item.id)).length
  const owned = selected ? shop.owned.includes(selected.id) : false
  const active = selected ? shop.equipped.mascot === selected.id : false
  const overview = shelf === 'discover' && !collection && !query && gender === 'all'

  const featuredSkin = getShopItem('mascot-bruno-mars')
  const showcase = SHOWCASE[showcaseIndex] ?? COLLECTIONS[3]
  const stepShowcase = (direction: number) => setShowcaseIndex(value => (value + direction + SHOWCASE.length) % SHOWCASE.length)
  const spotlight = items.length ? items[skinIndex % items.length] : undefined
  const stepSkin = (direction: number) => { if (items.length) setSkinIndex(value => (value + direction + items.length) % items.length) }
  const world = selected ? (groupOf(selected) === 'adventure' ? 'olympus' : groupOf(selected)) : collection ?? showcase.id
  const collectionOwned = activeCollection ? SKINS.filter(item => groupOf(item) === activeCollection.id && shop.owned.includes(item.id)).length : 0

  return <Screen tabs className="studio-shop skin-shop immersive-shop">
    <div className="skin-world" aria-hidden="true">{COLLECTIONS.map(value => <div key={value.id} data-world={value.id} data-active={world === value.id} style={{ backgroundImage: `url('/art/shop-world-${value.id === 'olympus' ? 'adventure' : value.id}.webp')` }}/>)}</div>
    <AppHeader/>
    <div className="studio-page-heading"><div><h1>Boutique</h1><p className="skin-shop-intro">Trouve le Minuton qui te ressemble.</p></div><button type="button" className="studio-icon-button" aria-label="Rechercher dans la boutique" aria-expanded={searchOpen} onClick={() => setSearchOpen(value => !value)}><Search size={18}/></button></div>
    <div className="skin-shop-tabs" aria-label="Parcourir la boutique">{([{id:'discover', label:'Minutons'}, {id:'owned',label:'Mes achats'}, {id:'favorites',label:'Favoris'}] as const).map(tab => <button type="button" key={tab.id} aria-pressed={shelf === tab.id} onClick={() => changeShelf(tab.id)}>{tab.label}{tab.id === 'owned' && ownedCount > 0 && <span>{ownedCount}</span>}{tab.id === 'favorites' && visibleFavorites.length > 0 && <span>{visibleFavorites.length}</span>}</button>)}</div>
    {searchOpen && <label className="skin-shop-search"><Search size={18}/><span className="sr-only">Rechercher une tenue</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher une tenue…" type="search"/></label>}
    <section className="shop-current-outfit" aria-label="Minuton porté actuellement"><MinutonFigure size={52} outfit={shop.equipped.mascot} animated={false}/><div><small>Porté actuellement</small><strong>{getShopItem(shop.equipped.mascot ?? '')?.title ?? 'Minuton classique'}</strong></div>{shop.equipped.mascot ? <button type="button" disabled={busy || loading} className="skin-reset" aria-label="Revenir à Minuton classique" onClick={() => void equip(null)}><RotateCcw size={17}/></button> : <Check size={18} aria-hidden="true"/>}</section>
    {shop.canClaimTestCredit && <Button className="mt-3" variant="secondary" disabled={busy || loading} onClick={() => void claimCredit()}>Recevoir 10 000 Minutons de test</Button>}
    <Button className="mt-3" variant="secondary" disabled={busy || loading} onClick={() => { setCodeError(undefined); setCodeOpen(true) }}><Gift size={18}/>Utiliser un code</Button>
    <Dialog open={codeOpen} onOpenChange={open => { if (!busy) { setCodeOpen(open); setCodeError(undefined) } }}><DialogContent>
      <DialogHeader><DialogTitle>Un cadeau pour ton Minuton</DialogTitle><DialogDescription>Saisis ton code pour recevoir une tenue offerte. Tu la retrouveras dans Mes achats.</DialogDescription></DialogHeader>
      <form className="flex flex-col gap-4" onSubmit={event => { event.preventDefault(); void redeemCode() }}>
        <label htmlFor="skin-code" className="font-bold">Ton code</label>
        <Input id="skin-code" autoFocus autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={64} value={code} onChange={event => { setCode(event.target.value); setCodeError(undefined) }} placeholder="Saisis ton code…" disabled={busy} aria-invalid={Boolean(codeError)} aria-describedby={codeError ? 'skin-code-error' : undefined}/>
        {codeError && <p id="skin-code-error" role="alert">{codeError}</p>}
        <Button type="submit" disabled={busy || !code.trim()}>{busy ? 'Déblocage…' : 'Débloquer ma tenue'}</Button>
      </form>
    </DialogContent></Dialog>
    {notice && <p role="status" className="skin-shop-notice">{notice}</p>}
    {error && !selected && <div role="alert" className="mt-3"><p>{error}</p><Button variant="secondary" size="sm" onClick={() => void refresh()}><RotateCcw/>Réessayer</Button></div>}
    {loading && <p role="status" className="mt-4">Chargement de tes achats…</p>}
    {overview && <>
      {featuredSkin && <section className="skin-spotlight" aria-label="Minuton en vedette">
        <div className="skin-featured-top"><span><Sparkles size={14}/>En vedette</span><small>Édition développement</small></div>
        <div className="skin-spotlight-stage"><MinutonFigure outfit={featuredSkin.id} size={250} animated={false}/></div>
        <h2>{featuredSkin.title}</h2><p>Le groove s’invite chez Minuton.</p>
        <button type="button" className="skin-spotlight-open" onClick={() => preview(featuredSkin)}>{shop.owned.includes(featuredSkin.id) ? 'Voir ma tenue' : 'Découvrir la tenue offerte'}<ChevronRight size={16}/></button>
      </section>}
      <SwipeSurface className="skin-world-carousel" label="Collections à parcourir" onStep={stepShowcase}>
        <section className="skin-featured" data-collection={showcase.id} aria-label="Collection à la une">
          <div className="skin-featured-top"><span><showcase.Icon size={14}/>À explorer</span><small>{countOf(showcase.id)} tenues</small></div>
          <h2 className="skin-showcase-title">{showcase.title}</h2><CollectionArt outfits={showcase.outfits}/>
          <div className="skin-featured-copy"><p>{showcase.subtitle}</p><button type="button" onClick={() => openCollection(showcase.id)}>Voir la collection<ChevronRight size={18}/></button></div>
        </section>
      </SwipeSurface>
      <div className="skin-carousel-controls"><button type="button" aria-label="Collection précédente" onClick={() => stepShowcase(-1)}><ChevronLeft size={20}/></button><div><div className="skin-carousel-dots">{SHOWCASE.map((value,index) => <button type="button" key={value.id} aria-label={`Afficher la collection ${value.title}`} aria-pressed={showcaseIndex === index} onClick={() => setShowcaseIndex(index)}/>)}</div><p aria-live="polite">{showcaseIndex + 1} / {SHOWCASE.length} collections</p></div><button type="button" aria-label="Collection suivante" onClick={() => stepShowcase(1)}><ChevronRight size={20}/></button></div>
      {visibleFavorites.length > 0 && <section className="skin-wishes"><div className="skin-section-title"><h2>Tes envies</h2><button type="button" onClick={() => changeShelf('favorites')}>Voir les favoris<ChevronRight size={14}/></button></div><div>{accessibleSkins.filter(item => favorites.includes(item.id)).slice(0,3).map(item => <button type="button" key={item.id} onClick={() => preview(item)}><MinutonFigure outfit={item.id} size={85} animated={false}/><strong>{item.title.replace('Minuton ', '')}</strong><Price value={item.price} size={16}/></button>)}</div></section>}
      <section className="skin-collections"><div className="skin-section-title"><h2>Explore les collections</h2><span>4 univers</span></div><div className="skin-collections-grid">{COLLECTIONS.map(value => <button type="button" key={value.id} data-collection={value.id} onClick={() => openCollection(value.id)} aria-label={`Explorer la collection ${value.title}`}><CollectionArt outfits={value.outfits}/><div><strong><value.Icon size={15}/>{value.title}</strong><span>{countOf(value.id)} tenues<ChevronRight size={15}/></span></div></button>)}</div></section>
    </>}
    {activeCollection && <><button type="button" className="skin-back" onClick={() => { setCollection(undefined); setQuery(''); setGender('all') }}><ArrowLeft size={16}/>Toutes les collections</button><section className="skin-collection-intro"><h2>{activeCollection.title}</h2><p>{countOf(activeCollection.id)} tenues · {activeCollection.subtitle}</p></section>
      {spotlight && <SwipeSurface className="skin-spotlight" label="Tenues à parcourir" onStep={stepSkin}>
        <div className="skin-spotlight-stage"><MinutonFigure key={spotlight.id} outfit={spotlight.id} size={250} animated={false}/><button type="button" aria-label="Tenue précédente" onClick={() => stepSkin(-1)}><ChevronLeft size={20}/></button><button type="button" aria-label="Tenue suivante" onClick={() => stepSkin(1)}><ChevronRight size={20}/></button></div>
        <h3>{spotlight.title.replace('Minuton ', '')}</h3><Price value={spotlight.price}/><button type="button" className="skin-spotlight-open" onClick={() => preview(spotlight)}>Voir cette tenue<ChevronRight size={16}/></button><p aria-live="polite">{skinIndex % items.length + 1} / {items.length} tenues</p>
      </SwipeSurface>}
      <section className="skin-collection-progress" aria-label="Progression de la collection"><div><strong>Ta collection</strong><span>{collectionOwned} / {countOf(activeCollection.id)} tenues</span></div><progress max={countOf(activeCollection.id)} value={collectionOwned}/></section>
    </>}
    {!overview && <section className="skin-catalogue" aria-label="Catalogue des tenues"><div className="skin-section-title"><h2>{activeCollection ? 'Choisis ta tenue' : shelf === 'owned' ? 'Mes tenues' : shelf === 'favorites' ? 'Mes envies' : 'Toutes les tenues'}</h2><span>{items.length} {items.length === 1 ? 'tenue' : 'tenues'}</span></div>
      {!overview && !activeCollection && <p className="skin-shelf-caption">{shelf === 'owned' ? 'Tes tenues débloquées, prêtes à être portées.' : shelf === 'favorites' ? 'Les tenues que tu as gardées de côté.' : 'Une tenue pour chaque envie.'}</p>}
      <div className="skin-gender-filters" aria-label="Filtrer les tenues">{([{id:'all',label:'Tout'}, {id:'male',label:'Masculins'}, {id:'female',label:'Féminins'}] as const).map(filter => <button type="button" key={filter.id} aria-pressed={gender === filter.id} onClick={() => { setGender(filter.id); setSkinIndex(0) }}>{filter.label}</button>)}</div>
      <div className="studio-shop-grid">{items.map(item => {
        const bought = shop.owned.includes(item.id), equipped = shop.equipped.mascot === item.id
        return <Card key={item.id} padding="none" className="shop-product min-w-0 gap-0 overflow-hidden" data-category="mascot">
          <div className="skin-product-art"><button type="button" onClick={() => preview(item)} aria-label={`Prévisualiser ${item.title}`}><ShopPreview item={item}/></button><button type="button" className="skin-favorite" aria-label={`${favorites.includes(item.id) ? 'Retirer' : 'Ajouter'} ${item.title} ${favorites.includes(item.id) ? 'des' : 'aux'} favoris`} aria-pressed={favorites.includes(item.id)} onClick={() => toggleFavorite(item.id)}><Heart size={18} fill={favorites.includes(item.id) ? 'currentColor' : 'none'}/></button>{equipped ? <span className="shop-worn-badge"><Check size={12}/>Porté actuellement</span> : bought && <span className="skin-owned-badge"><Check size={12}/>{item.redemptionOnly ? 'Débloqué' : 'Acheté'}</span>}</div>
          <div className="shop-product-body"><small>{item.redemptionOnly ? 'Édition privée' : item.available ? COLLECTIONS.find(value => value.id === groupOf(item))?.title : 'Tenue conservée'}</small><h3>{item.title.replace('Minuton ', '')}</h3><div className="shop-product-actions"><span className="shop-product-price">{item.redemptionOnly ? 'Offert' : <Price value={item.price} size={18}/>}</span>{bought ? <Button size="sm" variant="secondary" disabled={busy || loading || equipped} onClick={() => void equip(item)}>{equipped ? 'Porté' : 'Porter'}</Button> : <Button size="sm" variant="secondary" onClick={() => preview(item)} aria-label={`Voir l’aperçu de ${item.title}`}>Voir<ChevronRight size={14}/></Button>}</div></div>
        </Card>
      })}</div>
      {!items.length && <div className="skin-empty"><Heart size={27}/><p>{query ? 'Aucune tenue ne correspond à ta recherche.' : shelf === 'favorites' ? 'Touche le cœur d’une tenue pour la retrouver ici.' : shelf === 'owned' ? 'Tes prochaines tenues débloquées apparaîtront ici.' : 'Aucune tenue avec ces filtres.'}</p><button type="button" onClick={() => { changeShelf('discover'); setSearchOpen(false) }}>Explorer les tenues<ChevronRight size={15}/></button></div>}
    </section>}
    <p className="skin-shop-footnote">Tes achats ne diminuent pas tes niveaux ni tes badges.{shop.bonus > 0 && <span>Crédit de test inclus dans le solde.</span>}</p>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open && !busy) setSelected(undefined) }}><DialogContent className="skin-preview-dialog immersive-preview" data-world={selected ? (groupOf(selected) === 'adventure' ? 'olympus' : groupOf(selected)) : undefined}>
      {selected && <><DialogHeader><DialogTitle>{selected.title}</DialogTitle><DialogDescription>{selected.redemptionOnly ? 'Édition privée · offerte par code' : selected.available ? `Collection ${COLLECTIONS.find(value => value.id === groupOf(selected))?.title}` : 'Ancienne collection · cette tenue reste à toi'}</DialogDescription></DialogHeader><ShopPreview item={selected} detail/><p className="skin-preview-description">{selected.description}</p><button type="button" className="skin-preview-favorite" aria-pressed={favorites.includes(selected.id)} onClick={() => toggleFavorite(selected.id)}><Heart size={17} fill={favorites.includes(selected.id) ? 'currentColor' : 'none'}/>{favorites.includes(selected.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}</button>
        {error && <p role="alert">{error}</p>}
        {owned ? <Button disabled={busy || loading || active} onClick={() => void equip(selected)}>{busy ? 'Activation…' : active ? 'Porté actuellement' : 'Porter cette tenue'}</Button> : <><div className="skin-purchase-info"><span>Achat permanent</span><Price value={selected.price}/></div><p className="skin-purchase-balance">{shop.balance >= selected.price ? <>Solde après l’achat<Price value={shop.balance - selected.price} size={18}/></> : <>Il te manque<Price value={selected.price - shop.balance} size={18}/></>}</p><Button disabled={busy || loading || shop.balance < selected.price} onClick={() => void purchase()} aria-label={`Confirmer l’achat de ${selected.title}`}>{busy ? 'Achat en cours…' : <>Acheter · <Price value={selected.price}/></>}</Button><p className="skin-purchase-caption">Retrouve cette tenue dans Mes achats après l’achat.</p></>}
        <Button variant="ghost" disabled={busy} onClick={() => setSelected(undefined)}>Fermer l’aperçu</Button>
      </>}
    </DialogContent></Dialog>
  </Screen>
}

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
