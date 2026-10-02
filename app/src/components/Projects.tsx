import { ArrowRight, Check, FolderOpen, Play, Plus, RotateCcw, Share2, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { getPassion, type CompletionDTO, type PassionId, type ProjectDetailResponse, type ProjectDTO } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, PRESSED } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { api, ApiError, track } from '../api/client.ts'
import { formatDay, formatMinutes, plural } from '../lib/format.ts'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { shareProject } from '../lib/share.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'
import { Confetti } from './Confetti.tsx'

/**
 * Les projets : des créations d'une même passion rangées ensemble, avec un
 * objectif si on veut. On en crée un depuis la galerie (ou en rangeant une
 * création), on y range ses créations à la confirmation ou depuis la
 * galerie, et « Continuer ce projet » lance une activité qui s'y rangera
 * d'elle-même. Un projet terminé se fête et se partage.
 */

export const MAX_PROJECT_NAME = 40
const GOALS = [5, 10, 20] as const

/** Des idées de noms, pour ne pas partir d'une page blanche. */
const IDEAS: Record<PassionId, string[]> = {
  dessin: ['Mon carnet de croquis', 'Les objets de ma chambre', 'Portraits de famille'],
  ecriture: ['Ma nouvelle', 'Mon journal de bord', 'Poèmes du quotidien'],
  musique: ['Le tour du jazz', 'Les années 80', 'Ma playlist idéale'],
  cinema: ['Les films de Miyazaki', 'Les grands classiques', 'Le cinéma coréen'],
  piano: ['Mon répertoire', 'Les airs de mon enfance', 'Les musiques de films'],
}

/** Actifs d'abord (du plus récent au plus ancien), puis les terminés. */
function sorted(projects: readonly ProjectDTO[]): ProjectDTO[] {
  return [...projects].sort((a, b) => Number(Boolean(a.finishedAt)) - Number(Boolean(b.finishedAt)) || b.createdAt.localeCompare(a.createdAt))
}

/* --------------------------------------------------------------- galerie */

export function ProjectsSection({ passion }: { passion?: PassionId }) {
  const { state } = useAppState()
  const projects = sorted((state.me.projects ?? []).filter((project) => !passion || project.passion === passion))
  const [openId, setOpenId] = useState<string>()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const open = (id: string) => {
    haptics.impact('light')
    setOpenId(id)
    setSheetOpen(true)
  }

  return (
    <section className="mt-8 flex flex-col gap-3" aria-labelledby="projects-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="projects-title" className="font-display text-26 font-extrabold tracking-tight text-ink">
          Tes projets
        </h2>
        <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
          <Plus aria-hidden="true" />
          Nouveau
        </Button>
      </div>
      {projects.length === 0 ? (
        <p className="rounded-md border-2 border-dashed border-ink-faint p-3 text-13 text-ink-soft">
          Rassemble tes créations autour d’une idée&nbsp;: un carnet de croquis, une nouvelle, le tour du jazz… Avec un objectif si tu veux, et une fête à la fin.
        </p>
      ) : (
        projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} onOpen={() => open(project.id)} />)
      )}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent>{openId && <ProjectSheet key={openId} id={openId} onClose={() => setSheetOpen(false)} />}</DialogContent>
      </Dialog>
      <NewProjectDialog passion={passion} open={creating} onOpenChange={setCreating} onCreated={(project) => open(project.id)} />
    </section>
  )
}

