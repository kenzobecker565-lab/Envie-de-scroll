import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Palette, Check, X, Pin, Brain, Dumbbell, Archive, BookOpen, ChevronRight, Frame, Music2, Pencil } from 'lucide-react'
import { LEARNING_PASSIONS, getPassion, parseAtelierAppearance, ATELIER_AMBIANCES, ATELIER_FRAMES, ATELIER_DECORS, type AtelierAppearance, type CompletionDTO, type LearningPassion } from '@scroll-up/shared'
import { api } from '../api/client.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { Screen } from '../components/Screen.tsx'
import { CarnetHeader } from '../components/CarnetHeader.tsx'
import { PracticeProgress } from '../components/PracticeProgress.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { Button } from '../components/ui/button.tsx'
import { Dialog, DialogContent } from '../components/ui/dialog.tsx'
import { GalleryDetail } from './GalleryScreen.tsx'
import { ATELIER_CAPACITY, atelierSelection } from '../lib/atelier.ts'
import './AtelierScreen.css'
const CORNERS: Record<LearningPassion, string> = {
  dessin: 'Le mur des dessins',
  ecriture: 'Le bureau des histoires',
  piano: 'Le coin piano',
  logique: 'Le tableau des énigmes',
  francais: 'Les mots bien choisis',
  sport: 'Le coin mouvement',
}
type Corner = { items: CompletionDTO[]; more: boolean; error: boolean }
export function AtelierScreen({ focus }: { focus?: string }) {
  const reduced=useReducedMotion()
 const { state, dispatch } = useAppState()
 const [appearance,setAppearance]=useState(()=>parseAtelierAppearance(state.me.user.atelier))
 const [draft,setDraft]=useState<AtelierAppearance>(appearance),[editing,setEditing]=useState(false),[saving,setSaving]=useState(false),[appearanceError,setAppearanceError]=useState('')
 const visible=editing?draft:appearance
 const saveAppearance=async()=>{if(saving)return;setSaving(true);setAppearanceError('');try{const response=await api.updateAtelier(draft);dispatch({type:'user',user:response.user});setAppearance(parseAtelierAppearance(response.user.atelier));setEditing(false)}catch(e){setAppearanceError((e as Error).message)}finally{setSaving(false)}}
  const pinKey = `scroll-up:atelier-pins:${state.me.user.id}`
  const { push } = useNavigation(),
    [selected, setSelected] = useState<LearningPassion>('dessin'),
    [pins, setPins] = useState<Partial<Record<LearningPassion, string>>>(() => {
      try { const value = JSON.parse(localStorage.getItem(pinKey) ?? '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {} } catch { return {} }
    }),
    [pinError, setPinError] = useState(''),
    [corners, setCorners] = useState<Partial<Record<LearningPassion, Corner>>>({}),
    [opened, setOpened] = useState<CompletionDTO>(),
    [focusError, setFocusError] = useState(false),
    [reload, setReload] = useState(0)
  useEffect(() => {
    let live = true
    for (const passion of LEARNING_PASSIONS)
      api
        .completions(undefined, passion, ATELIER_CAPACITY[passion])
        .then((page) => {
          if (live)
            setCorners((v) => ({
              ...v,
              [passion]: { items: atelierSelection([...(v[passion]?.items.filter(i => i.id === pins[passion]) ?? []), ...page.items], passion, pins[passion]), more: !!page.nextCursor, error: false },
            }))
        })
        .catch(() => {
          if (live)
            setCorners((v) => ({
              ...v,
              [passion]: { items: v[passion]?.items ?? [], more: v[passion]?.more ?? false, error: true },
            }))
        })
    return () => {
      live = false
    }
  }, [reload, pins])
  useEffect(() => {
    let live = true
    for (const passion of LEARNING_PASSIONS) {
      const id = pins[passion]
      if (typeof id !== 'string') continue
      api.completion(id).then(({completion}) => {
        if (live && completion.passion === passion) setCorners(v => ({...v, [passion]: {...(v[passion] ?? {more:true,error:false}), items: atelierSelection([completion, ...(v[passion]?.items ?? [])], passion, id)}}))
      }).catch(() => {})
    }
    return () => { live = false }
  }, [pins, reload])
  useEffect(() => {
    if (!focus) return
    let live = true
    setFocusError(false)
    api
      .completion(focus)
      .then(({ completion }) => {
        if (live) {
          setOpened(completion)
          if (LEARNING_PASSIONS.includes(completion.passion as LearningPassion))
            setSelected(completion.passion as LearningPassion)
        }
      })
      .catch(() => live && setFocusError(true))
    return () => {
      live = false
    }
  }, [focus, reload])
  const corner = corners[selected],
    items = [...(corner?.items ?? [])].sort((a,b) => Number(b.id === pins[selected]) - Number(a.id === pins[selected]))
  const togglePin = (item: CompletionDTO) => {
    const passion = item.passion as LearningPassion
    if (!LEARNING_PASSIONS.includes(passion)) return
    const next = {...pins, [passion]: pins[passion] === item.id ? undefined : item.id}
    try { localStorage.setItem(pinKey, JSON.stringify(next)); setPins(next); setPinError('') } catch { setPinError('Cette mise à l’honneur n’a pas pu être mémorisée sur cet appareil.') }
  }
  const CornerIcon = selected === 'piano' ? Music2 : selected === 'ecriture' ? Pencil : selected === 'logique' ? Brain : selected === 'francais' ? BookOpen : selected === 'sport' ? Dumbbell : Frame
  return (
    <Screen tabs className="atelier-screen carnet-page carnet-atelier">
      <CarnetHeader title="Mon atelier" subtitle="Un espace qui grandit avec toi." pose="draw" action={<button type="button" className="studio-icon-button" aria-label="Personnaliser mon atelier" aria-expanded={editing} onClick={()=>{setDraft(appearance);setEditing(v=>!v);setAppearanceError('')}}><Palette size={20}/></button>}/>
      <button type="button" className="atelier-personalize" aria-expanded={editing} onClick={()=>{setDraft(appearance);setEditing(v=>!v);setAppearanceError('')}}><Palette size={18}/>Personnaliser mon atelier</button>
      <div className="atelier-tabs" aria-label="Les six coins de l’atelier">
        {LEARNING_PASSIONS.map((p) => (
          <button key={p} aria-pressed={p === selected} onClick={() => setSelected(p)}>
            {getPassion(p).label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}><motion.section key={selected} initial={{opacity:0,y:reduced?0:7}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduced?0:-5}} transition={{duration:reduced?0:.2}} className="atelier-room" data-ambiance={visible.ambiance} data-frames={visible.frames} data-decor={visible.decor} data-corner={selected} aria-label={CORNERS[selected]}>
        <div className="atelier-room-label">
          <span>MON ATELIER</span>
          <h2>{CORNERS[selected]}</h2>
        </div>
        <div className="atelier-frames" data-count={items.length}>
          {items.slice(0, selected === 'dessin' ? 6 : 4).map((item, index) => (
            <button
              className="atelier-frame"
              key={item.id}
              style={{ rotate: `${index % 2 ? 1.5 : -1}deg` }}
              onClick={() => setOpened(item)}
              aria-label={`Ouvrir ${item.exploredTitle ?? item.activityText}`}
            >
              {item.id === pins[selected] && <Pin className="atelier-frame-pin" size={12}/>}
              {item.photoUrl ? (
                <img src={item.photoUrl} alt="" />
              ) : (
                <>
                  <span className="atelier-frame-icon" aria-hidden="true"><CornerIcon/></span>
                  <span>{item.text ?? item.exploredTitle ?? item.activityText}</span>
                </>
              )}
            </button>
          ))}
          {corner && !items.length && !corner.error && (
            <div className="atelier-empty-wall">
              <Frame size={27} />
              <p>Une place pour ta prochaine activité</p>
            </div>
          )}
        </div>
        {visible.mascot && <div className="atelier-mascot">
          <Mascot pose={items.length ? 'cheer' : 'welcome'} size={110} animated={false} />
        </div>}
        <span className="atelier-room-caption">
          {items.length ? 'Tes dernières activités prennent place ici.' : 'L’atelier se remplit avec toi.'}
        </span>
      </motion.section></AnimatePresence>
      {editing&&<section className="atelier-editor" aria-label="Personnalisation de mon atelier">
        <div className="atelier-editor-heading"><h2>L’ambiance de mon atelier</h2><button type="button" aria-label="Annuler la personnalisation" disabled={saving} onClick={()=>{setDraft(appearance);setEditing(false);setAppearanceError('')}}><X size={20}/></button></div>
        <fieldset disabled={saving}><legend>Ambiance</legend><div className="atelier-options">{ATELIER_AMBIANCES.map(value=><button type="button" key={value} data-ambiance={value} aria-pressed={draft.ambiance===value} onClick={()=>setDraft(v=>({...v,ambiance:value}))}><span className="atelier-swatch"/>{({lavande:'Lavande',sauge:'Sauge',crepuscule:'Crépuscule'})[value]}</button>)}</div></fieldset>
        <fieldset disabled={saving}><legend>Cadres</legend><div className="atelier-options">{ATELIER_FRAMES.map(value=><button type="button" key={value} aria-pressed={draft.frames===value} onClick={()=>setDraft(v=>({...v,frames:value}))}>{({bois:'Bois',violet:'Violet',papier:'Papier'})[value]}</button>)}</div></fieldset>
        <fieldset disabled={saving}><legend>Décor</legend><div className="atelier-options">{ATELIER_DECORS.map(value=><button type="button" key={value} aria-pressed={draft.decor===value} onClick={()=>setDraft(v=>({...v,decor:value}))}>{value==='atelier'?'Atelier créatif':'Épuré'}</button>)}</div></fieldset>
        <label className="atelier-show-mascot"><input type="checkbox" checked={draft.mascot} disabled={saving} onChange={e=>setDraft(v=>({...v,mascot:e.target.checked}))}/>Afficher Minuton dans l’atelier</label>
        {appearanceError&&<p role="alert">{appearanceError}</p>}<Button disabled={saving} onClick={()=>void saveAppearance()}><Check size={18}/>{saving?'Enregistrement…':'Enregistrer mon ambiance'}</Button><small>Conservé sur ton compte. L’aperçu ne dépense aucun Minuton.</small>
      </section>}
      <PracticeProgress passion={selected} rows={state.me.stats.byPassion}/>
      {!corner && <p role="status">Minuton ouvre l’atelier…</p>}
      {corner?.error && (
        <div role="alert">
          <p>Ce coin n’a pas pu être chargé.</p>
          <Button variant="secondary" onClick={() => setReload((v) => v + 1)}>
            Réessayer
          </Button>
        </div>
      )}
      {focusError && (
        <div role="alert">
          <p>Cette création n’a pas pu être ouverte.</p>
          <Button variant="secondary" onClick={() => setReload((v) => v + 1)}>
            Réessayer
          </Button>
        </div>
      )}
      <div className="atelier-section-heading">
        <h2>{getPassion(selected).label}</h2>
        <span>{items.length ? `${items.length} à découvrir` : 'À toi de créer'}</span>
      </div>
      <p className="atelier-subtle">Choisis une création à mettre à l’honneur. Toutes les autres restent dans ta réserve.</p>
      {pinError && <p role="alert">{pinError}</p>}
      <div className="atelier-works">
        {items.map((item) => (
          <div key={item.id} className="atelier-work-row"><button className="atelier-work" onClick={() => setOpened(item)}>
            {item.photoUrl ? (
              <img src={item.photoUrl} alt="" loading="lazy" />
            ) : (
              <span className="atelier-work-symbol">
                <BookOpen size={23} />
              </span>
            )}
            <span>
              <strong>{item.exploredTitle ?? item.activityText}</strong>
              <small>
                {new Date(item.createdAt).toLocaleDateString('fr-FR')} · {item.duration} min
              </small>
              {item.text && <small>Lire mon texte en entier</small>}
            </span>
            <ChevronRight size={18} />
          </button><button className="atelier-pin" aria-label={`${pins[selected] === item.id ? 'Retirer de' : 'Mettre à'} l’honneur cette création`} aria-pressed={pins[selected] === item.id} onClick={() => togglePin(item)}><Pin size={18}/></button></div>
        ))}
      </div>
      {corner && !corner.error && !items.length && (
        <Button onClick={() => push({ name: 'passionSpace', passion: selected })}>
          Découvrir les activités de {getPassion(selected).label.toLocaleLowerCase('fr')}
        </Button>
      )}
      <button className="atelier-link" onClick={() => push(selected==='dessin'?{name:'drawingNotebook'}:{name:'gallery',passion:selected})}>
        <Archive />
        <span>
          <strong>{corner?.more ? 'Ouvrir ma réserve' : 'Voir en liste'}</strong>
          <small>Toutes mes activités de {getPassion(selected).label.toLocaleLowerCase('fr')}</small>
        </span>
        <ChevronRight />
      </button>
      <button className="atelier-link atelier-notebooks" onClick={() => push({ name: 'learningNotebooks' })}>
        <BookOpen />
        <span>
          <strong>Mes carnets d’apprentissage</strong>
          <small>Les essais de mes leçons, conservés à part</small>
        </span>
        <ChevronRight />
      </button>
      <Dialog
        open={!!opened}
        onOpenChange={(open) => {
          if (!open) setOpened(undefined)
        }}
      >
        <DialogContent>{opened && <><GalleryDetail item={opened}/>{LEARNING_PASSIONS.includes(opened.passion as LearningPassion) && <Button variant="secondary" onClick={() => togglePin(opened)}><Pin size={17}/>{pins[opened.passion as LearningPassion] === opened.id ? 'Retirer de la mise à l’honneur' : 'Mettre à l’honneur dans mon atelier'}</Button>}<small>Mise à l’honneur mémorisée sur cet appareil.</small>{pinError && <p role="alert">{pinError}</p>}</>}</DialogContent>
      </Dialog>
    </Screen>
  )
}
