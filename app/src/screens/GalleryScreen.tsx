import { ArrowRight, ChevronDown, Clapperboard, Clock3, Maximize2, RotateCcw, Send, Share2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Fragment, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { getPassion, isChallengeId, type PassionId, type CompletionDTO } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, PRESSED } from '@/components/ui/button'
import { Card, CardEyebrow, cardVariants } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { api, ApiError, track } from '../api/client.ts'
import { CoinIcon } from '../components/Coins.tsx'
import { EmptyState } from '../components/Illustration.tsx'
import { statsFor } from '../components/Progression.tsx'
import { Screen } from '../components/Screen.tsx'
import { formatDay, formatMonth, formatNumber, monthKey, plural } from '../lib/format.ts'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { shareCreation } from '../lib/share.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * L'onglet « Galerie » : une carte par activité réalisée,
 * de la plus récente à la plus ancienne, groupées par mois. Toucher une carte
 * l'ouvre en grand. Les minutons, parcours et badges vivent dans l'onglet
 * « Progresser ». Jamais de calendrier de jours cochés ou manqués.
 */
function GalleryFrame({ children, embedded, passion }: { children: ReactNode; embedded: boolean; passion?: PassionId }) {
  return embedded ? <div className="workshop-gallery" data-passion={passion}>{children}</div> : <Screen tabs>{children}</Screen>
}

