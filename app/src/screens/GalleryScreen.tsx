import { ArrowRight, ChevronDown, Clock3, Maximize2, RotateCcw, Send, Share2, SlidersHorizontal, Timer } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { getPassion, type CompletionDTO } from '@scroll-up/shared'
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
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { EmptyState } from '../components/Illustration.tsx'
import { MilestoneProgress } from '../components/Milestones.tsx'
import { PassionProgressGrid } from '../components/Progression.tsx'
import { Screen } from '../components/Screen.tsx'
import { ThemeButton } from '../components/ThemePicker.tsx'
import { formatDay, formatMonth, formatNumber, monthKey, plural } from '../lib/format.ts'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { shareCreation } from '../lib/share.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * Tableau de bord : le total de minutons en haut, la progression par passion,
 * puis la galerie, une carte par activité réalisée, de la plus récente à la plus ancienne.
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
      <header className="flex flex-col gap-4">
        <div className="flex justify-end gap-2">
          <ThemeButton withLabel />
          <Button variant="secondary" size="sm" onClick={() => push({ name: 'passions', mode: 'edit' })}>
            <SlidersHorizontal aria-hidden="true" />
            Mes passions
          </Button>
        </div>
        <h1 className="font-display text-46 font-extrabold tracking-tight text-ink">Ta galerie</h1>
      </header>

      {/* Les minutons, en grand, sur un sticker soleil. */}
      <Card
        tone="warm"
        className="mt-6 flex-row items-center gap-3 px-5 shadow-pop"
        aria-label="Tes minutons"
        role="region"
        initial={{ opacity: 0, y: 16, scale: 0.97, rotate: 2 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: -1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="flex items-baseline gap-2">
            <span className="font-numbers text-80 font-extrabold tracking-tight tabular-nums">{formatNumber(stats.totalCoins)}</span>
            <span className="text-16 font-bold">minutons</span>
          </p>
          <p className="text-13 font-semibold">
            {plural(stats.totalActivities, 'activité réalisée', 'activités réalisées')}
            {stats.monthActivities > 0 && <span className="whitespace-nowrap"> · {formatNumber(stats.monthActivities)} ce mois-ci</span>}
          </p>
          <Badge variant="secondary" size="sm">
            <Timer aria-hidden="true" />1 min = 1 minuton
          </Badge>
        </div>
        {/* Un gros minuton en sticker, qui flotte et fait un tour de temps en temps. */}
        <span aria-hidden="true" className="motion-loop anim-float shrink-0" style={{ '--float-duration': '4s' } as React.CSSProperties}>
          <span className="flex h-20 w-20 rotate-6 items-center justify-center rounded-pill border-[2.5px] border-on-color bg-paper">
            <CoinIcon size={52} className="motion-loop anim-coin" />
          </span>
        </span>
        <Sparkle size={20} color="var(--surface-200)" className="motion-loop anim-twinkle absolute top-3 right-20" />
      </Card>
      {stats.totalCoins > 0 && (
        <motion.div className="mt-4 px-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <MilestoneProgress total={stats.totalCoins} />
        </motion.div>
      )}

      <PassionProgressGrid />

      {(view === 'list' || view === 'loading') && <h2 className="mt-8 font-display text-26 font-extrabold tracking-tight text-ink">Tes créations</h2>}
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
                      className={cn(cardVariants({ padding: 'none', tone: CARD_TONES[item.passion] }), 'block w-full text-left transition-shadow duration-150 active:shadow-press')}
                      initial={{ opacity: 0, y: 28, rotate: 0 }}
                      animate={{ opacity: 1, y: 0, rotate: index % 2 ? 1.2 : -1.2 }}
                      whileTap={PRESSED}
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

/** Fond de chaque carte : le texte en lilas, les découvertes à la couleur de leur passion, les dessins en polaroïd blanc. */
const CARD_TONES = { dessin: 'default', ecriture: 'lilac', musique: 'good', cinema: 'warm' } as const

/** Pied de carte commun : passion, activité, date, minutons gagnés. */
function CardFooter({ item }: { item: CompletionDTO }) {
  const Icon = PASSION_ICONS[item.passion]
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border-2 border-on-color bg-paper">
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
        <span aria-hidden="true" className="block h-6 font-display text-46 leading-none font-extrabold">
          “
        </span>
        <blockquote className={cn('mt-2 font-display text-17 leading-snug font-semibold whitespace-pre-line', long && 'line-clamp-6')}>{text}</blockquote>
        {long && (
          <span className="mt-2 inline-flex items-center gap-1 text-13 font-bold underline decoration-2 underline-offset-4">
            <Maximize2 size={14} aria-hidden="true" />
            Lire la suite
          </span>
        )}
      </div>
      <Separator className="bg-outline/20" />
      <CardFooter item={item} />
    </div>
  )
}

/** Musique, Cinéma (et écriture sans texte) : une carte avec le titre exploré. */
function ExploredCard({ item }: { item: CompletionDTO }) {
  const title = item.exploredTitle ?? item.extra?.items[0]
  return (
    <div className="flex flex-col gap-4 p-4">
      {title && <p className="font-display text-26 font-extrabold tracking-tight">{title}</p>}
      <CardFooter item={item} />
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
  const fallbackTitle = item.passion === 'dessin' ? 'Ton dessin' : item.passion === 'ecriture' ? 'Ton texte' : 'Ta découverte'
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
        <Card tone="lilac" className="gap-2 shadow-chip">
          <span aria-hidden="true" className="block h-6 font-display text-46 leading-none font-extrabold">
            “
          </span>
          <blockquote className="font-display text-17 leading-snug font-semibold whitespace-pre-line">{item.text}</blockquote>
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
