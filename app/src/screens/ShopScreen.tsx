import { AppHeader } from '../components/AppHeader.tsx'
import { useEffect, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, ExternalLink, Heart, RotateCcw, Search, Ghost, Trophy, Palette, Sparkles } from 'lucide-react'
import { getShopItem, SHOP_ITEMS, type ShopCategory, type ShopItem, type Melody } from '@scroll-up/shared'
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
import { useAppState } from '../state/AppState.tsx'
import { suppressAmbient } from '../lib/ambient.ts'
import { openExternal } from '../telegram/webApp.ts'

const DAVY_PARTITION = 'https://www.musicnotes.com/sheetmusic/pirates-of-the-caribbean-dead-mans-chest/davy-jones/MN0095169'
const ART_MASCOTS = new Set(['mascot-beret', 'mascot-pianiste', 'mascot-casque'])
const SKINS = SHOP_ITEMS.filter(item => item.category === 'mascot')
const COLLECTIONS = [
  { id: 'sports', title: 'Sports', subtitle: 'Entre sur le terrain', outfits: ['mascot-basket', 'mascot-basketteuse'], Icon: Trophy },
  { id: 'arts', title: 'Arts et musique', subtitle: 'Exprime ta créativité', outfits: ['mascot-beret', 'mascot-danseuse'], Icon: Palette },
  { id: 'adventure', title: 'Univers', subtitle: 'Éveille ton imagination', outfits: ['mascot-athena', 'mascot-astronaute-f'], Icon: Sparkles },
  { id: 'halloween', title: 'Halloween', subtitle: 'Des costumes à frissonner', outfits: ['mascot-halloween-vampire', 'mascot-halloween-sorciere'], Icon: Ghost },
] as const
const FEATURED = COLLECTIONS[3]
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