export function GalleryScreen({ passion, embedded = false }: { passion?: PassionId; embedded?: boolean }) {
  const { state, dispatch } = useAppState()
  const { reset } = useNavigation()
  const { stats } = state.me
  const row = passion ? statsFor(stats.byPassion, passion) : null

  const [filter, setFilter] = useState<'all' | 'word'>('all')
  const [items, setItems] = useState<CompletionDTO[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'idle' | 'more' | 'error'>('loading')
  const [error, setError] = useState<string>()
  const [opened, setOpened] = useState<CompletionDTO>()
  const [detailOpen, setDetailOpen] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)

  const load = useCallback(async (from?: string) => {
    setError(undefined)
    setStatus(from ? 'more' : 'loading')
    try {
      const page = await api.completions(from, passion)
      setItems((previous) => (from ? [...previous, ...page.items] : page.items))
      setCursor(page.nextCursor)
      setStatus('idle')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Impossible de charger ta galerie.')
      setStatus('error')
    }
  }, [passion])

  useEffect(() => {
    void load()
  }, [load])

  // Chargement de la suite quand on arrive en bas de la liste.
  useEffect(() => {
    const target = sentinel.current
    if (!target || !cursor || status !== 'idle') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void load(cursor)
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [cursor, status, load])

  const startFlow = () => {
    haptics.impact('heavy')
    dispatch({ type: 'newFlow', flow: passion ? { fixedPassion: passion } : undefined })
    reset([{ name: 'home' }, { name: 'signal' }])
  }

  const open = (item: CompletionDTO) => {
    haptics.impact('light')
    setOpened(item)
    setDetailOpen(true)
  }

  const view = status === 'loading' ? 'loading' : status === 'error' && items.length === 0 ? 'error' : items.length === 0 ? 'empty' : 'list'

  return (
    <GalleryFrame embedded={embedded} passion={passion}>
      {!embedded && <header className="flex flex-col gap-2">
        <h1 className="font-display text-46 font-extrabold tracking-tight text-ink">{passion ? `Créations · ${getPassion(passion).label}` : 'Historique'}</h1>
        <p className="text-15 font-semibold text-ink-soft">
          {plural(row?.activities ?? stats.totalActivities, 'création')} · {formatNumber(row?.minutes ?? stats.totalCoins)} minutons
        </p>
      </header>}


      {embedded && <div className="workshop-filters" aria-label="Filtrer les créations">{([{id:'all',label:'Tout'},{id:'word',label:'Mot du jour'}] as const).filter(entry=>entry.id!=='word'||passion==='dessin'||passion==='ecriture').map(entry=><button type="button" key={entry.id} aria-pressed={filter===entry.id} onClick={()=>setFilter(entry.id)}>{entry.label}</button>)}</div>}
      {embedded && <Button className="mt-3" onClick={startFlow}>{passion==='dessin'?'Créer un nouveau dessin':passion==='ecriture'?'Commencer un texte':'Nouvelle activité'}<ArrowRight/></Button>}
      {(!embedded && (view === 'list' || view === 'loading')) && <h2 className="mt-8 font-display text-26 font-extrabold tracking-tight text-ink">Tes créations</h2>}
      <div className={cn('flex flex-1 flex-col', view === 'list' || view === 'loading' ? 'mt-3' : 'mt-8')}>
        <AnimatePresence mode="wait" initial={false}>
          {view === 'loading' && (
            <motion.div key="loading" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <GallerySkeleton />
            </motion.div>
          )}
          {view === 'error' && (
            <EmptyState
              key="error"
              illustration="offline"
              illustrationClassName="w-32"
              title="Ta galerie ne répond pas"
              description={error}
              action={
                <Button variant="secondary" onClick={() => void load()}>
                  <RotateCcw aria-hidden="true" />
                  Réessayer
                </Button>
              }
            />
          )}
          {view === 'empty' && (
            <EmptyState
              key="empty"
              illustration="empty-gallery"
              title="Ta galerie t’attend."
              description={'Chaque envie de scroller transformée viendra s’afficher ici : tes dessins, tes textes, tes découvertes.'}
              action={
                <Button onClick={startFlow} haptic={false}>
                  J’ai envie de swipe
                  <ArrowRight aria-hidden="true" />
                </Button>
              }
            />
          )}
          {view === 'list' && (
            <motion.div key="list" className={embedded ? 'workshop-gallery-grid' : 'flex flex-col gap-4'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {items.filter(item=>filter==='all'||isChallengeId(item.activityId)).map((item, index) => {
                const previous = items[index - 1]
                const newMonth = !previous || monthKey(previous.createdAt) !== monthKey(item.createdAt)
                return (
                  <Fragment key={item.id}>
                    {!embedded && newMonth && (
                      <h2 className={cn('flex', index > 0 && 'pt-4')}>
                        <Badge variant="secondary" tilt="left" className="capitalize">
                          {formatMonth(item.createdAt)}
                        </Badge>
                      </h2>
                    )}
                    <motion.button
                      type="button"
                      onClick={() => open(item)}
                      aria-haspopup="dialog"
                      className={embedded ? 'workshop-creation' : cn(cardVariants({ padding: 'none', tone: CARD_TONES[item.passion] }), 'block w-full text-left transition-shadow duration-150 active:shadow-press')}
                      initial={{ opacity: 0, y: 28, rotate: 0 }}
                      animate={{ opacity: 1, y: 0, rotate: embedded ? 0 : index % 2 ? 1.2 : -1.2 }}
                      whileTap={PRESSED}
                      transition={{ delay: Math.min(index % 12, 6) * 0.06, type: 'spring', stiffness: 180, damping: 20 }}
                    >
                      {embedded ? <><span className="workshop-creation-preview">{item.photoUrl?<img src={item.photoUrl} alt={item.activityText} loading="lazy"/>:<span>{item.text ?? item.exploredTitle ?? (item.photoPending?'Photo attendue':item.activityText)}</span>}</span><strong>{item.exploredTitle ?? item.activityText}</strong><small>{formatDay(item.createdAt)}</small>{item.text && <span className="workshop-text-read">Lire le texte entier <Maximize2 size={13} aria-hidden="true" /></span>}</> : <GalleryCard item={item} />}
                    </motion.button>
                  </Fragment>
                )
              })}
              {embedded && items.length>0 && !items.some(item=>filter==='all'||isChallengeId(item.activityId)) && <p className="workshop-filter-empty">Aucune création dans cette rubrique pour le moment.</p>}
              <div ref={sentinel} className={embedded?'workshop-sentinel':undefined}/>
              {status === 'more' && <CardSkeleton />}
              {status === 'error' && (
                <Button variant="ghost" size="md" className="w-full" onClick={() => void load(cursor ?? undefined)}>
                  <ChevronDown aria-hidden="true" />
                  Charger la suite
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          {opened && (
            <GalleryDetail item={opened} />
          )}
        </DialogContent>
      </Dialog>
    </GalleryFrame>
  )
}

/* --------------------------------- Cartes --------------------------------- */

/**
 * Chaque passion a son objet : le dessin en polaroïd scotché, le texte sur une
 * page de carnet, la musique en vinyle, le cinéma en ticket de séance, le
 * piano en page de partition.
 */
const CARD_TONES = { dessin: 'default', ecriture: 'default', musique: 'good', cinema: 'warm', piano: 'default' } as const

/** Pied de carte commun : passion, activité, date, minutons gagnés. */
function CardFooter({ item }: { item: CompletionDTO }) {
  const Icon = PASSION_ICONS[item.passion]
  return (
    <div className="flex items-start gap-2">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border-2 border-on-color', item.passion === 'dessin' || item.passion === 'ecriture' ? PASSION_COLORS[item.passion].bg : 'bg-paper')}>
        <Icon size={17} strokeWidth={2.3} className="text-on-color" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="line-clamp-2 text-13 font-semibold">{item.activityText}</p>
        <p className="text-12 opacity-75">
          {getPassion(item.passion).label} · {formatDay(item.createdAt)}
        </p>
      </div>
      <Badge variant="good" size="sm" className="font-numbers">
        +{item.coins}
      </Badge>
    </div>
  )
}

function GalleryCard({ item }: { item: CompletionDTO }) {
  if (item.passion === 'dessin') return <PolaroidCard item={item} />
  if (item.passion === 'ecriture') return <NotebookCard item={item} />
  if (item.passion === 'musique') return <VinylCard item={item} />
  if (item.passion === 'piano') return <ScoreCard item={item} />
  return <TicketCard item={item} />
}

/** Un morceau de scotch, en haut d'un polaroïd. */
function Tape({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('absolute top-1 left-1/2 z-10 h-6 w-24 -translate-x-1/2 -rotate-3 border-x-2 border-dashed border-outline/25 bg-warm/70', className)} />
}

/** Dessin : la photo en polaroïd scotché, la légende en dessous. */
function PolaroidCard({ item }: { item: CompletionDTO }) {
  return (
    <div className="relative flex flex-col gap-3 p-3 pt-5">
      <Tape />
      {item.photoUrl ? (
        <Photo src={item.photoUrl} alt={`Dessin : ${item.activityText}`} className="max-h-[480px]" />
      ) : item.photoPending ? (
        <PhotoPendingNote />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-md border-2 border-dashed border-ink-faint text-14 font-semibold text-ink-soft">Dessin sans photo</div>
      )}
      <div className="px-1">
        <CardFooter item={item} />
      </div>
    </div>
  )
}

/** Écriture : le texte sur une page de carnet à spirale, lignée, avec sa marge. */
function NotebookCard({ item }: { item: CompletionDTO }) {
  const text = item.text
  const long = Boolean(text && text.length > 320)
  return (
    <div className="flex flex-col">
      <div aria-hidden="true" className="flex justify-around border-b-2 border-outline bg-lilac px-4 py-2">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} className="h-3 w-3 rounded-pill border-2 border-outline bg-canvas" />
        ))}
      </div>
      <div className="relative py-3 pr-4 pl-11" style={NOTEBOOK_LINES}>
        <span aria-hidden="true" className="absolute inset-y-0 left-7 border-l-2 border-accent/60" />
        {text ? (
          <>
            <blockquote className={cn('font-display text-17 leading-[28px] font-semibold whitespace-pre-line text-ink', long && 'line-clamp-6')}>{text}</blockquote>
            {long && (
              <span className="inline-flex items-center gap-1 text-13 leading-[28px] font-bold text-ink underline decoration-2 underline-offset-4">
                <Maximize2 size={14} aria-hidden="true" />
                Lire la suite
              </span>
            )}
          </>
        ) : (
          <p className="text-15 leading-[28px] font-semibold text-ink-soft">Écrit sur papier, gardé pour toi.</p>
        )}
      </div>
      <div className="border-t-2 border-outline/15 p-4">
        <CardFooter item={item} />
      </div>
    </div>
  )
}

/** Les lignes du carnet : une tous les 28 px, alignées sur le texte. */
const NOTEBOOK_LINES: React.CSSProperties = {
  backgroundImage: 'linear-gradient(to bottom, transparent 27px, color-mix(in srgb, var(--lilac) 75%, transparent) 27px)',
  backgroundSize: '100% 28px',
  backgroundPosition: '0 12px',
}

/** Musique : un vinyle qui dépasse de sa pochette, et le titre écouté. */
function VinylCard({ item }: { item: CompletionDTO }) {
  const title = item.exploredTitle ?? item.extra?.items[0]
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="relative h-24 w-28 shrink-0">
          {/* La pochette, puis le disque qui en sort. */}
          <span className="absolute top-0 left-0 z-10 flex h-24 w-20 -rotate-3 items-end overflow-hidden rounded-sm border-[2.5px] border-outline bg-paper p-1.5 shadow-chip">
            <span className="h-full w-full rounded-[6px] bg-good-soft" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 8px, color-mix(in srgb, var(--good) 60%, transparent) 8px 12px)' }} />
          </span>
          <Vinyl className="motion-loop anim-vinyl absolute top-1 right-0 h-22 w-22" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-12 font-bold tracking-wider uppercase opacity-80">Dans tes oreilles</span>
          <span className="font-display text-22 leading-tight font-extrabold tracking-tight">{title ?? 'Une écoute rien qu’à toi'}</span>
        </span>
      </div>
      <CardFooter item={item} />
    </div>
  )
}

