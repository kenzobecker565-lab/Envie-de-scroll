import { Dices, Headphones, Images, LifeBuoy, Lightbulb, PenLine, Play, RefreshCw, Shuffle, Tv, Volume2, VolumeX } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { drawChallenge, EXTRA_LINKS, guideFor, sample, seededRandom, type Challenge, type IdeaList, type LinkKind, type ProposalDTO } from '@scroll-up/shared'
import { Card, CardEyebrow } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { track } from '../api/client.ts'
import { linksFor, type ExternalLink } from '../lib/links.ts'
import { PASSION_COLORS } from '../lib/icons.ts'
import { Mascot } from './Mascot.tsx'
import { useAppState } from '../state/AppState.tsx'
import { haptics, openExternal } from '../telegram/webApp.ts'

/**
 * Sous l'activité, « Un coup de pouce ? » : une rangée de pastilles, et l'aide
 * choisie s'ouvre juste en dessous (un autre toucher la referme).
 * - « Une idée » : des suggestions concrètes (un album, un style, un lieu),
 *   avec les liens pour écouter ou regarder celle qu'on choisit ;
 * - « Si tu bloques » : 2 ou 3 pistes pour démarrer ;
 * - « Un défi en plus » (Dessin, Écriture) : une contrainte pour pimenter ;
 * - « Sans papier » (Dessin) : dessiner au doigt, dans l'app ;
 * - « Sans son » (Musique, Cinéma) : une activité qui se fait sans écouter.
 * (Au piano, le clavier est dans l'activité même : voir ActivityScreen.)
 */
