import { ArrowRight, ChevronDown, Clock3, Coins, Maximize2, RotateCcw, Send, SlidersHorizontal, Timer } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { getPassion, type CompletionDTO } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow, cardVariants } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { api, ApiError } from '../api/client.ts'
import { CoinCounter, CoinIcon } from '../components/Coins.tsx'
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { EmptyState } from '../components/Illustration.tsx'
import { Screen } from '../components/Screen.tsx'
import { formatDay, formatMonth, formatNumber, monthKey, plural } from '../lib/format.ts'
import { PASSION_ICONS } from '../lib/icons.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * Tableau de bord : le total de pièces d'or en haut, puis la galerie, une
 * carte par activité réalisée, de la plus récente à la plus ancienne.
 * Toucher une carte l'ouvre en grand. Jamais de calendrier de jours cochés
 * ou manqués.
 */
export function GalleryScreen() {
  const { state, dispatch } = useAppState()
  const { push, reset } = useNavigation()
  const { stats } = state.me

  const [items, setItems] = useState<CompletionDTO[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'idle' | 'more' | 'error'>('loading')
  const [error, setError] = useState<string>()
  const [opened, setOpened] = useState<CompletionDTO>()
  const [detailOpen, setDetailOpen] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)

  const load = useCallback(async (from?: string) => {
    setStatus(from ? 'more' : 'loading')
    try {
      const page = await api.completions(from)
      setItems((previous) => (from ? [...previous, ...page.items] : page.items))
      setCursor(page.nextCursor)
      setStatus('idle')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Impossible de charger ta galerie.')
      setStatus('error')
    }
  }, [])

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
    dispatch({ type: 'newFlow' })
    reset([{ name: 'home' }, { name: 'signal' }])
  }

  const open = (item: CompletionDTO) => {
    haptics.impact('light')
    setOpened(item)
    setDetailOpen(true)
  }

  const view = status === 'loading' ? 'loading' : status === 'error' && items.length === 0 ? 'error' : items.length === 0 ? 'empty' : 'list'

  return (
    <Screen>
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-28 font-semibold text-ink">Ta galerie</h1>
        <Button variant="secondary" size="sm" onClick={() => push({ name: 'passions', mode: 'edit' })}>
          <SlidersHorizontal aria-hidden="true" />
          Mes passions
        </Button>
      </header>

      {/* Le compteur de pièces d'or, en grand. */}
      <Card
        padding="lg"
        className="anim-shine motion-loop mt-6 rounded-lg bg-gradient-to-br from-surface-200 from-40% to-warm-soft"
        style={{ '--shine-duration': '6s' } as React.CSSProperties}
        aria-label="Tes pièces d’or"
        role="region"
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {/* Une petite pile de pièces qui flotte dans le coin. */}
        <span aria-hidden="true" className="absolute top-6 right-6 flex flex-col items-center">
          <span className="motion-loop anim-float" style={{ '--float-duration': '4s' } as React.CSSProperties}>
            <CoinIcon size={30} className="motion-loop anim-coin" />
          </span>
          <span className="-mt-2 flex">
            <CoinIcon size={26} />
            <CoinIcon size={26} className="-ml-2" />
          </span>
        </span>
        <Sparkle size={12} className="motion-loop anim-twinkle absolute top-6 right-16" />
        <Sparkle size={8} color="var(--accent)" className="motion-loop anim-twinkle absolute top-16 right-4" style={{ '--twinkle-delay': '-1.2s' } as React.CSSProperties} />

        <div className="flex flex-col gap-2">
          <CardEyebrow>
            <Coins aria-hidden="true" className="text-warm" />
            Tes pièces d’or
          </CardEyebrow>
          <CoinCounter value={stats.totalCoins} />
        </div>
        <Separator />
        <div className="flex flex-col items-start gap-2">
          <p className="text-13 font-bold text-ink">
            {plural(stats.totalActivities, 'activité réalisée', 'activités réalisées')}
            {stats.monthActivities > 0 && <span className="font-normal text-ink-soft"> · {formatNumber(stats.monthActivities)} ce mois-ci</span>}
          </p>
          <Badge variant="secondary" size="sm">
            <Timer aria-hidden="true" />1 min = 1 pièce
          </Badge>
        </div>
      </Card>

      <div className="mt-8 flex flex-1 flex-col">
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
                <Button className="anim-shine motion-loop" onClick={startFlow} haptic={false}>
                  J’ai envie de scroller
                  <ArrowRight aria-hidden="true" />
                </Button>
              }
            />
          )}
          {view === 'list' && (
            <motion.div key="list" className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {items.map((item, index) => {
                const previous = items[index - 1]
                const newMonth = !previous || monthKey(previous.createdAt) !== monthKey(item.createdAt)
                return (
                  <Fragment key={item.id}>
                    {newMonth && (
                      <h2 className={cn('flex items-center gap-2 text-12 font-bold tracking-wide text-ink-soft uppercase', index > 0 && 'pt-4')}>
                        {formatMonth(item.createdAt)}
                        <span aria-hidden="true" className="h-px flex-1 bg-line" />
                      </h2>
                    )}
                    <motion.button
                      type="button"
                      onClick={() => open(item)}
                      aria-haspopup="dialog"
                      className={cn(cardVariants({ padding: 'none' }), 'block w-full text-left')}
                      initial={{ opacity: 0, y: 28, rotate: 0 }}
                      animate={{ opacity: 1, y: 0, rotate: item.passion === 'dessin' ? (index % 2 ? 1 : -1) : 0 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ delay: Math.min(index % 12, 6) * 0.06, type: 'spring', stiffness: 180, damping: 20 }}
                    >
                      <GalleryCard item={item} />
                    </motion.button>
                  </Fragment>
                )
              })}
              <div ref={sentinel} />
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
        <DialogContent>{opened && <GalleryDetail item={opened} />}</DialogContent>
      </Dialog>
    </Screen>
  )
}

