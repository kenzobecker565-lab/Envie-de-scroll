import { CarnetHeader } from '../components/CarnetHeader.tsx'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, ExternalLink, Shirt, ScanEye, RotateCcw, Search, Ghost, Trophy, Palette, Sparkles, Gift, Copy } from 'lucide-react'
import { getShopItem, SHOP_ITEMS, type ShopCategory, type ShopItem, type Melody } from '@scroll-up/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import './ShopScreen.css'
import './ShopBoutique.css'

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
type CollectionId = typeof COLLECTIONS[number]['id']
type Shelf = 'discover' | 'owned' | 'try'
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
  const { dispatch } = useAppState()
  const shop = useShop()
  const [shelf, setShelf] = useState<Shelf>(library ? 'owned' : 'discover')
  const [collection, setCollection] = useState<CollectionId>()
  const [tryingId,setTryingId]=useState<string>()
  const [tryFilter,setTryFilter]=useState<'all'|'owned'|'discover'>('all')
  const [gender, setGender] = useState<Gender>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ShopItem>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string>()
  const [codeOpen, setCodeOpen] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string>()
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
      setNotice(`${item?.title ?? 'Ta tenue'} est disponible dans Mes tenues.`)
      setCodeOpen(false); setCode(''); changeShelf('owned'); setSelected(item)
    } catch (caught) { setCodeError((caught as Error).message) }
    finally { setBusy(false) }
  }
  const purchase = async () => {
    if (!selected || busy) return
    setBusy(true); setError(undefined)
    try {
      dispatch({ type: 'shop', shop: await api.buyItem(selected.id) })
      setNotice(`${selected.title} rejoint ton vestiaire. Tu peux maintenant porter cette tenue.`)
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
  const openCollection = (id: CollectionId) => { setShelf('discover'); setCollection(id); setGender('all'); setQuery('') }
  const activeCollection=COLLECTIONS.find(value=>value.id===collection)
  const accessibleSkins=ALL_SKINS.filter(item=>item.available||shop.owned.includes(item.id))
  const owns=(item:ShopItem)=>shop.owned.includes(item.id)
  const matches=(item:ShopItem)=>(gender==='all'||(gender==='female'?item.mascotGender==='female':item.mascotGender!=='female'))&&item.title.toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr'))
  const items=(shelf==='owned'?accessibleSkins.filter(owns):SKINS).filter(item=>(!collection||groupOf(item)===collection)&&matches(item))
  const tryItems=accessibleSkins.filter(item=>(tryFilter==='all'||(tryFilter==='owned'?owns(item):!owns(item)))&&matches(item))
  const trying=tryItems.find(item=>item.id===(tryingId??shop.equipped.mascot))??tryItems[0]
  const overview=shelf==='discover'&&!collection&&!query.trim()&&gender==='all'
  const collectionOwned=activeCollection?SKINS.filter(item=>groupOf(item)===activeCollection.id&&owns(item)).length:0
  const owned=selected?owns(selected):false,active=selected?shop.equipped.mascot===selected.id:false
  const tryOn=(item:ShopItem)=>{setTryingId(item.id);setTryFilter('all');setGender('all');setQuery('');setCollection(undefined);setShelf('try');setSelected(undefined)}
  const stepTry=(direction:number)=>{if(trying&&tryItems.length)setTryingId(tryItems[(tryItems.indexOf(trying)+direction+tryItems.length)%tryItems.length]!.id)}
  const product=(item:ShopItem)=>{const bought=owns(item),worn=shop.equipped.mascot===item.id;return <article key={item.id} className="boutique-product shop-product"><button type="button" className="boutique-product-art" onClick={()=>preview(item)} aria-label={`Prévisualiser ${item.title}`}><ShopPreview item={item}/>{bought&&<span className="boutique-owned"><Check size={13}/>{worn?'Porté':'Possédé'}</span>}</button><div className="boutique-product-copy"><h3>{item.title.replace('Minuton ','')}</h3><div>{shelf==='owned'?<Button disabled={busy||loading||worn} onClick={()=>void equip(item)}>{worn?<><Check size={14}/>Porté</>:'Porter'}</Button>:<><Price value={item.price} size={19}/><Button onClick={()=>preview(item)}>Voir</Button></>}</div></div></article>}
  const filters=<div className="boutique-filters" aria-label="Filtrer les tenues">{([{id:'all',label:'Tout'},{id:'male',label:'Masculins'},{id:'female',label:'Féminins'}] as const).map(filter=><button type="button" key={filter.id} aria-pressed={gender===filter.id} onClick={()=>setGender(filter.id)}>{filter.label}</button>)}</div>
  const title=activeCollection?.title??(shelf==='try'?'Essayage':shelf==='owned'?'Mon vestiaire':'La boutique')
  const subtitle=activeCollection?.subtitle??(shelf==='try'?'Trouve ta prochaine allure.':shelf==='owned'?'À chaque envie, sa tenue.':'Un Minuton à ton image.')
  return <Screen tabs className={`studio-shop skin-shop carnet-page carnet-shop renewed-shop boutique-v2${shelf==='try'?' boutique-trying':''}`}>
    <CarnetHeader variant="banner" title={title} subtitle={subtitle} pose={activeCollection?.id==='sports'?'gallery-sport':'welcome'} onBack={collection?()=>setCollection(undefined):undefined}/>
    <div className="skin-shop-tabs boutique-tabs" aria-label="Parcourir la boutique">{([{id:'discover',label:'Découvrir',Icon:Gift},{id:'owned',label:'Mes tenues',Icon:Shirt},{id:'try',label:'Essayage',Icon:ScanEye}] as const).map(tab=><button type="button" key={tab.id} aria-pressed={shelf===tab.id} onClick={()=>changeShelf(tab.id)}><tab.Icon size={17}/>{tab.label}</button>)}</div>
    {shelf!=='try'&&<div className="boutique-search-row"><label className="skin-shop-search"><Search size={19}/><span className="sr-only">Rechercher une tenue</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Rechercher une tenue…"/></label><button type="button" className="boutique-gift" aria-label="Utiliser un code cadeau" onClick={()=>{setCodeError(undefined);setCodeOpen(true)}}><Gift size={23}/></button></div>}
    {notice&&shelf!=='try'&&<p role="status" className="skin-shop-notice">{notice}</p>}
    {error&&!selected&&<div role="alert" className="boutique-error"><p>{error}</p><Button variant="secondary" disabled={loading} onClick={()=>void refresh()}>Réessayer</Button></div>}
    {loading&&<p role="status" className="boutique-loading">Chargement des tenues…</p>}
    {overview&&<><button type="button" className="boutique-feature" onClick={()=>openCollection('halloween')}><span className="boutique-feature-tag"><Sparkles size={14}/>À la une</span><MinutonFigure outfit="mascot-halloween-sorciere" size={210} animated={false}/><span className="boutique-feature-caption"><strong>Un peu de magie</strong><span>Explorer Halloween<ChevronRight size={17}/></span></span></button><section className="boutique-collections"><div className="skin-section-title"><h2>Les collections</h2><span>4 univers</span></div><div className="skin-collections-grid">{COLLECTIONS.map(value=><button type="button" key={value.id} data-collection={value.id} onClick={()=>openCollection(value.id)} aria-label={`Explorer la collection ${value.title}`}><CollectionArt outfits={value.outfits}/><span className="boutique-collection-label"><strong>{value.title}</strong><ChevronRight size={18}/></span></button>)}</div></section></>}
    {activeCollection&&<><button type="button" className="skin-back" onClick={()=>{setCollection(undefined);setGender('all');setQuery('')}}><ArrowLeft size={17}/>Toutes les collections</button>{filters}<section className="boutique-collection-progress" aria-label="Progression de la collection"><strong>Ta collection</strong><progress max={countOf(activeCollection.id)} value={collectionOwned}/><span>{collectionOwned} / {countOf(activeCollection.id)}</span></section></>}
    {shelf==='owned'&&<section className="shop-current-outfit boutique-current"><MinutonFigure size={60} outfit={shop.equipped.mascot} animated={false}/><div><small>Tu portes</small><strong>{getShopItem(shop.equipped.mascot??'')?.title??'Minuton classique'}</strong></div><button type="button" disabled={busy||loading||!shop.equipped.mascot} aria-label="Revenir à Minuton classique" onClick={()=>void equip(null)}><RotateCcw size={16}/>Classique</button></section>}
    {shelf!=='try'&&!overview&&<section className="skin-catalogue boutique-catalogue" aria-label="Catalogue des tenues"><div className="skin-section-title"><h2>{shelf==='owned'?'Tes tenues':activeCollection?'Choisis ta tenue':'Les tenues'}</h2><span>{items.length} tenue{items.length!==1?'s':''}</span></div>{!activeCollection&&filters}<div className="boutique-product-grid">{items.map(product)}</div>{!items.length&&!loading&&<div className="skin-empty"><Shirt size={30}/><p>{query?'Aucune tenue ne correspond à ta recherche.':shelf==='owned'?'Ton vestiaire attend sa première tenue.':'Aucune tenue avec ces filtres.'}</p><button type="button" onClick={()=>changeShelf('discover')}>Explorer les collections<ChevronRight size={16}/></button></div>}</section>}
    {shelf==='try'&&<section className="boutique-fitting" aria-label="Essayer les tenues sans changer celle portée">
      {trying?<><SwipeSurface className="boutique-fitting-stage" label="Aperçu de la tenue essayée" onStep={stepTry}><MinutonFigure key={trying.id} outfit={trying.id} size={285} animated={false}/><button type="button" aria-label="Essayer la tenue précédente" disabled={tryItems.length<2} onClick={()=>stepTry(-1)}><ChevronLeft size={23}/></button><button type="button" aria-label="Essayer la tenue suivante" disabled={tryItems.length<2} onClick={()=>stepTry(1)}><ChevronRight size={23}/></button></SwipeSurface><div className="boutique-fitting-title" aria-live="polite"><h2>{trying.title}</h2><span data-owned={owns(trying)}>{owns(trying)?<><Check size={14}/>{shop.equipped.mascot===trying.id?'Ta tenue actuelle':'Déjà dans ton vestiaire'}</>:<><BrandMark size={17}/>À découvrir</>}</span></div></>:<div className="boutique-fitting-empty"><MinutonFigure size={150} animated={false}/><p>{loading?'Chargement des tenues…':tryFilter==='owned'?'Tu n’as pas encore de tenue. Essaie celles à découvrir.':'Aucune tenue avec ces filtres.'}</p></div>}
      <h3>Choisis une tenue</h3><div className="boutique-filters" aria-label="Tenues à essayer">{([{id:'all',label:'Tout'},{id:'owned',label:'Mes tenues'},{id:'discover',label:'À découvrir'}] as const).map(filter=><button type="button" key={filter.id} aria-pressed={tryFilter===filter.id} onClick={()=>setTryFilter(filter.id)}>{filter.label}</button>)}</div>
      <div className="boutique-fitting-rail" aria-label="Tenues disponibles pour l’essayage">{tryItems.map(item=><button type="button" key={item.id} aria-label={`Essayer ${item.title}`} aria-pressed={trying?.id===item.id} onClick={()=>setTryingId(item.id)} ref={node=>{if(node&&trying?.id===item.id){const rail=node.parentElement;if(rail){if(node.offsetLeft<rail.scrollLeft)rail.scrollLeft=node.offsetLeft;else if(node.offsetLeft+node.offsetWidth>rail.scrollLeft+rail.clientWidth)rail.scrollLeft=node.offsetLeft+node.offsetWidth-rail.clientWidth}}}}><MinutonFigure outfit={item.id} size={98} animated={false}/><strong>{item.title.replace('Minuton ','')}</strong><span>{owns(item)?<><Check size={13}/>Possédée</>:<Price value={item.price} size={16}/>}</span></button>)}</div>
      {trying&&<div className="boutique-fitting-actions">{owns(trying)?<Button disabled={busy||loading||shop.equipped.mascot===trying.id} onClick={()=>void equip(trying)}>{busy?'Activation…':shop.equipped.mascot===trying.id?<><Check size={18}/>Tenue portée</>:'Porter cette tenue'}</Button>:<Button disabled={loading||busy} onClick={()=>preview(trying)}>Acheter · <Price value={trying.price}/></Button>}<p>L’essayage ne change pas ta tenue actuelle.</p></div>}
    </section>}
    {shelf!=='try'&&<details className="boutique-extras"><summary><Gift size={16}/>Cadeaux et informations</summary><Button variant="secondary" onClick={()=>{setCodeError(undefined);setCodeOpen(true)}}>Utiliser un code cadeau</Button>{shop.canClaimTestCredit&&<Button variant="secondary" disabled={busy||loading} onClick={()=>void claimCredit()}>Recevoir 10 000 Minutons de test</Button>}{!!shop.giftCodes?.length&&<div className="boutique-admin-codes"><h3>Mes codes cadeaux · Administrateur</h3>{shop.giftCodes.map(gift=><div key={gift.itemId}><strong>{gift.title}</strong><code>{gift.code}</code><button type="button" onClick={()=>{void navigator.clipboard?.writeText(gift.code).then(()=>setNotice('Code copié.')).catch(()=>setNotice('Sélectionne le code affiché pour le copier.'))}}><Copy size={15}/>Copier</button></div>)}</div>}<p>Tes achats ne diminuent pas tes niveaux ni tes badges.</p></details>}
    <Dialog open={codeOpen} onOpenChange={open=>{if(!busy)setCodeOpen(open)}}><DialogContent className="renewed-shop-dialog boutique-gift-dialog"><DialogHeader><DialogTitle>Un cadeau pour toi</DialogTitle><DialogDescription>Une tenue à débloquer avec ton code cadeau.</DialogDescription></DialogHeader><div className="boutique-gift-art" aria-hidden="true"><Gift size={112}/><MinutonFigure pose="cheer" size={120} animated={false}/></div><form onSubmit={event=>{event.preventDefault();void redeemCode()}}><label htmlFor="skin-code">Ton code</label><Input id="skin-code" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={64} value={code} onChange={event=>{setCode(event.target.value);setCodeError(undefined)}} placeholder="Saisis ton code…" disabled={busy} aria-invalid={Boolean(codeError)} aria-describedby={codeError?'skin-code-error':undefined}/>{codeError&&<p role="alert" id="skin-code-error">{codeError}</p>}<Button type="submit" disabled={busy||!code.trim()}>{busy?'Déblocage…':'Débloquer ma tenue'}</Button><p>Elle rejoindra ton vestiaire.</p></form></DialogContent></Dialog>
    <Dialog open={Boolean(selected)} onOpenChange={open=>{if(!open&&!busy)setSelected(undefined)}}><DialogContent className="skin-preview-dialog renewed-shop-dialog boutique-preview"><DialogHeader><DialogTitle>{selected?.title??'Aperçu'}</DialogTitle><DialogDescription>{selected?.redemptionOnly?'Édition privée · offerte par code':`Collection ${COLLECTIONS.find(value=>value.id===(selected&&groupOf(selected)))?.title??'Minuton'}`}</DialogDescription></DialogHeader>{selected&&<><div className="boutique-preview-stage"><ShopPreview item={selected} detail/></div><p className="skin-preview-description">{selected.description}</p><button type="button" className="boutique-try-link" onClick={()=>tryOn(selected)}><ScanEye size={19}/>Essayer dans le vestiaire</button>{error&&<p role="alert">{error}</p>}{owned?<Button disabled={busy||loading||active} onClick={()=>void equip(selected)}>{busy?'Activation…':active?<><Check size={18}/>Porté actuellement</>:'Porter cette tenue'}</Button>:selected.redemptionOnly?<Button onClick={()=>{setSelected(undefined);setCodeOpen(true)}}>Utiliser un code cadeau</Button>:<><div className="skin-purchase-info"><span>Achat permanent</span><Price value={selected.price}/></div><p className="skin-purchase-balance">{shop.balance>=selected.price?<>Solde après achat<Price value={shop.balance-selected.price} size={18}/></>:<>Il te manque<Price value={selected.price-shop.balance} size={18}/></>}</p><Button disabled={busy||loading||shop.balance<selected.price} onClick={()=>void purchase()} aria-label={`Confirmer l’achat de ${selected.title}`}>{busy?'Achat en cours…':<>Acheter cette tenue · <Price value={selected.price}/></>}</Button></>}<Button variant="ghost" disabled={busy} onClick={()=>setSelected(undefined)}>Fermer l’aperçu</Button></>}</DialogContent></Dialog>
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