export function ActivityHelp({
  proposal,
  onPad,
  quiet,
}: {
  proposal: ProposalDTO
  /** Dessin : ouvrir la feuille à dessiner au doigt. */
  onPad?: () => void
  /** Musique, Cinéma : basculer vers une activité sans son. */
  quiet?: { on: boolean; busy: boolean; toggle: () => void; note?: string }
}) {
  const guide = guideFor(proposal.activityId)
  const canChallenge = proposal.passion === 'dessin' || proposal.passion === 'ecriture'
  const [open, setOpen] = useState<Panel | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)

  const hasPanels = Boolean(guide?.ideas || guide || canChallenge)
  if (!hasPanels && !onPad && !quiet && !proposal.extra) return null

  const toggle = (panel: Panel) => {
    haptics.selection()
    if (open === panel) return setOpen(null)
    setOpen(panel)
    if (panel === 'tips') track('tips_open', { passion: proposal.passion })
    if (panel === 'challenge' && !challenge) newChallenge()
  }

  const newChallenge = () => {
    setChallenge((previous) => {
      // Jamais deux fois le même défi d'affilée.
      for (let tries = 0; tries < 5; tries++) {
        const next = drawChallenge(proposal.passion)
        if (next && next.text !== previous?.text) return next
      }
      return drawChallenge(proposal.passion)
    })
    track('challenge', { passion: proposal.passion })
  }

  return (
    <div className="flow-help mt-5 flex flex-col gap-3">
      {proposal.extra && <ExtraLinks proposal={proposal} />}

      {(hasPanels || onPad || quiet) && (
        <section className="flex flex-col gap-2" aria-labelledby="help-title">
          <h2 id="help-title" className="text-13 font-extrabold text-ink-soft">
            Un coup de pouce&nbsp;?
          </h2>
          <div className="flow-help-choices flex flex-col gap-0">
            {guide?.ideas && (
              <HelpToggle open={open === 'ideas'} onClick={() => toggle('ideas')} controls="help-ideas">
                <Lightbulb aria-hidden="true" />
                Quelques idées
              </HelpToggle>
            )}
            {guide && (
              <HelpToggle open={open === 'tips'} onClick={() => toggle('tips')} controls="help-tips">
                <LifeBuoy aria-hidden="true" />
                Une piste pour commencer
              </HelpToggle>
            )}
            {canChallenge && (
              <HelpToggle open={open === 'challenge'} onClick={() => toggle('challenge')} controls="help-challenge">
                <Dices aria-hidden="true" />
                Un défi en plus
              </HelpToggle>
            )}
            {onPad && (
              <HelpAction onClick={onPad}>
                <PenLine aria-hidden="true" />
                Pas de papier ?
              </HelpAction>
            )}
            {quiet && (
              <HelpAction onClick={quiet.toggle} pressed={quiet.on} disabled={quiet.busy}>
                {quiet.on ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
                {quiet.on ? 'Sans son\u00A0✓' : 'Sans son'}
              </HelpAction>
            )}
          </div>
          {quiet?.note && (
            <p role="status" className="text-13 font-semibold text-ink">
              {quiet.note}
            </p>
          )}
        </section>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {open === 'ideas' && guide?.ideas && (
          <motion.div key="ideas" id="help-ideas" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <IdeasCard ideas={guide.ideas} proposal={proposal} />
          </motion.div>
        )}
        {open === 'tips' && guide && (
          <motion.ol
            key="tips"
            id="help-tips"
            className="flex flex-col gap-2"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <li className="flex items-center gap-2">
              <Mascot mood="think" size={40} />
              <span className="text-14 font-bold text-ink">Minuton a quelques pistes pour toi&nbsp;:</span>
            </li>
            {guide.tips.map((tip, index) => (
              <motion.li
                key={tip}
                className="flex items-start gap-3 rounded-md border-2 border-outline bg-card p-3 text-14 font-semibold text-ink shadow-chip"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border-2 border-outline font-numbers text-12 font-extrabold text-on-color', PASSION_COLORS[proposal.passion].bg)}>
                  {index + 1}
                </span>
                {tip}
              </motion.li>
            ))}
          </motion.ol>
        )}
        {open === 'challenge' && challenge && (
          <Card
            key={`challenge-${challenge.text}-${challenge.palette?.name ?? ''}`}
            id="help-challenge"
            tone="warm"
            className="gap-3"
            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: -1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            role="status"
          >
            <CardEyebrow>
              <Dices aria-hidden="true" />
              Ton défi en plus · facultatif
            </CardEyebrow>
            <p className="font-display text-20 leading-tight font-extrabold tracking-tight">{challenge.text}</p>
            {challenge.palette && (
              <div className="flex items-center gap-3">
                <span className="flex">
                  {challenge.palette.colors.map((color, index) => (
                    <motion.span
                      key={color}
                      className="-ml-2 h-10 w-10 rounded-pill border-[2.5px] border-outline first:ml-0"
                      style={{ backgroundColor: color }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 + index * 0.08, type: 'spring', stiffness: 400, damping: 18 }}
                      aria-hidden="true"
                    />
                  ))}
                </span>
                <span className="flex flex-col">
                  <span className="text-15 font-extrabold">Palette «&nbsp;{challenge.palette.name}&nbsp;»</span>
                  <span className="text-12 font-semibold">Pas ces couleurs&nbsp;? Prends les plus proches.</span>
                </span>
              </div>
            )}
            <button type="button" onClick={newChallenge} className="inline-flex items-center gap-1 self-start text-14 font-extrabold underline decoration-2 underline-offset-4">
              <RefreshCw size={14} strokeWidth={2.6} aria-hidden="true" />
              Un autre défi
            </button>
          </Card>
        )}
      </AnimatePresence>
    </div>
  )
}

type Panel = 'ideas' | 'tips' | 'challenge'

function HelpToggle({ open, onClick, controls, children }: { open: boolean; onClick: () => void; controls: string; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-pill border-2 border-outline px-4 text-14 font-bold text-ink transition-[background-color,box-shadow] duration-150 [&>svg]:size-4 [&>svg]:stroke-[2.4]',
        open ? 'bg-surface-200 shadow-chip' : 'bg-card',
      )}
    >
      {children}
    </motion.button>
  )
}

/** Une pastille qui agit tout de suite (dessiner au doigt, passer sans son). */
function HelpAction({ onClick, pressed, disabled, children }: { onClick: () => void; pressed?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-pill border-2 border-outline px-4 text-14 font-bold text-ink transition-[background-color,box-shadow] duration-150 disabled:opacity-50 [&>svg]:size-4 [&>svg]:stroke-[2.4]',
        pressed ? 'bg-good shadow-chip' : 'bg-card',
      )}
    >
      {children}
    </motion.button>
  )
}

