import { Send, SlidersHorizontal } from 'lucide-react'
import { motion } from 'motion/react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { getPassion, type CompletionDTO } from '@scroll-up/shared'
import { api, ApiError } from '../api/client.ts'
import { Button } from '../components/Button.tsx'
import { CoinCounter, CoinIcon } from '../components/Coins.tsx'
import { Illustration } from '../components/Illustration.tsx'
import { Screen } from '../components/Screen.tsx'
import { Skeleton } from '../components/Skeleton.tsx'
import { cn } from '../lib/cn.ts'
import { formatDay, formatMonth, formatNumber, monthKey, plural } from '../lib/format.ts'
import { PASSION_ICONS } from '../lib/icons.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * Tableau de bord : le total de pièces d'or en haut, puis la galerie, une
 * carte par activité réalisée, de la plus récente à la plus ancienne.
 * Jamais de calendrier de jours cochés ou manqués.
 */
export function GalleryScreen() {
  const { state, dispatch } = useAppState()
  const { push, reset } = useNavigation()
  const { stats } = state.me

  const [items, setItems] = useState<CompletionDTO[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'idle' | 'more' | 'error'>('loading')
  const [error, setError] = useState<string>()
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

  return (
    <Screen>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-28 font-semibold text-ink">Ta galerie</h1>
        <Button
          variant="secondary"
          className="h-10 shrink-0 px-4 text-13"
          icon={<SlidersHorizontal size={16} aria-hidden="true" />}
          onClick={() => push({ name: 'passions', mode: 'edit' })}
        >
          Mes passions
        </Button>
      </div>

      {/* Le compteur de pièces d'or, en grand. */}
      <section className="mt-6 rounded-lg bg-surface-200 p-6 shadow-card" aria-label="Tes pièces d’or">
        <div className="flex items-center justify-between">
          <span className="text-11 font-bold tracking-wide text-ink-soft uppercase">Tes pièces d’or</span>
          <CoinIcon size={28} />
        </div>
        <CoinCounter value={stats.totalCoins} className="mt-4" />
        <p className="mt-4 text-12 text-ink-soft">
          {plural(stats.totalActivities, 'activité réalisée', 'activités réalisées')}
          {stats.monthActivities > 0 && ` · ${formatNumber(stats.monthActivities)} ce mois-ci`}
        </p>
        <p className="mt-1 text-11 text-ink-soft">1 minute d’activité = 1 pièce d’or</p>
      </section>

      <div className="mt-8 flex-1">
        {status === 'loading' ? (
          <GallerySkeleton />
        ) : status === 'error' && items.length === 0 ? (
          <div className="rounded-md bg-warm-soft p-4">
            <p className="text-14 text-warm-ink">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => void load()}>
              Réessayer
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyGallery onStart={startFlow} />
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => {
              const previous = items[index - 1]
              const newMonth = !previous || monthKey(previous.createdAt) !== monthKey(item.createdAt)
              return (
                <Fragment key={item.id}>
                  {newMonth && <h2 className="pt-2 text-12 font-bold tracking-wide text-ink-soft uppercase">{formatMonth(item.createdAt)}</h2>}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(index % 12, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <GalleryCard item={item} />
                  </motion.div>
                </Fragment>
              )
            })}
            <div ref={sentinel} />
            {status === 'more' && <CardSkeleton />}
            {status === 'error' && (
              <Button variant="ghost" className="w-full" onClick={() => void load(cursor ?? undefined)}>
                Charger la suite
              </Button>
            )}
          </div>
        )}
      </div>
    </Screen>
  )
}

function EmptyGallery({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Illustration name="empty-gallery" className="aspect-[550/568] w-48" />
      <h2 className="mt-6 font-display text-22 font-semibold text-ink">Ta galerie t’attend.</h2>
      <p className="mt-2 max-w-xs text-14 text-ink-soft">Chaque envie de scroller transformée viendra s’afficher ici&nbsp;: tes dessins, tes textes, tes découvertes.</p>
      <Button className="mt-6" onClick={onStart} haptic={false}>
        J’ai envie de scroller
      </Button>
    </div>
  )
}

