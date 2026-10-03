import { BellRing, Check, ChevronRight, Clock3, Heart, ShieldCheck, LoaderCircle, MessageCircleHeart, Music2, Settings2, Smartphone, Trash2, UserPlus } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ambianceCredits, formatClock, isScrollMoment, SCROLL_MOMENT_INFO, SCROLL_MOMENTS } from '@scroll-up/shared'
import { Button, PRESSED } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

/**
 * Réglages quotidiens, aide et données : utilisés dans leur page dédiée.
 */
export function SettingsButton() {
  const { push } = useNavigation()
  return <Button variant="secondary" size="icon" onClick={() => { push({ name: 'settings' }) }} aria-label="Mes réglages"><Settings2 aria-hidden="true" /></Button>
}

export function SettingsContent({ onEditPassions, onFeedback, onErase, embedded = false }: { embedded?: boolean; onEditPassions: () => void; onFeedback: () => void; onErase: () => void }) {
  const { state, dispatch } = useAppState()
  const { user } = state.me
  const [saving, setSaving] = useState(false)
  const [momentOpen, setMomentOpen] = useState(false)
  const [musicOpen, setMusicOpen] = useState(false)
  const [error, setError] = useState<string>()
  const music = useAmbientEnabled()

  const toggleReminders = () => {
    if (saving) return
    setError(undefined)
    const next = !user.remindersEnabled
    haptics.selection()
    setSaving(true)
    dispatch({ type: 'user', user: { ...user, remindersEnabled: next } })
    api
      .updateSettings({ remindersEnabled: next })
      .then(({ user: updated }) => dispatch({ type: 'user', user: updated }))
      .catch(() => { dispatch({ type: 'user', user: { ...user, remindersEnabled: !next } }); setError('La relance n’a pas pu être enregistrée. Réessaie.') })
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

      <section className="studio-settings-group" aria-labelledby="settings-daily">
        <h2 id="settings-daily">Mon quotidien</h2>
        <Row icon={<Heart aria-hidden="true"/>} title="Mes passions" description={`${user.passions.length} choisie${user.passions.length > 1 ? 's' : ''}`} onClick={onEditPassions}/>
        <Row icon={<Music2 aria-hidden="true"/>} title="Musique d’ambiance" description="Un fond musical pendant tes découvertes." onClick={() => { haptics.selection(); if (music) track('music_off'); setAmbientEnabled(!music) }} trailing={<Switch on={music} busy={false}/>} role="switch" checked={music}/>
        {music && <><button type="button" className="studio-settings-disclosure" aria-expanded={musicOpen} onClick={() => setMusicOpen(value => !value)}>Choisir ma musique <ChevronRight size={17}/></button>{musicOpen && <div className="studio-settings-picker"><AmbiancePicker/></div>}</>}
        <Row icon={<BellRing aria-hidden="true"/>} title="Relances" description="Un message du bot les jours sans activité." onClick={toggleReminders} disabled={saving} trailing={<Switch on={user.remindersEnabled} busy={saving}/>} role="switch" checked={user.remindersEnabled} live/>
        {user.remindersEnabled && <><Row icon={<Clock3 aria-hidden="true"/>} title="Heure du rappel" description={user.scrollMoment ? formatClock(SCROLL_MOMENT_INFO[user.scrollMoment].remindAt) : '19 h'} onClick={() => setMomentOpen(value => !value)} trailing={<span className="studio-reminder-time">{user.scrollMoment ? formatClock(SCROLL_MOMENT_INFO[user.scrollMoment].remindAt) : '19 h'}<ChevronRight size={18}/></span>}/>{momentOpen && <div className="studio-settings-picker"><MomentPicker/></div>}</>}
        {error && <p className="studio-settings-error" role="alert">{error}</p>}
      </section>
      <section className="studio-settings-group" aria-labelledby="settings-help">
        <h2 id="settings-help">Aide et partage</h2>
        {telegram && <HomeScreenRow/>}
        <Row icon={<UserPlus aria-hidden="true"/>} title="Inviter un ami" description="Partage Swipe Up dans Telegram." onClick={sendInvite}/>
        <Row icon={<MessageCircleHeart aria-hidden="true"/>} title="Donner mon avis" description="Tes idées pour améliorer l’application." onClick={onFeedback}/>
      </section>
      <section className="studio-settings-group" aria-labelledby="settings-data">
        <h2 id="settings-data">Mes données</h2>
        <Row icon={<ShieldCheck aria-hidden="true"/>} title="Gérer mes données" description="Effacer mon compte et mes créations." onClick={onErase}/>
      </section>

      <p className="text-center text-12 text-ink-soft">Swipe Up · version de test. Merci de faire partie des premiers&nbsp;!</p>
      <details className="studio-settings-credits"><summary>Crédits musicaux</summary><p>Musiques&nbsp;: {ambianceCredits()}</p></details>
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const choose = (value: string) => {
    if (saving || !isScrollMoment(value) || value === user.scrollMoment) return
    setSaving(true)
    setError(undefined)
    haptics.selection()
    dispatch({ type: 'user', user: { ...user, scrollMoment: value } })
    api
      .updateSettings({ scrollMoment: value })
      .then(({ user: updated }) => dispatch({ type: 'user', user: updated }))
      .catch(() => { dispatch({ type: 'user', user }); setError('Le nouvel horaire n’a pas pu être enregistré.') })
      .finally(() => setSaving(false))
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
            <ToggleGroupItem key={id} value={id} disabled={saving} className={cn('min-h-16 flex-col justify-center gap-1 rounded-md px-1 text-13', on)} whileTap={{ scale: 0.94 }}>
              <Icon aria-hidden="true" />
              {SCROLL_MOMENT_INFO[id].short}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      {error && <p role="alert" className="text-12 text-accent-strong">{error}</p>}
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
  disabled,
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
  disabled?: boolean
}) {
  const className = cn('studio-settings-row flex w-full items-center gap-3 rounded-md border-[2.5px] border-outline bg-card p-3 text-left shadow-chip', tone === 'accent' && 'bg-accent-soft')
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
      disabled={disabled}
      aria-busy={disabled || undefined}
      aria-checked={role === 'switch' ? checked : undefined}
      className={cn(className, 'transition-shadow duration-150 active:shadow-press')}
    >
      {content}
    </motion.button>
  )
}

/** Purple switch shared by music and reminders. */
function Switch({ on, busy }: { on: boolean; busy: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn('studio-settings-switch relative h-8 w-14 shrink-0 rounded-pill border-2 border-outline transition-colors duration-200', on ? 'bg-good' : 'bg-surface-300', busy && 'opacity-70')}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 h-6 w-6 rounded-pill border-2 border-outline bg-paper"
        animate={{ x: on ? 19 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </span>
  )
}