/** « Une idée ? » : quelques suggestions (toujours les mêmes pour une proposition), et d'autres sur demande. */
function IdeasCard({ ideas, proposal }: { ideas: IdeaList; proposal: ProposalDTO }) {
  const { state, dispatch } = useAppState()
  const [round, setRound] = useState(0)
  const count = ideas.show ?? 3
  const shown = useMemo(() => sample(ideas.items, count, seededRandom(`${proposal.id}:${round}`)), [ideas.items, count, proposal.id, round])
  const picked = state.flow.idea?.proposalId === proposal.id ? state.flow.idea.text : undefined
  const links = ideas.links && picked ? linksFor(ideas.links, picked, ideas.suffix) : []

  const pick = (value: string) => {
    haptics.selection()
    dispatch({ type: 'flow', flow: { idea: value ? { proposalId: proposal.id, text: value } : undefined } })
  }

  return (
    <Card tone="muted" className="gap-3">
      <div className="flex items-center justify-between gap-2">
        <CardEyebrow className="min-w-0">
          <Lightbulb aria-hidden="true" />
          <span className="truncate">Une idée&nbsp;? · {ideas.label}</span>
        </CardEyebrow>
        <motion.button
          type="button"
          onClick={() => {
            haptics.selection()
            setRound((value) => value + 1)
          }}
          whileTap={{ rotate: 180, scale: 0.9 }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border-2 border-outline bg-card text-ink"
          aria-label="D’autres idées"
        >
          <Shuffle size={16} strokeWidth={2.4} aria-hidden="true" />
        </motion.button>
      </div>
      <ToggleGroup type="single" variant="chip" value={picked ?? ''} onValueChange={pick} aria-label={ideas.label}>
        {shown.map((item, index) => (
          <ToggleGroupItem
            key={`${round}-${item}`}
            value={item}
            className={cn('min-h-10 py-1.5 text-13', PASSION_COLORS[proposal.passion].on)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {item}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {ideas.links && (links.length ? <LinkRow links={links} passion={proposal.passion} /> : <p className="text-12 font-semibold text-ink-soft">Choisis-en une pour {hintFor(ideas.links)}.</p>)}
    </Card>
  )
}

function hintFor(kind: LinkKind): string {
  if (kind === 'ecoute') return 'l’écouter en un geste'
  if (kind === 'image') return 'en voir des images'
  return 'la regarder en un geste'
}

/** Pour ce que l'appli a tiré (genre, film, court) : les mêmes liens. */
function ExtraLinks({ proposal }: { proposal: ProposalDTO }) {
  const extra = proposal.extra
  const kind = extra ? EXTRA_LINKS[extra.kind] : undefined
  const item = extra?.items[0]
  if (!kind || !item) return null
  return <LinkRow links={linksFor(kind, item, kind === 'ecoute' ? 'playlist' : undefined)} passion={proposal.passion} />
}

const LINK_ICONS: Record<ExternalLink['kind'], typeof Play> = { video: Play, audio: Headphones, watch: Tv, image: Images }

function LinkRow({ links, passion }: { links: ExternalLink[]; passion: ProposalDTO['passion'] }) {
  return (
    <motion.div className="flex flex-wrap gap-2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      {links.map((link) => {
        const Icon = LINK_ICONS[link.kind]
        return (
          <motion.a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ x: 2, y: 2 }}
            onClick={(event) => {
              event.preventDefault()
              haptics.impact('light')
              track('idea_link', { passion, link: link.label })
              openExternal(link.url)
            }}
            className="inline-flex h-10 items-center gap-2 rounded-pill border-2 border-outline bg-card px-3 text-13 font-extrabold text-ink shadow-chip active:shadow-press [&>svg]:size-4"
          >
            <Icon aria-hidden="true" strokeWidth={2.4} />
            {link.label}
          </motion.a>
        )
      })}
    </motion.div>
  )
}
