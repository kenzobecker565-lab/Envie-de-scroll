import { BellRing, Check, ChevronRight, LoaderCircle, MessageCircleHeart, Music2, Settings2, SlidersHorizontal, Smartphone, Trash2, UserPlus } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ambianceCredits, formatClock, isScrollMoment, SCROLL_MOMENT_INFO, SCROLL_MOMENTS } from '@scroll-up/shared'
import { Button, PRESSED } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { api, ApiError, track } from '../api/client.ts'
import { setAmbientEnabled, useAmbientEnabled } from '../lib/ambient.ts'
import { homeScreenConfirm, homeScreenView, type HomeScreenState } from '../lib/homeScreen.ts'
import { MOMENT_STYLE } from '../lib/icons.ts'
import { invite } from '../lib/share.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { checkHomeScreen, haptics, requestHomeScreen, supports, telegram } from '../telegram/webApp.ts'
import { AmbiancePicker } from './AmbiancePicker.tsx'
import { ThemeGrid } from './ThemePicker.tsx'

/**
 * Le bouton « Réglages » de l'accueil, et sa feuille : le style de l'app,
 * la musique d'ambiance, les passions, les relances du bot, inviter un ami,
 * donner son avis.
 */
export function SettingsButton() {
  const { push } = useNavigation()
  return <Button variant="secondary" size="icon" onClick={() => { track('settings_open'); push({ name: 'profile' }) }} aria-label="Mon profil et mes réglages"><Settings2 aria-hidden="true" /></Button>
}

export function SettingsContent({ onEditPassions, onFeedback, onErase, embedded = false }: { embedded?: boolean; onEditPassions: () => void; onFeedback: () => void; onErase: () => void }) {
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
      {!embedded && <DialogHeader>
        <DialogTitle>Réglages</DialogTitle>
        <DialogDescription>Tout s’applique tout de suite.</DialogDescription>
      </DialogHeader>}

      <details className="flex flex-col gap-3"><summary className="font-display text-22 font-extrabold">Apparence</summary><section className="mt-3 flex flex-col gap-3" aria-labelledby="settings-style">
        <h2 id="settings-style" className="text-12 font-bold tracking-wider text-ink-soft uppercase">
          Ton style
        </h2>
        <ThemeGrid />
      </section></details>

      <Separator />

      <details><summary className="font-display text-22 font-extrabold">Musique</summary><section className="mt-3 flex flex-col gap-3" aria-labelledby="settings-music">
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
      </section></details>

      <Separator />

      <div className="flex flex-col gap-3">
        <Row icon={<SlidersHorizontal aria-hidden="true" />} title="Mes passions" description={`${user.passions.length} choisie${user.passions.length > 1 ? 's' : ''}`} onClick={onEditPassions} />
        <details><summary className="font-display text-22 font-extrabold">Relances</summary><div className="mt-3 flex flex-col gap-3"><Row
          icon={<BellRing aria-hidden="true" />}
          title="Petites relances"
          description={
            user.scrollMoment
              ? `Un message du bot vers ${formatClock(SCROLL_MOMENT_INFO[user.scrollMoment].remindAt)}, juste avant ton moment de scroll. Seulement les jours sans activité.`
              : 'Un message du bot vers 19 h, seulement les jours sans activité.'
          }
          onClick={toggleReminders}
          trailing={<Switch on={user.remindersEnabled} busy={saving} />}
          role="switch"
          checked={user.remindersEnabled}
          live
        />
        {user.remindersEnabled && <MomentPicker />}</div></details>
        <details><summary className="font-display text-22 font-extrabold">Aide et partage</summary><div className="mt-3 flex flex-col gap-3">{telegram && <HomeScreenRow />}
        <Row icon={<UserPlus aria-hidden="true" />} title="Inviter un ami" description="Partage Scroll-up dans une conversation Telegram." onClick={sendInvite} />
        <Row icon={<MessageCircleHeart aria-hidden="true" />} title="Donner mon avis" description="Ce qui te plaît, ce qui te gêne, tes idées." onClick={onFeedback} tone="accent" /></div></details>
      </div>

      <Separator />

      <details><summary className="font-display text-22 font-extrabold">Mes données</summary><div className="mt-3"><Row icon={<Trash2 aria-hidden="true" />} title="Effacer mes données" description="Tout supprimer et refaire l’inscription depuis le début." onClick={onErase} /></div></details>

      <p className="text-center text-12 text-ink-soft">Scroll-up · version de test. Merci de faire partie des premiers&nbsp;!</p>
      <p className="text-center text-11 text-ink-faint">Musiques&nbsp;: {ambianceCredits()}</p>
    </>
  )
}

