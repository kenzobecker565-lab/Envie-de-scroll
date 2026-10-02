import { getPassion, passionLevel, type PassionId, type PassionStatsDTO } from '@scroll-up/shared'
const positions: Record<PassionId, number> = { piano: 0, dessin: 25, ecriture: 50, cinema: 75, musique: 100 }
export function PassionArtwork({ passion, className = '' }: { passion: PassionId; className?: string }) {
  return <div aria-hidden="true" className={`da-passion-art ${className}`} style={{ backgroundPosition: `${positions[passion]}% center` }} />
}
export function PassionPoster({ passion, stats, onOpen }: { passion: PassionId; stats: PassionStatsDTO; onOpen: () => void }) {
  const level = passionLevel(passion, stats.minutes)
  return <button type="button" className="da-passion-poster" onClick={onOpen}>
    <PassionArtwork passion={passion} />
    <div className="da-passion-caption"><h2>{getPassion(passion).label}</h2><span>Niveau {level.level} · {stats.activities} activité{stats.activities > 1 ? 's' : ''}</span><div className="da-gauge" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(100, level.progress * 100))}%` }} /></div></div>
  </button>
}