/** Pied de carte commun : passion, activité, date, pièces gagnées. */
function CardFooter({ item }: { item: CompletionDTO }) {
  const Icon = PASSION_ICONS[item.passion]
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-accent-soft">
        <Icon size={14} className="text-accent" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-13 text-ink-soft">{item.activityText}</p>
        <p className="mt-1 text-12 text-ink-soft">
          {getPassion(item.passion).label} · {formatDay(item.createdAt)}
        </p>
      </div>
      <span className="shrink-0 rounded-pill bg-good-soft px-2 py-1 font-mono text-mono-xs font-bold text-good-ink">+{item.coins}</span>
    </div>
  )
}

function GalleryCard({ item }: { item: CompletionDTO }) {
  if (item.passion === 'dessin') return <DrawingCard item={item} />
  if (item.passion === 'ecriture' && item.text) return <QuoteCard item={item} text={item.text} />
  return <ExploredCard item={item} />
}

/** Dessin : la photo envoyée. */
function DrawingCard({ item }: { item: CompletionDTO }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <article className="overflow-hidden rounded-md bg-surface-200 shadow-card">
      {item.photoUrl ? (
        <div className={cn('relative bg-surface-300', !loaded && 'skeleton min-h-60')}>
          <img
            src={item.photoUrl}
            alt={`Dessin : ${item.activityText}`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={cn('max-h-[480px] w-full object-contain transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
          />
        </div>
      ) : (
        item.photoPending && (
          <p className="flex items-center gap-2 bg-accent-soft px-4 py-2 text-12 text-ink">
            <Send size={14} className="text-accent" aria-hidden="true" />
            Envoie la photo au bot&nbsp;: elle viendra se ranger ici.
          </p>
        )
      )}
      <div className="p-4">
        <CardFooter item={item} />
      </div>
    </article>
  )
}

/** Écriture : le texte, présenté comme une citation. */
function QuoteCard({ item, text }: { item: CompletionDTO; text: string }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 320
  return (
    <article className="rounded-md bg-surface-200 p-4 shadow-card">
      <span aria-hidden="true" className="block h-6 font-display text-34 leading-none font-semibold text-warm">
        “
      </span>
      <blockquote className={cn('mt-2 text-15 whitespace-pre-line text-ink', long && !open && 'line-clamp-6')}>{text}</blockquote>
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-2 text-13 font-bold text-accent">
          {open ? 'Réduire' : 'Lire la suite'}
        </button>
      )}
      <div className="mt-4 border-t border-line pt-4">
        <CardFooter item={item} />
      </div>
    </article>
  )
}

/** Musique, Cinéma (et écriture sans texte) : une carte avec le titre exploré. */
function ExploredCard({ item }: { item: CompletionDTO }) {
  const title = item.exploredTitle ?? item.extra?.items[0]
  return (
    <article className="rounded-md bg-surface-200 p-4 shadow-card">
      {title && <p className="mb-4 font-display text-22 font-semibold text-ink">{title}</p>}
      <CardFooter item={item} />
    </article>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-md bg-surface-200 p-4 shadow-card" aria-hidden="true">
      <Skeleton className="h-6 w-3/5" />
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-pill" />
        <Skeleton className="h-4 flex-1" />
      </div>
    </div>
  )
}

function GallerySkeleton() {
  return (
    <div className="space-y-4" aria-label="Chargement de ta galerie">
      <Skeleton className="h-4 w-32" />
      <div className="rounded-md bg-surface-200 shadow-card" aria-hidden="true">
        <Skeleton className="h-56 w-full rounded-t-md rounded-b-none" />
        <div className="p-4">
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}
