import { Star } from 'lucide-react'
import { getPassion, progressFor, type PassionId, type PassionStatsDTO } from '@scroll-up/shared'
import './PracticeProgress.css'
export function PracticeProgress({passion,rows,earnedXp}:{passion:PassionId;rows:PassionStatsDTO[];earnedXp?:number}) {
 const value=progressFor(passion,rows)
 return <section className="practice-progress" aria-label={`Ma progression en ${getPassion(passion).label}`}>
  <div className="practice-level"><div><strong>{getPassion(passion).label} · Niveau {value.level}</strong>{earnedXp!==undefined&&<span><Star size={17}/>+{earnedXp} XP</span>}</div><progress aria-label="Expérience vers le niveau suivant" max={1} value={value.progress}/><small>{value.xp} XP {value.nextXp!==null?`· prochain niveau à ${value.nextXp} XP`:'· niveau maximal'}</small></div>
  <div className="practice-collection"><strong>{value.count} / {value.total}</strong><span>activités découvertes</span><div className="practice-stamps" aria-hidden="true">{Array.from({length:value.total},(_,i)=><i key={i} data-done={i<value.count}/>)}</div><p>Une activité différente, une découverte de plus. Refaire une activité continue de faire progresser ton expérience.</p></div>
 </section>
}