export function ShopScreen({ library = false }: { category?: ShopCategory; library?: boolean }) {
  const { state, dispatch } = useAppState()
  const shop = useShop()
  const [shelf, setShelf] = useState<Shelf>(library ? 'owned' : 'discover')
  const [collection, setCollection] = useState<CollectionId>()
  const [gender, setGender] = useState<Gender>('all')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [selected, setSelected] = useState<ShopItem>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string>()
  const favoriteKey = `scroll-up:skin-favorites:${state.me.user.id}`
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { const saved: unknown = JSON.parse(localStorage.getItem(favoriteKey) ?? '[]'); return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string' && SKINS.some(item => item.id === id)) : [] }
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
  const openCollection = (id: CollectionId) => { setCollection(id); setGender('all'); setQuery(''); setSearchOpen(false) }
  const activeCollection = COLLECTIONS.find(value => value.id === collection)
  const items = SKINS.filter(item => (!collection || groupOf(item) === collection)
    && (shelf !== 'owned' || shop.owned.includes(item.id))
    && (shelf !== 'favorites' || favorites.includes(item.id))
    && (gender === 'all' || (gender === 'female' ? item.mascotGender === 'female' : item.mascotGender !== 'female'))
    && item.title.toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr')))
  const ownedCount = SKINS.filter(item => shop.owned.includes(item.id)).length
  const owned = selected ? shop.owned.includes(selected.id) : false
  const active = selected ? shop.equipped.mascot === selected.id : false
  const overview = shelf === 'discover' && !collection && !query && gender === 'all'

  return <Screen tabs className="studio-shop skin-shop">
    <AppHeader/>
    <div className="studio-page-heading"><div><h1>Boutique</h1><p className="skin-shop-intro">Trouve le Minuton qui te ressemble.</p></div><button type="button" className="studio-icon-button" aria-label="Rechercher dans la boutique" aria-expanded={searchOpen} onClick={() => setSearchOpen(value => !value)}><Search size={18}/></button></div>
    <div className="skin-shop-tabs" aria-label="Parcourir la boutique">{([{id:'discover', label:'Minutons'}, {id:'owned',label:'Mes achats'}, {id:'favorites',label:'Favoris'}] as const).map(tab => <button type="button" key={tab.id} aria-pressed={shelf === tab.id} onClick={() => changeShelf(tab.id)}>{tab.label}{tab.id === 'owned' && ownedCount > 0 && <span>{ownedCount}</span>}{tab.id === 'favorites' && favorites.length > 0 && <span>{favorites.length}</span>}</button>)}</div>
    {searchOpen && <label className="skin-shop-search"><Search size={18}/><span className="sr-only">Rechercher une tenue</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher une tenue…" type="search"/></label>}
    <section className="shop-current-outfit" aria-label="Minuton porté actuellement"><MinutonFigure size={52} outfit={shop.equipped.mascot} animated={false}/><div><small>Porté actuellement</small><strong>{getShopItem(shop.equipped.mascot ?? '')?.title ?? 'Minuton classique'}</strong></div>{shop.equipped.mascot ? <button type="button" disabled={busy || loading} className="skin-reset" aria-label="Revenir à Minuton classique" onClick={() => void equip(null)}><RotateCcw size={17}/></button> : <Check size={18} aria-hidden="true"/>}</section>
    {shop.canClaimTestCredit && <Button className="mt-3" variant="secondary" disabled={busy || loading} onClick={() => void claimCredit()}>Recevoir 10 000 Minutons de test</Button>}
    {notice && <p role="status" className="skin-shop-notice">{notice}</p>}
    {error && !selected && <div role="alert" className="mt-3"><p>{error}</p><Button variant="secondary" size="sm" onClick={() => void refresh()}><RotateCcw/>Réessayer</Button></div>}
    {loading && <p role="status" className="mt-4">Chargement de tes achats…</p>}
    {overview && <>
      <section className="skin-featured" data-collection={FEATURED.id} aria-label="Collection à la une"><div className="skin-featured-top"><span><Ghost size={14}/>À la une</span><small>{countOf(FEATURED.id)} tenues</small></div><CollectionArt outfits={FEATURED.outfits}/><div className="skin-featured-copy"><h2>La magie d’Halloween</h2><p>Un costume pour chaque petit frisson.</p><button type="button" onClick={() => openCollection(FEATURED.id)}>Voir la collection<ChevronRight size={18}/></button></div></section>
      <section className="skin-collections"><div className="skin-section-title"><h2>Explore les collections</h2><span>4 univers</span></div><div className="skin-collections-grid">{COLLECTIONS.map(value => <button type="button" key={value.id} data-collection={value.id} onClick={() => openCollection(value.id)} aria-label={`Explorer la collection ${value.title}`}><CollectionArt outfits={value.outfits}/><div><strong><value.Icon size={15}/>{value.title}</strong><span>{countOf(value.id)} tenues<ChevronRight size={15}/></span></div></button>)}</div></section>
    </>}
    {activeCollection && <><button type="button" className="skin-back" onClick={() => { setCollection(undefined); setQuery(''); setGender('all') }}><ArrowLeft size={16}/>Toutes les collections</button><section className="skin-collection-banner" data-collection={activeCollection.id}><CollectionArt outfits={activeCollection.outfits}/><div><h2>{activeCollection.title}</h2><p>{activeCollection.subtitle}</p></div></section></>}
    <section className="skin-catalogue" aria-label="Catalogue des tenues"><div className="skin-section-title"><h2>{activeCollection ? 'Choisis ta tenue' : shelf === 'owned' ? 'Mes tenues' : shelf === 'favorites' ? 'Mes envies' : 'Toutes les tenues'}</h2><span>{items.length} {items.length === 1 ? 'tenue' : 'tenues'}</span></div>
      {!overview && !activeCollection && <p className="skin-shelf-caption">{shelf === 'owned' ? 'Tes tenues débloquées, prêtes à être portées.' : shelf === 'favorites' ? 'Les tenues que tu as gardées de côté.' : 'Une tenue pour chaque envie.'}</p>}
      <div className="skin-gender-filters" aria-label="Filtrer les tenues">{([{id:'all',label:'Tout'}, {id:'male',label:'Masculins'}, {id:'female',label:'Féminins'}] as const).map(filter => <button type="button" key={filter.id} aria-pressed={gender === filter.id} onClick={() => setGender(filter.id)}>{filter.label}</button>)}</div>
      <div className="studio-shop-grid">{items.map(item => {
        const bought = shop.owned.includes(item.id), equipped = shop.equipped.mascot === item.id
        return <Card key={item.id} padding="none" className="shop-product min-w-0 gap-0 overflow-hidden" data-category="mascot">
          <div className="skin-product-art"><button type="button" onClick={() => preview(item)} aria-label={`Prévisualiser ${item.title}`}><ShopPreview item={item}/></button><button type="button" className="skin-favorite" aria-label={`${favorites.includes(item.id) ? 'Retirer' : 'Ajouter'} ${item.title} ${favorites.includes(item.id) ? 'des' : 'aux'} favoris`} aria-pressed={favorites.includes(item.id)} onClick={() => toggleFavorite(item.id)}><Heart size={18} fill={favorites.includes(item.id) ? 'currentColor' : 'none'}/></button>{equipped ? <span className="shop-worn-badge"><Check size={12}/>Porté actuellement</span> : bought && <span className="skin-owned-badge"><Check size={12}/>Acheté</span>}</div>
          <div className="shop-product-body"><small>{COLLECTIONS.find(value => value.id === groupOf(item))?.title}</small><h3>{item.title.replace('Minuton ', '')}</h3><div className="shop-product-actions"><span className="shop-product-price"><Price value={item.price} size={18}/></span>{bought ? <Button size="sm" variant="secondary" disabled={busy || loading || equipped} onClick={() => void equip(item)}>{equipped ? 'Porté' : 'Porter'}</Button> : <Button size="sm" variant="secondary" onClick={() => preview(item)} aria-label={`Voir l’aperçu de ${item.title}`}>Voir<ChevronRight size={14}/></Button>}</div></div>
        </Card>
      })}</div>
      {!items.length && <div className="skin-empty"><Heart size={27}/><p>{query ? 'Aucune tenue ne correspond à ta recherche.' : shelf === 'favorites' ? 'Touche le cœur d’une tenue pour la retrouver ici.' : shelf === 'owned' ? 'Tes prochaines tenues débloquées apparaîtront ici.' : 'Aucune tenue avec ces filtres.'}</p><button type="button" onClick={() => { changeShelf('discover'); setSearchOpen(false) }}>Explorer les tenues<ChevronRight size={15}/></button></div>}
    </section>
    <p className="skin-shop-footnote">Tes achats ne diminuent pas tes niveaux ni tes badges.{shop.bonus > 0 && <span>Crédit de test inclus dans le solde.</span>}</p>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open && !busy) setSelected(undefined) }}><DialogContent className="skin-preview-dialog">
      {selected && <><DialogHeader><DialogTitle>{selected.title}</DialogTitle><DialogDescription>Collection {COLLECTIONS.find(value => value.id === groupOf(selected))?.title}</DialogDescription></DialogHeader><ShopPreview item={selected} detail/><p className="skin-preview-description">{selected.description}</p><button type="button" className="skin-preview-favorite" aria-pressed={favorites.includes(selected.id)} onClick={() => toggleFavorite(selected.id)}><Heart size={17} fill={favorites.includes(selected.id) ? 'currentColor' : 'none'}/>{favorites.includes(selected.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}</button>
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
