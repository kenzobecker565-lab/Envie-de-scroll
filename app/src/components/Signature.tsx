import { ArrowRight, Disc3, Film, NotebookPen, PenLine, Piano } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { CompletionDTO, PassionDetailResponse, PassionId, PassionStatsDTO } from '@scroll-up/shared'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { api } from '../api/client.ts'
import { formatDay, formatNumber, plural } from '../lib/format.ts'
import { PASSION_COLORS } from '../lib/icons.ts'

/**
 * La signature d'une passion, ce qui se voit le mieux quand on progresse :
 * - Dessin : le premier et le dernier dessin côte à côte (avant / maintenant) ;
 * - Écriture : les mots écrits, et le texte le plus long ;
 * - Musique : la discothèque, Cinéma : la filmothèque (les titres explorés) ;
 * - Piano : le répertoire (les morceaux joués).
 */

/** Une page de roman compte à peu près 250 mots. */
const WORDS_PER_PAGE = 250

const TITLES: Record<PassionId, { title: string; icon: typeof Disc3 }> = {
  dessin: { title: 'Ton carnet de croquis', icon: NotebookPen },
  ecriture: { title: 'Ton carnet d’écriture', icon: PenLine },
  musique: { title: 'Ta discothèque', icon: Disc3 },
  cinema: { title: 'Ta filmothèque', icon: Film },
  piano: { title: 'Ton répertoire', icon: Piano },
}

/** « 3 dessins », « 1 240 mots », « 8 découvertes » : le chiffre qui parle le plus, par passion. */
export function signatureLabel(passion: PassionId, stats: PassionStatsDTO): string | null {
  if (passion === 'dessin') return stats.drawings ? plural(stats.drawings, 'dessin') : null
  if (passion === 'ecriture') return stats.words ? plural(stats.words, 'mot') : null
  if (passion === 'piano') return stats.explored ? plural(stats.explored, 'morceau', 'morceaux') : null
  return stats.explored ? plural(stats.explored, 'découverte') : null
}