/** Un disque vinyle (sillons, étiquette, trou central). */
function Vinyl({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={{ '--spin-duration': '7s' } as React.CSSProperties}>
      <circle cx="50" cy="50" r="47" style={{ fill: '#1d1a17', stroke: 'var(--outline)', strokeWidth: 3 }} />
      {[40, 34, 28].map((radius) => (
        <circle key={radius} cx="50" cy="50" r={radius} style={{ fill: 'none', stroke: '#3a352f', strokeWidth: 1.5 }} />
      ))}
      <path d="M22 30 A34 34 0 0 1 40 18" style={{ fill: 'none', stroke: '#ffffff', strokeWidth: 3, strokeLinecap: 'round', opacity: 0.35 }} />
      <circle cx="50" cy="50" r="16" style={{ fill: 'var(--accent)', stroke: '#1d1a17', strokeWidth: 2 }} />
      <circle cx="50" cy="50" r="3" style={{ fill: 'var(--paper)' }} />
    </svg>
  )
}

/** Piano : une page de partition, la portée et quelques notes, et le morceau joué. */
function ScoreCard({ item }: { item: CompletionDTO }) {
  const title = item.exploredTitle
  return (
    <div className="flex flex-col gap-3 p-4">
      <span className="text-12 font-bold tracking-wider uppercase opacity-80">Au piano</span>
      <span className="font-display text-22 leading-tight font-extrabold tracking-tight">{title ?? 'Une séance au clavier'}</span>
      <Staff className="h-14 w-full" />
      <CardFooter item={item} />
    </div>
  )
}

