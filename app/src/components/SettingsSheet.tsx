import { BellRing, Check, ChevronRight, LoaderCircle, MessageCircleHeart, Music2, Settings2, SlidersHorizontal, Smartphone, UserPlus } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ambianceCredits } from '@scroll-up/shared'
import { Button, PRESSED } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { api, track } from '../api/client.ts'
import { setAmbientEnabled, useAmbientEnabled } from '../lib/ambient.ts'
import { homeScreenView, type HomeScreenState } from '../lib/homeScreen.ts'
import { invite } from '../lib/share.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { checkHomeScreen, haptics, requestHomeScreen, supports, telegram } from '../telegram/webApp.ts'
import { AmbiancePicker } from './AmbiancePicker.tsx'
import { FeedbackDialog } from './FeedbackDialog.tsx'
import { ThemeGrid } from './ThemePicker.tsx'

/**
 * Le bouton « Réglages » de l'accueil, et sa feuille : le style de l'app,
 * la musique d'ambiance, les passions, les relances du bot, inviter un ami,
 * donner son avis.
 */
export function SettingsButton() {
  const [open, setOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const { push } = useNavigation()

  const openSheet = () => {
    track('settings_open')
    setOpen(true)
  }

  return (
    <>
      <Button variant="secondary" size="icon" onClick={openSheet} aria-haspopup="dialog" aria-label="Réglages : thème, passions, relances">
        <Settings2 aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <SettingsContent
            onEditPassions={() => {
              setOpen(false)
              push({ name: 'passions', mode: 'edit' })
            }}
            onFeedback={() => {
              setOpen(false)
              setFeedbackOpen(true)
            }}
          />
        </DialogContent>
      </Dialog>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} context="réglages" />
    </>
  )
}

function SettingsContent({ onEditPassions, onFeedback }: { onEditPassions: () => void; onFeedback: () => void }) {
  const { state, dispatch } = useAppState()
  const { user } = state.me
  const [saving, setSaving] = useState(false)
  const music = useAmbientEnabled()

  const toggleReminders = () => {
    const next = !user.remindersEnabled
    haptics.selection()
    setSaving(true)
    dispatch({ type: 'user', user: { ...user, remindersEnabled: next } })
    api
      .updateSettings({ remindersEnabled: next })
      .then(({ user: updated }) => dispatch({ type: 'user', user: updated }))
      .catch(() => dispatch({ type: 'user', user: { ...user, remindersEnabled: !next } }))
      .finally(() => setSaving(false))
  }

  const sendInvite = () => {
    haptics.impact('light')
    track('invite')
    invite(state.me.botUsername)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Réglages</DialogTitle>
        <DialogDescription>Tout s’applique tout de suite.</DialogDescription>
      </DialogHeader>

      <section className="flex flex-col gap-3" aria-labelledby="settings-style">
        <h2 id="settings-style" className="text-12 font-bold tracking-wider text-ink-soft uppercase">
          Ton style
        </h2>
        <ThemeGrid />
      </section>

      <Separator />

      <section className="flex flex-col gap-3" aria-labelledby="settings-music">
        <h2 id="settings-music" className="text-12 font-bold tracking-wider text-ink-soft uppercase">
          Ta musique
        </h2>
        <Row
          icon={<Music2 aria-hidden="true" />}
          title="Musique d’ambiance"
          description="Tout doux, en fond. Elle se tait pendant les activités Musique et Cinéma."
          onClick={() => {
            haptics.selection()
            if (music) track('music_off')
            setAmbientEnabled(!music)
          }}
          trailing={<Switch on={music} busy={false} />}
          role="switch"
          checked={music}
        />
        <AmbiancePicker />
      </section>

      <Separator />

      <div className="flex flex-col gap-3">
        <Row icon={<SlidersHorizontal aria-hidden="true" />} title="Mes passions" description={`${user.passions.length} choisie${user.passions.length > 1 ? 's' : ''} sur 4`} onClick={onEditPassions} />
        <Row
          icon={<BellRing aria-hidden="true" />}
          title="Petites relances"
          description="Un message du bot vers 19 h, seulement les jours sans activité."
          onClick={toggleReminders}
          trailing={<Switch on={user.remindersEnabled} busy={saving} />}
          role="switch"
          checked={user.remindersEnabled}
        />
        {telegram && <HomeScreenRow />}
        <Row icon={<UserPlus aria-hidden="true" />} title="Inviter un ami" description="Partage Scroll-up dans une conversation Telegram." onClick={sendInvite} />
        <Row icon={<MessageCircleHeart aria-hidden="true" />} title="Donner mon avis" description="Ce qui te plaît, ce qui te gêne, tes idées." onClick={onFeedback} tone="accent" />
      </div>

      <p className="text-center text-12 text-ink-soft">Scroll-up · version de test. Merci de faire partie des premiers&nbsp;!</p>
      <p className="text-center text-11 text-ink-faint">Musiques&nbsp;: {ambianceCredits()}</p>
    </>
  )
}