/**
 * Le raccourci sur l'écran d'accueil (Telegram 8+). Toucher la ligne ouvre une
 * fenêtre de Telegram (« Ajouter »), puis celle du téléphone ; la ligne passe à
 * « Sur ton écran d'accueil » quand Telegram confirme, et dit quoi faire quand
 * l'ajout est impossible ici.
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

  const platform = telegram?.platform ?? ''
  const add = () => {
    haptics.impact('medium')
    track('home_screen')
    stopListening.current?.()
    window.clearTimeout(recheck.current)
    stopListening.current = requestHomeScreen({
      // La fenêtre native de Telegram : sans elle, Telegram Android ignore la demande.
      confirm: homeScreenConfirm(platform),
      onSent: () => {
        setState('adding')
        // Certains téléphones ne confirment jamais : on revérifie au bout de quelques secondes.
        recheck.current = window.setTimeout(() => {
          void checkHomeScreen().then((status) => {
            if (status === 'added') {
              stopListening.current?.()
              markAdded()
              return
            }
            // Android sait dire si l'icône est là : « missed » après la demande veut dire que
            // le téléphone l'a bloquée sans rien afficher (autorisation manquante).
            const next: HomeScreenState = status === 'unsupported' ? 'failed' : status === 'missed' ? 'silent' : status
            if (next === 'silent') track('home_screen_silent')
            setState((current) => (current === 'adding' ? next : current))
          })
        }, 8000)
      },
      onDone: (result) => {
        window.clearTimeout(recheck.current)
        if (result === 'added') markAdded()
        else if (result === 'failed') {
          haptics.warning()
          setState('failed')
        }
        // « cancelled » : on a renoncé dans la fenêtre, la ligne reste telle quelle.
      },
    })
  }

  const view = homeScreenView(state, { supported: supports.homeScreen, platform })
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

/** Le moment où l'on scrolle le plus : la relance du bot arrive juste avant. */
function MomentPicker() {
  const { state, dispatch } = useAppState()
  const { user } = state.me

  const choose = (value: string) => {
    if (!isScrollMoment(value) || value === user.scrollMoment) return
    haptics.selection()
    dispatch({ type: 'user', user: { ...user, scrollMoment: value } })
    api
      .updateSettings({ scrollMoment: value })
      .then(({ user: updated }) => dispatch({ type: 'user', user: updated }))
      .catch(() => dispatch({ type: 'user', user }))
  }

  return (
    <div className="flex flex-col gap-2 pl-1">
      <span id="settings-moment" className="text-13 font-bold text-ink-soft">
        Tu scrolles surtout…
      </span>
      <ToggleGroup type="single" variant="chip" value={user.scrollMoment ?? ''} onValueChange={choose} className="grid grid-cols-4 gap-2" aria-labelledby="settings-moment">
        {SCROLL_MOMENTS.map((id) => {
          const { icon: Icon, on } = MOMENT_STYLE[id]
          return (
            <ToggleGroupItem key={id} value={id} className={cn('min-h-16 flex-col justify-center gap-1 rounded-md px-1 text-13', on)} whileTap={{ scale: 0.94 }}>
              <Icon aria-hidden="true" />
              {SCROLL_MOMENT_INFO[id].short}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}

/**
 * « Effacer mes données » : une confirmation, puis tout part (créations,
 * minutons, parcours, projets, réglages, et ce qui est gardé sur le
 * téléphone). L'app redémarre sur l'inscription.
 */
export function EraseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const erase = async () => {
    setBusy(true)
    setError(undefined)
    haptics.impact('heavy')
    try {
      await api.deleteMe()
      try {
        for (const key of Object.keys(window.localStorage)) if (key.startsWith('scroll-up:')) window.localStorage.removeItem(key)
      } catch {
        // Stockage indisponible : rien à effacer sur le téléphone.
      }
      haptics.success()
      window.location.reload()
    } catch (caught) {
      haptics.error()
      setError(caught instanceof ApiError ? caught.message : 'Oups, l’effacement a échoué. Réessaie dans un instant.')
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tout effacer&nbsp;?</DialogTitle>
          <DialogDescription>
            Tes créations, tes minutons, tes parcours, tes projets et tes réglages seront supprimés. L’app repartira de l’inscription. C’est définitif.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-14 font-semibold text-accent-strong">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={() => void erase()} disabled={busy} aria-busy={busy}>
            {busy ? <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
            {busy ? 'Effacement…' : 'Tout effacer'}
          </Button>
          <Button variant="ghost" size="md" className="w-full" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