export function SignatureSection({ passion, stats }: { passion: PassionId; stats: PassionStatsDTO }) {
  const [detail, setDetail] = useState<PassionDetailResponse>()
  const [failed, setFailed] = useState(false)
  const { title, icon: Icon } = TITLES[passion]

  useEffect(() => {
    let alive = true
    api
      .passion(passion)
      .then((response) => alive && setDetail(response))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [passion])

  const headline =
    passion === 'dessin'
      ? plural(stats.drawings, 'dessin')
      : passion === 'ecriture'
        ? `${plural(stats.words, 'mot écrit', 'mots écrits')}${stats.words >= WORDS_PER_PAGE ? ` · ≈\u00A0${plural(Math.round(stats.words / WORDS_PER_PAGE), 'page')}` : ''}`
        : plural(stats.explored, 'découverte')

  return (
    <section className="flex shrink-0 flex-col gap-3" aria-labelledby="signature-title">
      <h3 id="signature-title" className="flex items-center justify-between gap-2 text-12 font-bold tracking-wider text-ink-soft uppercase">
        <span className="inline-flex items-center gap-2">
          <Icon size={14} strokeWidth={2.6} aria-hidden="true" />
          {title}
        </span>
        <span className="font-numbers text-13 tracking-normal text-ink normal-case">{headline}</span>
      </h3>
      {!detail && !failed ? (
        <Skeleton className="h-28 w-full rounded-md" />
      ) : failed || !detail ? (
        <p className="text-13 text-ink-soft">Impossible de charger ton carnet pour l’instant.</p>
      ) : passion === 'dessin' ? (
        <Drawings detail={detail} passion={passion} />
      ) : passion === 'ecriture' ? (
        <Writing detail={detail} />
      ) : (
        <Titles detail={detail} passion={passion} />
      )}
    </section>
  )
}

/** Avant / maintenant : le premier et le dernier dessin. */
function Drawings({ detail, passion }: { detail: PassionDetailResponse; passion: PassionId }) {
  const { firstDrawing: first, lastDrawing: last } = detail
  if (!first) return <Hint>Ajoute la photo de tes dessins&nbsp;: ton avant / maintenant apparaîtra ici.</Hint>
  if (!last) {
    return (
      <div className="flex items-center gap-3">
        <Photo item={first} label="Ton premier dessin" passion={passion} className="w-1/2" />
        <p className="flex-1 text-13 text-ink-soft">Au prochain dessin en photo, tu verras ton avant / maintenant, côte à côte.</p>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <Photo item={first} label="Avant" passion={passion} className="flex-1" rotate={-2} />
      <ArrowRight size={20} strokeWidth={2.6} className="shrink-0 text-ink" aria-hidden="true" />
      <Photo item={last} label="Maintenant" passion={passion} className="flex-1" rotate={2} />
    </div>
  )
}

function Photo({ item, label, passion, className, rotate = 0 }: { item: CompletionDTO; label: string; passion: PassionId; className?: string; rotate?: number }) {
  return (
    <motion.figure className={cn('flex flex-col gap-1', className)} initial={{ opacity: 0, scale: 0.9, rotate: 0 }} animate={{ opacity: 1, scale: 1, rotate }}>
      <span className={cn('block aspect-square overflow-hidden rounded-sm border-[2.5px] border-outline shadow-chip', PASSION_COLORS[passion].soft)}>
        {item.photoUrl && <img src={item.photoUrl} alt={`${label} : ${item.activityText}`} className="h-full w-full object-cover" loading="lazy" />}
      </span>
      <figcaption className="text-center text-12 font-bold text-ink">
        {label} <span className="font-semibold text-ink-soft">· {formatDay(item.createdAt)}</span>
      </figcaption>
    </motion.figure>
  )
}

function Writing({ detail }: { detail: PassionDetailResponse }) {
  const longest = detail.longestText
  if (!longest) return <Hint>Chaque texte écrit vient grossir ton carnet&nbsp;: les mots s’additionnent ici.</Hint>
  return (
    <figure className="rounded-sm border-[2.5px] border-outline bg-lilac-soft p-3 shadow-chip">
      <figcaption className="text-12 font-bold text-ink">Ton texte le plus long · {plural(longest.words, 'mot')}</figcaption>
      <blockquote className="mt-2 line-clamp-4 text-14 text-ink italic">«&nbsp;{longest.completion.text}&nbsp;»</blockquote>
    </figure>
  )
}

function Titles({ detail, passion }: { detail: PassionDetailResponse; passion: PassionId }) {
  const shown = detail.titles.slice(0, 12)
  if (!shown.length) {
    if (passion === 'piano') return <Hint>Joue un tuto de chanson jusqu’au bout&nbsp;: chaque morceau rejoindra ton répertoire, ici.</Hint>
    return <Hint>Note ce que tu explores à la fin d’une activité&nbsp;: {passion === 'musique' ? 'ta discothèque' : 'ta filmothèque'} se remplira ici.</Hint>
  }
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-2">
        {shown.map((row, index) => (
          <motion.li
            key={`${row.title}-${row.createdAt}`}
            className={cn('rounded-pill border-2 border-outline px-3 py-1 text-13 font-bold text-on-color shadow-chip', PASSION_COLORS[passion].bg)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, rotate: index % 2 ? 1.5 : -1.5 }}
            transition={{ delay: index * 0.03 }}
          >
            {row.title}
          </motion.li>
        ))}
      </ul>
      {detail.titles.length > shown.length && <p className="text-12 text-ink-soft">et {formatNumber(detail.titles.length - shown.length)} autres.</p>}
    </div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="rounded-sm border-2 border-dashed border-ink-faint p-3 text-13 text-ink-soft">{children}</p>
}