/**
 * Le raccourci sur l'écran d'accueil (Telegram 8+). Toucher la ligne ouvre la
 * fenêtre de Telegram ; elle passe à « Sur ton écran d'accueil » quand Telegram
 * confirme, et dit quoi faire quand l'ajout est impossible ici.
 */
function HomeScreenRow() {
  const [state, setState] = useState<HomeScreenState>('checking')
  const stopListening = useRef<() => void>(undefined)
  const recheck = useRef<number>(undefined)

  useEffect(() => {
    let alive = true
    void checkHomeScreen().then((status) => {
      if (alive) setState((current) => (current === 'checking' ? status : current))
    })
    return () => {
      alive = false
      stopListening.current?.()
      window.clearTimeout(recheck.current)
    }
  }, [])

  const markAdded = () => {
    haptics.success()
    track('home_screen_added')
    setState('added')
  }

  const add = () => {
    haptics.impact('medium')
    track('home_screen')
    setState('adding')
    stopListening.current?.()
    stopListening.current = requestHomeScreen((result) => {
      window.clearTimeout(recheck.current)
      if (result === 'added') markAdded()
      else {
        haptics.warning()
        setState('failed')
      }
    })
    // Certains téléphones ne confirment jamais : on revérifie au bout de quelques secondes.
    window.clearTimeout(recheck.current)
    recheck.current = window.setTimeout(() => {
      void checkHomeScreen().then((status) => {
        if (status === 'added') {
          stopListening.current?.()
          markAdded()
        } else setState((current) => (current === 'adding' ? (status === 'unsupported' ? 'failed' : status) : current))
      })
    }, 6000)
  }

  const view = homeScreenView(state, { supported: supports.homeScreen, platform: telegram?.platform ?? '' })
  return (
    <Row
      icon={<Smartphone aria-hidden="true" />}
      title={view.title}
      description={view.description}
      onClick={view.action ? add : undefined}
      live
      trailing={
        view.done ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border-2 border-outline bg-good text-on-color">
            <Check className="size-4" strokeWidth={3} aria-hidden="true" />
          </span>
        ) : state === 'adding' ? (
          <LoaderCircle className="size-5 shrink-0 text-ink-soft motion-safe:animate-spin" aria-hidden="true" />
        ) : undefined
      }
    />
  )
}

/** Une ligne de réglage, en petit sticker cliquable (ou une simple information, sans `onClick`). */
function Row({
  icon,
  title,
  description,
  onClick,
  trailing,
  tone,
  role,
  checked,
  live,
}: {
  icon: ReactNode
  title: string
  description: string
  onClick?: () => void
  trailing?: ReactNode
  tone?: 'accent'
  role?: 'switch'
  checked?: boolean
  /** La description change selon l'état : les lecteurs d'écran l'annoncent. */
  live?: boolean
}) {
  const className = cn('flex w-full items-center gap-3 rounded-md border-[2.5px] border-outline bg-card p-3 text-left shadow-chip', tone === 'accent' && 'bg-accent-soft')
  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border-2 border-outline bg-surface-100 text-ink [&>svg]:size-5">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-17 font-extrabold tracking-tight text-ink">{title}</span>
        <span className="text-13 text-ink-soft" aria-live={live ? 'polite' : undefined}>
          {description}
        </span>
      </span>
      {trailing ?? (onClick && <ChevronRight className="size-5 shrink-0 text-ink-soft" aria-hidden="true" />)}
    </>
  )
  if (!onClick) return <div className={className}>{content}</div>
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={PRESSED}
      role={role}
      aria-checked={role === 'switch' ? checked : undefined}
      className={cn(className, 'transition-shadow duration-150 active:shadow-press')}
    >
      {content}
    </motion.button>
  )
}

/** Interrupteur en sticker : tomate quand il est allumé. */
function Switch({ on, busy }: { on: boolean; busy: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn('relative h-8 w-14 shrink-0 rounded-pill border-2 border-outline transition-colors duration-200', on ? 'bg-good' : 'bg-surface-300', busy && 'opacity-70')}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 h-6 w-6 rounded-pill border-2 border-outline bg-paper"
        animate={{ x: on ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </span>
  )
}
