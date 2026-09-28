import { Flame, History, Sparkles, Timer, Trophy } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { FilmsView } from '../components/dashboard/FilmsView'
import { GalleryView } from '../components/dashboard/GalleryView'
import { TimelineView } from '../components/dashboard/TimelineView'
import { WeeksCalendar } from '../components/dashboard/WeeksCalendar'
import { AppShell, ScreenTitle, SectionTitle } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { PassionChip } from '../components/ui/Passion'
import { getPassion } from '../data/passions'
import { useStats } from '../hooks/useData'
import { navigate } from '../hooks/useRoute'
import { formatMinutes, pluralize } from '../lib/dates'
import { fr } from '../lib/typography'
import type { HistoryEntry, PassionId, Stats, UserProfile } from '../types'

export function DashboardScreen({ profile }: { profile: UserProfile }) {
  const { history, stats } = useStats()

  return (
    <AppShell activeTab="progres">
      <ScreenTitle title="Ta progression" subtitle="Tout ce que tu as créé au lieu de scroller." />
      {stats && history ? (
        <div className="space-y-6">
          <StatsGrid stats={stats} />
          <WeeksCalendar days={stats.lastWeeks} />
          <PassionProgress profile={profile} history={history} stats={stats} />
          <Button variant="secondary" block icon={<History className="size-5" aria-hidden />} onClick={() => navigate('historique')}>
            Voir l’historique complet
          </Button>
        </div>
      ) : (
        <p className="text-ink-soft">Chargement…</p>
      )}
    </AppShell>
  )
}

function StatsGrid({ stats }: { stats: Stats }) {
  const [topPassionId, topCount] = (Object.entries(stats.countByPassion) as [PassionId, number][]).sort((a, b) => b[1] - a[1])[0] ?? []
  const topPassion = topPassionId ? getPassion(topPassionId) : undefined

  return (
    <ul className="grid grid-cols-2 gap-3" aria-label="Statistiques globales">
      <StatTile icon={<Flame className="size-4" aria-hidden />} label="Série actuelle" value={pluralize(stats.currentStreak, 'jour')} sub={`Record : ${pluralize(stats.bestStreak, 'jour')}`} />
      <StatTile icon={<Sparkles className="size-4" aria-hidden />} label="Envies transformées" value={String(stats.totalTransformed)} sub={`dont ${stats.thisWeek} cette semaine`} />
      <StatTile icon={<Timer className="size-4" aria-hidden />} label="Temps récupéré" value={formatMinutes(stats.minutesReclaimed)} sub="estimé, passé à créer" />
      <StatTile
        icon={<Trophy className="size-4" aria-hidden />}
        label="Passion n° 1"
        value={topPassion ? `${topPassion.emoji} ${topPassion.label}` : '—'}
        sub={topCount ? pluralize(topCount, 'activité') : 'à découvrir'}
        compact
      />
    </ul>
  )
}

function StatTile({ icon, label, value, sub, compact }: { icon: ReactNode; label: string; value: string; sub: string; compact?: boolean }) {
  return (
    <li className="rounded-[1.4rem] border border-line bg-card p-3.5 shadow-soft">
      <p className="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
        <span className="text-primary">{icon}</span>
        {label}
      </p>
      <p className={compact ? 'mt-1.5 truncate font-display text-lg font-semibold leading-tight' : 'mt-1 font-display text-[1.7rem] font-semibold leading-tight tabular-nums'}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-ink-soft">{fr(sub)}</p>
    </li>
  )
}

/** Onglets par passion + vue adaptée : galerie, films ou frise chronologique. */
function PassionProgress({ profile, history, stats }: { profile: UserProfile; history: HistoryEntry[]; stats: Stats }) {
  // D'abord les passions pratiquées (les plus actives en tête), puis celles du profil pas encore essayées.
  const practiced = (Object.entries(stats.countByPassion) as [PassionId, number][]).sort((a, b) => b[1] - a[1]).map(([id]) => id)
  const passionIds = [...new Set([...practiced, ...profile.passionIds])]
  const [selected, setSelected] = useState<PassionId | undefined>(passionIds[0])
  const current = selected && passionIds.includes(selected) ? selected : passionIds[0]

  if (!current) return null
  const passion = getPassion(current)
  const entries = history.filter((entry) => entry.passionId === current)

  return (
    <section aria-labelledby="par-passion">
      <SectionTitle>
        <span id="par-passion">Par passion</span>
      </SectionTitle>
      <div role="tablist" aria-label="Choisir une passion" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {passionIds.map((id) => (
          <PassionChip key={id} role="tab" passionId={id} selected={id === current} count={stats.countByPassion[id] ?? 0} onClick={() => setSelected(id)} />
        ))}
      </div>

      <div role="tabpanel" aria-label={passion.label} className="mt-3">
        {entries.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed border-line p-5 text-center text-ink-soft">
            <p className="text-2xl" aria-hidden>
              {passion.emoji}
            </p>
            <p className="mt-1">
              Pas encore d’activité en {passion.label.toLowerCase()}. La prochaine envie de scroller sera peut-être la bonne&nbsp;!
            </p>
          </div>
        ) : passion.progressView === 'gallery' ? (
          <GalleryView entries={entries} />
        ) : passion.progressView === 'films' ? (
          <FilmsView entries={entries} />
        ) : (
          <TimelineView entries={entries} />
        )}
      </div>
    </section>
  )
}