/** Une portée en clé de sol, avec quelques notes qui montent. */
function Staff({ className }: { className?: string }) {
  const notes = [
    { x: 64, y: 38 },
    { x: 96, y: 32 },
    { x: 128, y: 26 },
    { x: 160, y: 20 },
    { x: 192, y: 26 },
    { x: 224, y: 14 },
  ]
  return (
    <svg viewBox="0 0 260 56" preserveAspectRatio="none" aria-hidden="true" className={className}>
      {[8, 16, 24, 32, 40].map((y) => (
        <line key={y} x1="4" x2="256" y1={y} y2={y} style={{ stroke: 'var(--outline)', strokeWidth: 1.4, opacity: 0.55 }} />
      ))}
      {/* La clé de sol, stylisée. */}
      <path d="M22 50 C14 44 16 34 24 30 C32 26 34 38 26 40 C18 42 16 24 26 14 C32 8 30 2 26 4 C22 6 22 16 24 26 L28 52" style={{ fill: 'none', stroke: 'var(--outline)', strokeWidth: 2.2, strokeLinecap: 'round' }} />
      {notes.map((note, index) => (
        <g key={index}>
          <ellipse cx={note.x} cy={note.y} rx="6" ry="4.4" transform={`rotate(-20 ${note.x} ${note.y})`} style={{ fill: index % 2 ? 'var(--accent)' : 'var(--outline)' }} />
          <line x1={note.x + 5.4} x2={note.x + 5.4} y1={note.y} y2={note.y - 22} style={{ stroke: 'var(--outline)', strokeWidth: 1.6 }} />
        </g>
      ))}
    </svg>
  )
}

/** Cinéma : un ticket de séance, avec son talon perforé. */
function TicketCard({ item }: { item: CompletionDTO }) {
  const title = item.exploredTitle ?? item.extra?.items[0]
  return (
    <div className="relative flex flex-col">
      <div className="relative flex">
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-4 pr-3">
          <span className="text-12 font-bold tracking-wider uppercase opacity-80">Séance · {formatDay(item.createdAt)}</span>
          <span className="font-display text-22 leading-tight font-extrabold tracking-tight">{title ?? 'Une séance rien qu’à toi'}</span>
        </div>
        {/* Le talon : perforations et numéro de place. */}
        <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-1 border-l-[2.5px] border-dashed border-outline/60 px-2 text-center">
          <Clapperboard size={22} strokeWidth={2.3} aria-hidden="true" />
          <span className="text-11 font-extrabold tracking-wider uppercase">Entrée</span>
          <span className="font-numbers text-15 font-extrabold">{item.duration}&nbsp;min</span>
        </div>
        {/* Les encoches du ticket, en haut et en bas du talon. */}
        <span aria-hidden="true" className="absolute -top-3 right-[68px] h-6 w-6 rounded-pill border-[2.5px] border-outline bg-canvas" />
      </div>
      <div className="relative border-t-[2.5px] border-dashed border-outline/60 p-4">
        <span aria-hidden="true" className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-pill border-[2.5px] border-outline bg-canvas" />
        <span aria-hidden="true" className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-pill border-[2.5px] border-outline bg-canvas" />
        <CardFooter item={item} />
      </div>
    </div>
  )
}