/* --------------------------------- Cartes --------------------------------- */

/** Pied de carte commun : passion, activité, date, pièces gagnées. */
function CardFooter({ item }: { item: CompletionDTO }) {
  const Icon = PASSION_ICONS[item.passion]
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-accent-soft">
        <Icon size={16} className="text-accent" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="line-clamp-2 text-13 text-ink">{item.activityText}</p>
        <p className="text-12 text-ink-soft">
          {getPassion(item.passion).label} · {formatDay(item.createdAt)}
        </p>
      </div>
      <Badge variant="good" size="sm" className="font-mono text-mono-xs">
        +{item.coins}
      </Badge>
    </div>
  )
}

function GalleryCard({ item }: { item: CompletionDTO }) {
  if (item.passion === 'dessin') return <DrawingCard item={item} />
  if (item.passion === 'ecriture' && item.text) return <QuoteCard item={item} text={item.text} />
  return <ExploredCard item={item} />
}

/** Dessin : la photo envoyée, en polaroïd. */
function DrawingCard({ item }: { item: CompletionDTO }) {
  return (
    <>
      {item.photoUrl ? (
        <div className="p-2 pb-0">
          <Photo src={item.photoUrl} alt={`Dessin : ${item.activityText}`} className="max-h-[480px]" />
        </div>
      ) : (
        item.photoPending && <PhotoPendingNote />
      )}
      <div className="p-4">
        <CardFooter item={item} />
      </div>
    </>
  )
}

/** Écriture : le texte, présenté comme une citation. */
function QuoteCard({ item, text }: { item: CompletionDTO; text: string }) {
  const long = text.length > 320
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <span aria-hidden="true" className="block h-6 font-display text-34 leading-none font-semibold text-warm">
          “
        </span>
        <blockquote className={cn('mt-2 text-15 whitespace-pre-line text-ink', long && 'line-clamp-6')}>{text}</blockquote>
        {long && (
          <span className="mt-2 inline-flex items-center gap-1 text-13 font-bold text-accent">
            <Maximize2 size={14} aria-hidden="true" />
            Lire la suite
          </span>
        )}
      </div>
      <Separator />
      <CardFooter item={item} />
    </div>
  )
}

/** Musique, Cinéma (et écriture sans texte) : une carte avec le titre exploré. */
function ExploredCard({ item }: { item: CompletionDTO }) {
  const title = item.exploredTitle ?? item.extra?.items[0]
  return (
    <div className="flex flex-col gap-4 p-4">
      {title && <p className="font-display text-22 font-semibold text-ink">{title}</p>}
      <CardFooter item={item} />
    </div>
  )
}

/** Photo qui apparaît en fondu une fois chargée (reflet en attendant). */
function Photo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={cn('relative overflow-hidden rounded-sm bg-surface-300', !loaded && 'skeleton min-h-60')}>
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
    <p className="flex items-center gap-2 bg-accent-soft px-4 py-2 text-12 text-ink">
      <Send size={14} className="shrink-0 text-accent" aria-hidden="true" />
      Envoie la photo au bot&nbsp;: elle viendra se ranger ici.
    </p>
  )
}

/* ------------------------------ Vue détaillée ------------------------------ */

/** Une création en grand, dans la feuille modale. */
function GalleryDetail({ item }: { item: CompletionDTO }) {
  const passion = getPassion(item.passion)
  const Icon = PASSION_ICONS[item.passion]
  const title = item.exploredTitle ?? (item.passion === 'musique' || item.passion === 'cinema' ? item.extra?.items[0] : undefined)
  const fallbackTitle = item.passion === 'dessin' ? 'Ton dessin' : item.passion === 'ecriture' ? 'Ton texte' : 'Ta découverte'
  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">
            <Icon aria-hidden="true" />
            {passion.label}
          </Badge>
          <Badge variant="soft" className="font-mono">
            <Clock3 aria-hidden="true" />
            {item.duration} min
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
        <Card tone="muted" className="gap-2">
          <span aria-hidden="true" className="block h-6 font-display text-34 leading-none font-semibold text-warm">
            “
          </span>
          <blockquote className="text-15 whitespace-pre-line text-ink">{item.text}</blockquote>
        </Card>
      )}

      <Separator />
      <div className="flex flex-col gap-2">
        <CardEyebrow>L’activité</CardEyebrow>
        <p className="text-14 text-ink">{item.activityText}</p>
        {item.extra && !title && (
          <div className="flex flex-wrap gap-2">
            {item.extra.items.map((extra) => (
              <Badge key={extra} variant="warm">
                {extra}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <Card tone="good" className="flex-row items-center gap-2">
        <CoinIcon size={24} />
        <p className="flex-1 text-13 text-good-ink">
          <span className="font-mono font-bold">+{item.coins}</span> pièces d’or gagnées
        </p>
      </Card>
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
    <div className="flex flex-col gap-4" aria-label="Chargement de ta galerie">
      <Skeleton className="h-4 w-32" />
      <Card padding="none" aria-hidden="true">
        <Skeleton className="h-56 w-full rounded-none" />
        <div className="px-4 pb-4">
          <Skeleton className="h-4 w-4/5" />
        </div>
      </Card>
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}
