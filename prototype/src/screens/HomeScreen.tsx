import { ChevronRight, Clapperboard } from 'lucide-react'
import { AppShell, Card, SectionTitle } from '../components/layout/AppShell'
import { AppLink } from '../components/ui/AppLink'
import { AppMark, Logo } from '../components/ui/Logo'
import { PassionPicto } from '../components/ui/Passion'
import { Picto } from '../components/ui/Picto'
import { StarRating } from '../components/ui/StarRating'
import { UrgeButton } from '../components/ui/UrgeButton'
import { getMood } from '../data/moods'
import { getPassion } from '../data/passions'
import { MOOD_SPOT, accentStyle } from '../lib/accent'
import { useStats } from '../hooks/useData'
import { navigate } from '../hooks/useRoute'
import { formatMinutes, formatRelativeDay, formatToday, pluralize } from '../lib/dates'
import { fr } from '../lib/typography'
import type { PictoName, Stats, UserProfile } from '../types'

export function HomeScreen({ profile }: { profile: UserProfile }) {
  const { stats } = useStats()
  const name = profile.firstName.trim()

  return (
    <AppShell activeTab="accueil">
      <header className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <AppMark className="size-8" />
          <Logo className="text-[1.05rem]" />
        </div>
      </header>

      <div className="mt-5">
        <h1 className="font-display text-[2rem] font-extrabold leading-tight tracking-tight">{name ? `Salut ${name}` : 'Salut'}</h1>
        <p className="mt-0.5 text-ink-soft first-letter:uppercase">{formatToday()}</p>
      </div>

      {/* Le bouton central : c'est LA porte d'entrée de l'app. */}
      <div className="py-7">
        <UrgeButton onClick={() => navigate('envie')} />
      </div>

      {stats && <HomeStats stats={stats} />}

      <section className="mt-7">
        <SectionTitle
          action={
            stats?.lastEntry && (
              <AppLink to="historique" className="flex items-center text-sm font-semibold text-primary">
                Historique <ChevronRight className="size-4" aria-hidden />
              </AppLink>
            )
          }
        >
          Ta dernière activité
        </SectionTitle>
        {stats?.lastEntry ? (
          <LastActivityCard stats={stats} />
        ) : (
          <Card className="flex flex-col items-center text-center text-ink-soft">
            <span style={accentStyle('var(--color-sage)')} className="text-ink">
              <Picto name="sprout" spot className="size-9" />
            </span>
            <p className="mt-1">Ta première envie transformée apparaîtra ici.</p>
          </Card>
        )}
      </section>
    </AppShell>
  )
}

function HomeStats({ stats }: { stats: Stats }) {
  const tiles: { picto: PictoName; spot: string; value: string; label: string }[] = [
    { picto: 'flame', spot: 'var(--color-primary)', value: pluralize(stats.currentStreak, 'jour'), label: 'de série' },
    { picto: 'shapes', spot: 'var(--color-saffron)', value: String(stats.totalTransformed), label: stats.totalTransformed > 1 ? 'envies transformées' : 'envie transformée' },
    { picto: 'timer', spot: 'var(--color-sage)', value: formatMinutes(stats.minutesReclaimed), label: 'récupérées' },
  ]

  let hint: string
  if (stats.currentStreak === 0) hint = 'Transforme une envie aujourd’hui pour lancer ta série.'
  else if (stats.streakNeedsToday) hint = `Une activité aujourd’hui et ta série passe à ${pluralize(stats.currentStreak + 1, 'jour')}.`
  else hint = 'Série validée pour aujourd’hui. Bien joué !'

  return (
    <section aria-label="Tes statistiques">
      <ul className="grid grid-cols-3 gap-2">
        {tiles.map((tile) => (
          <li key={tile.label} className="flex flex-col items-center rounded-[1.25rem] border border-line bg-card px-2.5 py-3 text-center shadow-soft">
            <Picto name={tile.picto} spot={`color-mix(in oklab, ${tile.spot} 45%, var(--color-card))`} className="size-7" />
            <p className="mt-1 font-display text-xl font-extrabold leading-tight tabular-nums">{tile.value}</p>
            <p className="mt-0.5 text-xs leading-tight text-ink-soft">{tile.label}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-sm text-ink-soft">{fr(hint)}</p>
    </section>
  )
}

function LastActivityCard({ stats }: { stats: Stats }) {
  const entry = stats.lastEntry!
  const passion = getPassion(entry.passionId)
  const mood = getMood(entry.mood)
  return (
    <AppLink to="progres" className="block rounded-[1.6rem] border border-line bg-card p-4 shadow-soft transition hover:border-ink-faint">
      <div className="flex gap-3">
        <PassionPicto passionId={entry.passionId} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-extrabold tracking-tight leading-snug">{fr(entry.title)}</p>
          <p className="mt-0.5 text-sm text-ink-soft">
            {passion.label} · {formatRelativeDay(entry.dateKey)} · {entry.duration} min
          </p>
        </div>
        <span role="img" title={mood.label} aria-label={`Humeur : ${mood.label}`}>
          <Picto name={mood.picto} spot={MOOD_SPOT[mood.energy]} className="size-7" />
        </span>
      </div>
      {entry.film && (
        <p className="mt-3 flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 font-semibold">
            <Clapperboard className="size-4" aria-hidden /> {entry.film.title}
          </span>
          <StarRating value={entry.film.rating} size="sm" />
        </p>
      )}
      {entry.note && <p className="mt-3 border-l-2 border-primary/40 pl-3 text-[0.95rem] italic leading-relaxed text-ink-soft">{fr(entry.note)}</p>}
    </AppLink>
  )
}
