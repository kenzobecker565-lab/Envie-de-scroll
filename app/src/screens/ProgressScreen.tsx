import { Timer } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { BadgeShelf } from '../components/BadgePin.tsx'
import { ChallengeCard, challengePassions } from '../components/Challenge.tsx'
import { CoinIcon } from '../components/Coins.tsx'
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { MilestoneProgress } from '../components/Milestones.tsx'
import { finishedPathIds } from '../components/Paths.tsx'
import { Screen } from '../components/Screen.tsx'
import { useShop } from '../lib/shop.ts'
import { formatNumber, plural } from '../lib/format.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * L'onglet « Progresser » : tout ce qui compte et tout ce qui monte, au même
 * endroit. Les minutons et le prochain palier, le mot du jour, le parcours du
 * moment dans chaque passion, les niveaux, puis les badges. Jamais de jours
 * manqués.
 */
export function ProgressScreen() {
  const { state } = useAppState()
  const { push } = useNavigation()
  const shop = useShop()
  const { user, stats } = state.me

  return (
    <Screen tabs>
      <h1 className="font-display text-46 font-extrabold tracking-tight text-ink">Progression</h1>

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
            <Timer aria-hidden="true" />Récompenses des activités
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
      <Button className="mt-4" variant="secondary" onClick={() => push({ name: 'shop' })}>Boutique · {shop.balance} minutons disponibles</Button>
      <Card className="mt-4">
        <h2 className="font-bold">Mes séances</h2>
        <p>{stats.totalMinutes} min au total · {stats.monthMinutes} min ce mois-ci</p>
        <p>{plural(stats.monthActivities, 'activité')} · {plural(stats.monthCoins, 'minuton')} gagnés ce mois-ci</p>
        <small>Durée écoulée entre l’ouverture et l’enregistrement, plafonnée à la durée choisie. Les pauses peuvent être incluses. Les niveaux suivent les minutons gagnés.</small>
      </Card>
      {stats.totalCoins > 0 && (
        <motion.div className="mt-4 px-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <MilestoneProgress total={stats.totalCoins} />
        </motion.div>
      )}

      {challengePassions(user.passions).length > 0 && (
        <div className="mt-6 flex flex-col">
          <ChallengeCard
            done={stats.challenge ?? []}
            delay={0.15}
            onOpen={() => {
              haptics.impact('light')
              push({ name: 'challenge' })
            }}
          />
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <Button variant="secondary" onClick={() => push({ name: 'gallery' })}>Historique de mes activités</Button>
        <Button variant="secondary" onClick={() => push({ name: 'learn' })}>Mes leçons et ma progression</Button>
      </div>
      {stats.byPassion.some((row) => row.steps.length > 0) && <BadgeShelf finished={finishedPathIds(stats.byPassion)} />}
    </Screen>
  )
}