/** Photo qui apparaît en fondu une fois chargée (reflet en attendant). */
function Photo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={cn('relative overflow-hidden rounded-md border-2 border-outline bg-surface-300', !loaded && 'skeleton min-h-60')}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn('w-full object-contain transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', className)}
      />
    </div>
  )
}

function PhotoPendingNote() {
  return (
    <p className="m-2 mb-0 flex items-center gap-2 rounded-sm border-2 border-outline bg-sky-soft px-3 py-2 text-12 font-semibold text-ink">
      <Send size={14} strokeWidth={2.4} className="shrink-0" aria-hidden="true" />
      Envoie la photo au bot&nbsp;: elle viendra se ranger ici.
    </p>
  )
}

/* ------------------------------ Vue détaillée ------------------------------ */

/** Une création en grand, dans la feuille modale. */
function GalleryDetail({ item }: { item: CompletionDTO }) {
  const { state } = useAppState()
  const passion = getPassion(item.passion)
  const Icon = PASSION_ICONS[item.passion]
  const title = item.exploredTitle ?? (item.passion === 'musique' || item.passion === 'cinema' ? item.extra?.items[0] : undefined)
  const fallbackTitle = item.passion === 'dessin' ? 'Ton dessin' : item.passion === 'ecriture' ? 'Ton texte' : item.passion === 'piano' ? 'Ta séance au piano' : 'Ta découverte'
  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Badge variant={PASSION_COLORS[item.passion].badge} tilt="left">
            <Icon aria-hidden="true" />
            {passion.label}
          </Badge>
          <Badge variant="warm" tilt="right">
            <Clock3 aria-hidden="true" />
            <span className="font-numbers">{item.duration} min</span>
          </Badge>
        </div>
        <DialogTitle>{title ?? fallbackTitle}</DialogTitle>
        <DialogDescription>{formatDay(item.createdAt)}</DialogDescription>
      </DialogHeader>

      {item.photoUrl && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
          <Photo src={item.photoUrl} alt={`Dessin : ${item.activityText}`} className="max-h-[55dvh]" />
        </motion.div>
      )}
      {!item.photoUrl && item.photoPending && (
        <Alert variant="info" role="status">
          <Send aria-hidden="true" />
          <AlertDescription>Envoie la photo de ton dessin au bot&nbsp;: elle viendra se ranger ici.</AlertDescription>
        </Alert>
      )}
      {item.text && (
        <Card tone="lilac" className="min-w-0 shrink-0 gap-2 shadow-chip">
          <span aria-hidden="true" className="block h-6 font-display text-46 leading-none font-extrabold">
            “
          </span>
          <blockquote className="font-display text-17 leading-relaxed font-semibold whitespace-pre-wrap [overflow-wrap:anywhere]">{item.text}</blockquote>
        </Card>
      )}

      <Separator />
      <div className="flex flex-col gap-2">
        <CardEyebrow>L’activité</CardEyebrow>
        <p className="text-15 font-semibold text-ink">{item.activityText}</p>
        {item.extra && !title && (
          <div className="flex flex-wrap gap-2">
            {item.extra.items.map((extra) => (
              <Badge key={extra} variant="secondary" size="sm">
                {extra}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <Card tone="good" className="flex-row items-center gap-3 shadow-chip">
        <CoinIcon size={28} />
        <p className="flex-1 text-15 font-semibold">
          <span className="font-numbers font-extrabold">+{item.coins}</span> minutons gagnés
        </p>
      </Card>
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          track('share', { passion: item.passion })
          shareCreation(item, state.me.botUsername)
        }}
      >
        <Share2 aria-hidden="true" />
        Partager à un ami
      </Button>
    </>
  )
}

/* -------------------------------- Chargement ------------------------------- */

function CardSkeleton() {
  return (
    <Card aria-hidden="true">
      <Skeleton className="h-6 w-3/5" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-pill" />
        <Skeleton className="h-4 flex-1" />
      </div>
    </Card>
  )
}

function GallerySkeleton() {
  return (
    <div className="workshop-gallery-grid" role="status" aria-busy="true" aria-label="Chargement de ta galerie">
      {[0,1,2,3].map(index => <div key={index} className="workshop-creation" aria-hidden="true"><Skeleton className="h-32 w-full"/><Skeleton className="mt-2 h-4 w-4/5"/><Skeleton className="h-3 w-1/2"/></div>)}
    </div>
  )
}