function ProjectCard({ project, index, onOpen }: { project: ProjectDTO; index: number; onOpen: () => void }) {
  const Icon = PASSION_ICONS[project.passion]
  const finished = Boolean(project.finishedAt)
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileTap={PRESSED}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, rotate: index % 2 ? 0.6 : -0.6 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      aria-haspopup="dialog"
      className={cn(
        'flex w-full items-center gap-3 rounded-md border-[2.5px] border-outline p-3 text-left shadow-chip transition-shadow duration-150 active:shadow-press',
        finished ? PASSION_COLORS[project.passion].soft : 'bg-card',
      )}
    >
      <span className={cn('flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm border-[2.5px] border-outline text-on-color [&>svg]:size-7', PASSION_COLORS[project.passion].bg)}>
        {project.coverUrl ? <img src={project.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Icon aria-hidden="true" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-12 font-bold text-ink-soft">
          {getPassion(project.passion).label}
          {finished && ' · terminé ✓'}
        </span>
        <span className="font-display text-17 leading-tight font-extrabold tracking-tight text-ink">{project.name}</span>
        <ProjectGauge project={project} />
      </span>
    </motion.button>
  )
}

/** « 4/10 créations » avec sa jauge, ou « 4 créations · 1 h 20 ». */
function ProjectGauge({ project }: { project: ProjectDTO }) {
  const label = project.goal ? `${project.creations}/${project.goal} créations` : `${plural(project.creations, 'création')} · ${formatMinutes(project.minutes)}`
  return (
    <span className="flex flex-col gap-1">
      {project.goal && (
        <span aria-hidden="true" className="block h-2.5 overflow-hidden rounded-pill border-2 border-outline bg-surface-200">
          <motion.span
            className="block h-full origin-left bg-accent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.min(1, project.creations / project.goal) }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      )}
      <span className="text-12 font-semibold text-ink-soft">{label}</span>
    </span>
  )
}

/* ---------------------------------------------------------- la feuille */

function ProjectSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, dispatch } = useAppState()
  const { reset } = useNavigation()
  const [detail, setDetail] = useState<ProjectDetailResponse>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const celebration = useRef<HTMLDivElement>(null)

  // La fête se voit : on remonte jusqu'à elle (le bouton « Terminer » est tout en bas).
  useEffect(() => {
    if (!celebrate) return
    const timer = window.setTimeout(() => celebration.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120)
    return () => window.clearTimeout(timer)
  }, [celebrate])

  useEffect(() => {
    let alive = true
    api
      .project(id)
      .then((response) => alive && setDetail(response))
      .catch((caught: unknown) => alive && setError(caught instanceof ApiError ? caught.message : 'Impossible d’ouvrir ce projet.'))
    return () => {
      alive = false
    }
  }, [id])

  const refresh = () =>
    api
      .projects()
      .then(({ projects }) => dispatch({ type: 'projects', projects }))
      .catch(() => {})

  if (!detail) {
    return error ? (
      <Alert variant="warning">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    ) : (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full rounded-md" />
        <Skeleton className="h-40 w-full rounded-md" />
      </div>
    )
  }

  const { project, items } = detail
  const passion = getPassion(project.passion)
  const Icon = PASSION_ICONS[project.passion]
  const finished = Boolean(project.finishedAt)
  const photos = items.filter((item) => item.photoUrl)
  const canContinue = !finished && state.me.user.passions.includes(project.passion)

  const continueProject = () => {
    haptics.impact('heavy')
    track('cta', { from: 'projet', passion: project.passion })
    dispatch({ type: 'newFlow', flow: { fixedPassion: project.passion, projectId: project.id } })
    onClose()
    reset([{ name: 'home' }, { name: 'signal' }])
  }

  const toggleFinished = async () => {
    setBusy(true)
    try {
      const response = await api.updateProject(project.id, { finished: !finished })
      setDetail(response)
      if (!finished) {
        haptics.success()
        track('project_finish', { passion: project.passion, creations: project.creations })
        setCelebrate(true)
      }
      void refresh()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Oups, réessaie dans un instant.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.deleteProject(project.id)
      haptics.impact('medium')
      await refresh()
      onClose()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Oups, réessaie dans un instant.')
      setBusy(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border-2 border-outline text-on-color [&>svg]:size-[18px]', PASSION_COLORS[project.passion].bg)}>
            <Icon aria-hidden="true" />
          </span>
          <span className="min-w-0">{project.name}</span>
        </DialogTitle>
        <DialogDescription>
          {passion.label} · commencé le {formatDay(project.createdAt).toLowerCase()}
        </DialogDescription>
      </DialogHeader>

      <Card tone={PASSION_COLORS[project.passion].card} className="shrink-0 gap-3 shadow-pop">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat value={String(project.creations)} label={project.creations > 1 ? 'créations' : 'création'} />
          <Stat value={formatMinutes(project.minutes)} label="de création" />
          {project.passion === 'ecriture' ? <Stat value={String(project.words)} label="mots" /> : <Stat value={project.goal ? `${project.goal}` : '—'} label="objectif" />}
        </div>
        {project.goal && (
          <span className="flex flex-col gap-1">
            <span aria-hidden="true" className="block h-3.5 overflow-hidden rounded-pill border-2 border-on-color bg-paper">
              <motion.span className="block h-full origin-left bg-accent" initial={{ scaleX: 0 }} animate={{ scaleX: Math.min(1, project.creations / project.goal) }} transition={{ delay: 0.2, duration: 0.8 }} />
            </span>
            <span className="text-13 font-bold">
              {project.creations >= project.goal ? 'Objectif atteint !' : `Encore ${plural(project.goal - project.creations, 'création')} pour l’objectif.`}
            </span>
          </span>
        )}
      </Card>

      <AnimatePresence>
        {(celebrate || finished) && (
          <motion.div ref={celebration} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative flex shrink-0 flex-col items-center gap-3 rounded-md border-[2.5px] border-outline bg-warm p-4 text-center text-on-color shadow-pop">
            {celebrate && <Confetti count={30} />}
            <span className="font-display text-26 font-extrabold tracking-tight">Projet terminé&nbsp;!</span>
            <span className="text-14 font-semibold">
              {plural(project.creations, 'création')}, {formatMinutes(project.minutes)} de création. Bravo.
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                track('share', { passion: project.passion, from: 'projet' })
                shareProject(project, state.me.botUsername)
              }}
            >
              <Share2 aria-hidden="true" />
              Le partager
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dessin : le premier et le dernier dessin du projet. */}
      {photos.length >= 2 && (
        <div className="flex shrink-0 items-center gap-2">
          <Thumb item={photos[0]!} label="Au début" rotate={-2} />
          <ArrowRight size={20} strokeWidth={2.6} className="shrink-0 text-ink" aria-hidden="true" />
          <Thumb item={photos.at(-1)!} label="Maintenant" rotate={2} />
        </div>
      )}

      <section className="flex shrink-0 flex-col gap-2" aria-labelledby="project-items">
        <h3 id="project-items" className="text-12 font-bold tracking-wider text-ink-soft uppercase">
          Les créations du projet
        </h3>
        {items.length === 0 ? (
          <p className="rounded-sm border-2 border-dashed border-ink-faint p-3 text-13 text-ink-soft">
            Rien encore. «&nbsp;Continuer ce projet&nbsp;» lance une activité qui viendra s’y ranger&nbsp;; tu peux aussi y ranger une création depuis ta galerie.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {items.map((item, index) => (
              <li key={item.id} className="flex items-start gap-3 rounded-sm border-2 border-outline bg-card p-2 shadow-chip">
                <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border-2 border-outline font-numbers text-15 font-extrabold text-on-color', PASSION_COLORS[item.passion].bg)}>
                  {item.photoUrl ? <img src={item.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : `#${index + 1}`}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="line-clamp-2 text-13 font-semibold text-ink">{item.exploredTitle ?? item.text ?? item.activityText}</span>
                  <span className="text-12 text-ink-soft">
                    {formatDay(item.createdAt)} · {item.duration}&nbsp;min
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {error && (
        <Alert variant="warning">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex shrink-0 flex-col gap-2">
        {canContinue && (
          <Button className="w-full" onClick={continueProject}>
            <Play aria-hidden="true" />
            Continuer ce projet
          </Button>
        )}
        <Button variant="secondary" className="w-full" disabled={busy} onClick={() => void toggleFinished()}>
          {finished ? <RotateCcw aria-hidden="true" /> : <Check aria-hidden="true" />}
          {finished ? 'Rouvrir le projet' : 'Terminer le projet'}
        </Button>
        {confirmDelete ? (
          <div className="flex flex-col gap-2 rounded-md border-2 border-dashed border-outline p-3">
            <p className="text-13 font-semibold text-ink">Supprimer ce projet&nbsp;? Tes créations restent dans ta galerie.</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirmDelete(false)}>
                Annuler
              </Button>
              <Button size="sm" className="flex-1" disabled={busy} onClick={() => void remove()}>
                Supprimer
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="md" className="w-full" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden="true" />
            Supprimer le projet
          </Button>
        )}
      </div>
    </>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex flex-col">
      <span className="font-numbers text-22 leading-tight font-extrabold">{value}</span>
      <span className="text-12 font-bold">{label}</span>
    </span>
  )
}

function Thumb({ item, label, rotate }: { item: CompletionDTO; label: string; rotate: number }) {
  return (
    <motion.figure className="flex flex-1 flex-col gap-1" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, rotate }}>
      <span className="block aspect-square overflow-hidden rounded-sm border-[2.5px] border-outline shadow-chip">
        {item.photoUrl && <img src={item.photoUrl} alt={`${label} : ${item.activityText}`} className="h-full w-full object-cover" loading="lazy" />}
      </span>
      <figcaption className="text-center text-12 font-bold text-ink">{label}</figcaption>
    </motion.figure>
  )
}

/* ------------------------------------------------------- nouveau projet */

export function NewProjectDialog({
  open,
  onOpenChange,
  passion: preset,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  passion?: PassionId
  onCreated?: (project: ProjectDTO) => void
}) {
  const { state, dispatch } = useAppState()
  const passions = state.me.user.passions
  const [passion, setPassion] = useState<PassionId | undefined>(preset ?? passions[0])
  const [name, setName] = useState('')
  const [goal, setGoal] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!open) return
    setPassion(preset ?? passions[0])
    setName('')
    setGoal(null)
    setError(undefined)
  }, [open, preset, passions])

  const create = async () => {
    if (!passion || !name.trim()) return
    setSaving(true)
    setError(undefined)
    try {
      const { project } = await api.createProject({ passion, name: name.trim(), goal })
      haptics.success()
      track('project_create', { passion, goal: goal ?? 0 })
      const { projects } = await api.projects()
      dispatch({ type: 'projects', projects })
      onOpenChange(false)
      onCreated?.(project)
    } catch (caught) {
      haptics.error()
      setError(caught instanceof ApiError ? caught.message : 'Le projet n’a pas pu être créé. Réessaie ?')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
          <DialogDescription>Rassemble tes créations autour d’une idée.</DialogDescription>
        </DialogHeader>

        {!preset && passions.length > 1 && (
          <ToggleGroup type="single" variant="chip" value={passion ?? ''} onValueChange={(value) => value && setPassion(value as PassionId)} aria-label="La passion du projet">
            {passions.map((id) => {
              const Icon = PASSION_ICONS[id]
              return (
                <ToggleGroupItem key={id} value={id} className={PASSION_COLORS[id].on}>
                  <Icon aria-hidden="true" />
                  {getPassion(id).label}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-14 font-bold text-ink">Son nom</span>
          <Input value={name} maxLength={MAX_PROJECT_NAME} onChange={(event) => setName(event.target.value)} placeholder={passion ? IDEAS[passion][0] : 'Mon projet'} />
        </label>
        {passion && (
          <div className="flex flex-wrap gap-2">
            {IDEAS[passion].map((idea) => (
              <button key={idea} type="button" onClick={() => setName(idea)} className="rounded-pill border-2 border-dashed border-outline px-3 py-1 text-13 font-semibold text-ink">
                {idea}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-14 font-bold text-ink">Un objectif&nbsp;?</span>
          <ToggleGroup type="single" variant="chip" value={goal ? String(goal) : 'none'} onValueChange={(value) => value && setGoal(value === 'none' ? null : Number(value))} aria-label="Objectif du projet">
            <ToggleGroupItem value="none" className="data-[state=on]:bg-good">
              Sans objectif
            </ToggleGroupItem>
            {GOALS.map((count) => (
              <ToggleGroupItem key={count} value={String(count)} className="data-[state=on]:bg-warm">
                {count} créations
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {error && (
          <Alert variant="warning">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button className="w-full" disabled={!passion || !name.trim() || saving} onClick={() => void create()}>
          <FolderOpen aria-hidden="true" />
          Créer le projet
        </Button>
      </DialogContent>
    </Dialog>
  )
}

/* --------------------------------------------------- ranger une création */

/**
 * Ranger une création dans un projet de sa passion (un tap), ou l'en sortir
 * (re-tap). « Nouveau projet » le crée et y range la création.
 */
export function ProjectPicker({
  completion,
  onChange,
  className,
  label = true,
}: {
  completion: CompletionDTO
  onChange?: (completion: CompletionDTO) => void
  className?: string
  /** Le titre « Ranger dans un projet » (masqué quand l'écran l'affiche déjà). */
  label?: boolean
}) {
  const { state, dispatch } = useAppState()
  const [current, setCurrent] = useState(completion)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>()
  const projects = sorted(state.me.projects ?? []).filter((project) => project.passion === current.passion && (!project.finishedAt || project.id === current.projectId))

  useEffect(() => setCurrent(completion), [completion])

  const assign = async (projectId: string | null) => {
    haptics.selection()
    setError(undefined)
    const previous = current
    setCurrent({ ...current, projectId })
    try {
      const response = await api.assignProject(current.id, projectId)
      dispatch({ type: 'projects', projects: response.projects })
      setCurrent(response.completion)
      onChange?.(response.completion)
    } catch (caught) {
      setCurrent(previous)
      setError(caught instanceof ApiError ? caught.message : 'Oups, réessaie dans un instant.')
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <p className="text-12 font-bold tracking-wider text-ink-soft uppercase">Ranger dans un projet</p>}
      <div className="flex flex-wrap gap-2">
        {projects.length > 0 && (
          <ToggleGroup type="single" variant="chip" value={current.projectId ?? ''} onValueChange={(value) => void assign(value || null)} aria-label="Projet">
            {projects.map((project) => (
              <ToggleGroupItem key={project.id} value={project.id} className={PASSION_COLORS[project.passion].on}>
                <FolderOpen aria-hidden="true" />
                {project.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
        <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
          <Plus aria-hidden="true" />
          Nouveau projet
        </Button>
      </div>
      {error && <p className="text-13 font-semibold text-accent-strong">{error}</p>}
      <NewProjectDialog open={creating} onOpenChange={setCreating} passion={current.passion} onCreated={(project) => void assign(project.id)} />
    </div>
  )
}
