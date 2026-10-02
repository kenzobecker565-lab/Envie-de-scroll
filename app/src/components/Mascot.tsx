import { motion } from 'motion/react'
import { useEquipped } from '../lib/shop.ts'
import { cn } from '@/lib/utils'

/**
 * Minuton, la mascotte : le jeton-chrono de l'app, avec une bouille. Il
 * accueille sur l'accueil, réfléchit avec toi quand tu bloques, et fait la
 * fête à chaque création. Dessiné en SVG avec les couleurs du thème
 * (soleil, encre) : il change d'habit avec le thème.
 *
 * Humeurs : `happy` (sourire), `cheer` (bras en l'air, yeux plissés de joie),
 * `wink` (clin d'œil), `think` (regarde en l'air, main au menton), `sleepy`
 * (tard le soir).
 */
export type MascotMood = 'happy' | 'cheer' | 'wink' | 'think' | 'sleepy'

const INK = { stroke: 'var(--on-color)', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }

export function Mascot({ mood = 'happy', size = 64, className, animated = true, accessory }: { accessory?: string; mood?: MascotMood; size?: number; className?: string; animated?: boolean }) {
  const equipped = useEquipped('mascot')
  const outfit = accessory ?? equipped?.id
  const arms = ARMS[mood]
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 100 110" aria-hidden="true" className={cn('shrink-0 overflow-visible', className)}>
      {/* Jambes. */}
      <path d="M40 92 L37 104 M60 92 L63 104" style={{ ...INK, strokeWidth: 5 }} />
      <path d="M31 104 h9 M60 104 h9" style={{ ...INK, strokeWidth: 6 }} />
      {/* Bras (derrière le corps). */}
      <g className={cn(animated && mood === 'cheer' && 'motion-loop anim-mascot-wave')} style={{ transformOrigin: '22px 60px' }}>
        <path d={arms.left} style={{ ...INK, strokeWidth: 5 }} />
      </g>
      <g className={cn(animated && mood === 'cheer' && 'motion-loop anim-mascot-wave-right')} style={{ transformOrigin: '78px 60px' }}>
        <path d={arms.right} style={{ ...INK, strokeWidth: 5 }} />
      </g>
      {/* Le remontoir et le petit bouton du chrono. */}
      <rect x="42" y="4" width="16" height="9" rx="3" style={{ fill: 'var(--on-color)' }} />
      <rect x="47" y="11" width="6" height="6" style={{ fill: 'var(--on-color)' }} />
      <path d="M76 22 l6 -6" style={{ ...INK, strokeWidth: 5 }} />
      {/* Le corps-cadran. */}
      <circle cx="50" cy="56" r="37" style={{ fill: 'var(--warm)', stroke: 'var(--on-color)', strokeWidth: 4 }} />
      {/* Reflet. */}
      <path d="M26 42 a28 28 0 0 1 14 -14" style={{ ...INK, stroke: 'var(--paper)', strokeWidth: 4, opacity: 0.8 }} />
      {/* Graduations : midi, 3 h, 6 h, 9 h. */}
      <path d="M50 22 v5 M84 56 h-5 M50 90 v-5 M16 56 h5" style={{ ...INK, strokeWidth: 3 }} />
      {/* Joues. */}
      <ellipse cx="31" cy="66" rx="6" ry="4" style={{ fill: 'var(--accent)', opacity: 0.55 }} />
      <ellipse cx="69" cy="66" rx="6" ry="4" style={{ fill: 'var(--accent)', opacity: 0.55 }} />
      <SportOutfit outfit={outfit} />
      <Face mood={mood} animated={animated} />
      {outfit === 'mascot-beret' && <g><ellipse cx="47" cy="20" rx="31" ry="11" transform="rotate(-12 47 20)" fill="#6B4585" stroke="var(--on-color)" strokeWidth="3" /><path d="M45 12 l3 -7" stroke="var(--on-color)" strokeWidth="4" /></g>}
      {outfit === 'mascot-casque' && <g fill="#8BB7EF" stroke="var(--on-color)" strokeWidth="3"><path d="M14 55 C10 2 90 2 86 55" fill="none" strokeWidth="6" /><rect x="8" y="45" width="13" height="23" rx="5" /><rect x="79" y="45" width="13" height="23" rx="5" /></g>}
      {mood === 'sleepy' && (
        <g className={cn(animated && 'motion-loop anim-twinkle')} style={{ fill: 'var(--on-color)', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          <text x="84" y="20" fontSize="14">
            z
          </text>
          <text x="94" y="8" fontSize="10">
            z
          </text>
        </g>
      )}
    </svg>
  )
}

const ARMS: Record<MascotMood, { left: string; right: string }> = {
  happy: { left: 'M18 60 Q8 66 10 78', right: 'M82 60 Q92 66 90 78' },
  cheer: { left: 'M18 52 Q6 40 10 26', right: 'M82 52 Q94 40 90 26' },
  wink: { left: 'M18 60 Q8 66 10 78', right: 'M82 58 Q96 50 92 36' },
  think: { left: 'M18 60 Q8 66 10 78', right: 'M80 66 Q70 84 58 76' },
  sleepy: { left: 'M18 62 Q10 72 14 82', right: 'M82 62 Q90 72 86 82' },
}

function Face({ mood, animated }: { mood: MascotMood; animated: boolean }) {
  const ink = { fill: 'var(--on-color)' }
  const blink = cn(animated && 'motion-loop anim-blink')
  switch (mood) {
    case 'cheer':
      return (
        <>
          <path d="M33 52 q5 -7 10 0 M57 52 q5 -7 10 0" style={{ ...INK, strokeWidth: 4 }} />
          <path d="M38 62 h24 q0 14 -12 14 q-12 0 -12 -14 z" style={{ ...ink, stroke: 'var(--on-color)', strokeWidth: 3, strokeLinejoin: 'round' }} />
          <path d="M44 71 q6 4 12 0" style={{ fill: 'var(--accent)' }} />
        </>
      )
    case 'wink':
      return (
        <>
          <ellipse cx="38" cy="52" rx="4.5" ry="6" style={ink} className={blink} />
          <path d="M57 53 q5 -5 10 0" style={{ ...INK, strokeWidth: 4 }} />
          <path d="M39 66 q11 10 22 0" style={{ ...INK, strokeWidth: 4 }} />
        </>
      )
    case 'think':
      return (
        <>
          <ellipse cx="40" cy="50" rx="4.5" ry="6" style={ink} />
          <ellipse cx="62" cy="50" rx="4.5" ry="6" style={ink} />
          <circle cx="41.5" cy="47" r="1.6" style={{ fill: 'var(--paper)' }} />
          <circle cx="63.5" cy="47" r="1.6" style={{ fill: 'var(--paper)' }} />
          <path d="M43 69 q7 -3 14 0" style={{ ...INK, strokeWidth: 4 }} />
        </>
      )
    case 'sleepy':
      return (
        <>
          <path d="M33 54 q5 4 10 0 M57 54 q5 4 10 0" style={{ ...INK, strokeWidth: 4 }} />
          <ellipse cx="50" cy="69" rx="4" ry="4.5" style={ink} />
        </>
      )
    default:
      return (
        <>
          <g className={blink} style={{ transformOrigin: '50px 52px' }}>
            <ellipse cx="38" cy="52" rx="4.5" ry="6" style={ink} />
            <ellipse cx="62" cy="52" rx="4.5" ry="6" style={ink} />
            <circle cx="39.5" cy="49.5" r="1.6" style={{ fill: 'var(--paper)' }} />
            <circle cx="63.5" cy="49.5" r="1.6" style={{ fill: 'var(--paper)' }} />
          </g>
          <path d="M39 65 q11 10 22 0" style={{ ...INK, strokeWidth: 4 }} />
        </>
      )
  }
}

/** Minuton qui parle : la mascotte et sa bulle. */
export function MascotSays({ mood = 'happy', children, size = 56, className, delay = 0.2 }: { mood?: MascotMood; children: React.ReactNode; size?: number; className?: string; delay?: number }) {
  return (
    <div className={cn('flex items-end gap-2', className)}>
      <motion.span
        className="motion-loop anim-float shrink-0"
        style={{ '--float-duration': '3.6s' } as React.CSSProperties}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay, type: 'spring', stiffness: 300, damping: 14 }}
      >
        <Mascot mood={mood} size={size} />
      </motion.span>
      <motion.p
        className="relative mb-4 rounded-md border-[2.5px] border-outline bg-card px-3 py-2 text-15 font-semibold text-ink shadow-chip"
        initial={{ opacity: 0, x: -8, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: delay + 0.15, type: 'spring', stiffness: 260, damping: 18 }}
      >
        {/* La pointe de la bulle, vers Minuton. */}
        <span aria-hidden="true" className="absolute bottom-3 -left-[9px] h-4 w-4 rotate-45 border-b-[2.5px] border-l-[2.5px] border-outline bg-card" />
        <span className="relative">{children}</span>
      </motion.p>
    </div>
  )
}

/** Accessoires sportifs dessinés dans le même repère que Minuton. */
function SportOutfit({ outfit }: { outfit?: string }) {
  const stroke = { stroke: '#292329', strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  const jersey = (color: string, number?: string) => <g {...stroke}><path d="M22 74 Q50 88 78 74 L73 85 Q50 103 27 85Z" fill={color} />{number && <text x="50" y="89" fill="#fffdf7" stroke="none" textAnchor="middle" fontSize="12" fontWeight="900">{number}</text>}</g>
  const band = (color: string) => <path d="M19 35 Q50 20 81 35 L78 42 Q50 29 22 42Z" fill={color} {...stroke} />
  const cap = (color: string) => <g {...stroke}><path d="M24 28 Q24 0 54 7 Q77 9 78 29Z" fill={color} /><path d="M48 28 H90 Q89 36 67 36Z" fill={color} /></g>
  switch (outfit) {
    case 'mascot-basket': return <>{jersey('#7755C7','23')}{band('#7755C7')}<g {...stroke}><circle cx="88" cy="77" r="14" fill="#F5A052" /><path d="M74 77 H102 M88 63 V91 M78 67 Q96 77 78 87 M98 67 Q80 77 98 87" fill="none" /></g></>
    case 'mascot-judo': return <g {...stroke}><path d="M20 75 L34 72 L50 81 L66 72 L80 75 L73 87 Q50 102 27 87Z" fill="#fffdf7" /><path d="M34 74 L54 89 M65 74 L47 91" fill="none" /><path d="M27 87 Q50 98 73 87" fill="none" strokeWidth="6" /><path d="M49 91 L46 105 M53 91 L59 102" fill="none" strokeWidth="4" /></g>
    case 'mascot-equitation': return <>{jersey('#62483D')}<g {...stroke}><path d="M22 29 Q22 2 50 4 Q78 2 78 29Z" fill="#393443" /><path d="M22 29 H85" fill="none" strokeWidth="5" /><path d="M50 78 L44 88 H57Z" fill="#fffdf7" /><path d="M88 89 L94 38" fill="none" /><path d="M92 38 L97 30" fill="none" strokeWidth="4" /></g></>
    case 'mascot-football': return <>{jersey('#438A61','10')}<g {...stroke}><circle cx="86" cy="87" r="14" fill="#fffdf7" /><path d="M86 79 L93 84 L90 92 H82 L79 84Z" fill="#292329" /><path d="M86 79 V73 M93 84 L99 81 M90 92 L94 99 M82 92 L77 98 M79 84 L73 81" fill="none" /></g></>
    case 'mascot-tennis': return <>{jersey('#539C90')}{band('#fffdf7')}<g {...stroke}><ellipse cx="90" cy="55" rx="11" ry="16" fill="#BDE8DD" /><path d="M82 45 H98 M80 52 H100 M80 59 H100 M85 41 V68 M91 40 V70 M96 43 V67 M89 72 L86 91" fill="none" strokeWidth="1.5" /><circle cx="16" cy="85" r="7" fill="#D9EB69" /><path d="M12 79 Q20 85 12 91" fill="none" stroke="#fffdf7" /></g></>
    case 'mascot-boxe': return <>{jersey('#CC5359')}{band('#CC5359')}<g {...stroke}><path d="M2 61 Q-3 45 8 43 Q19 43 21 53 L19 68Z" fill="#E96B6D" /><path d="M80 53 Q84 42 94 43 Q106 45 100 61 L82 68Z" fill="#E96B6D" /><path d="M3 67 L19 72 M82 72 L98 67" strokeWidth="6" /></g></>
    case 'mascot-natation': return <g {...stroke}><path d="M20 35 Q22 5 50 7 Q78 5 80 35Z" fill="#65B7E0" /><path d="M18 48 H82" fill="none" stroke="#3B759E" strokeWidth="4" /><rect x="27" y="43" width="21" height="15" rx="6" fill="#CCEAF4" fillOpacity=".65" /><rect x="53" y="43" width="21" height="15" rx="6" fill="#CCEAF4" fillOpacity=".65" /><path d="M48 48 H53" /></g>
    case 'mascot-cyclisme': return <>{jersey('#EAAA44')}<g {...stroke}><path d="M20 29 Q20 4 50 5 Q80 4 80 29Z" fill="#F7CC64" /><path d="M34 12 L30 26 M49 10 V25 M64 12 L68 26" strokeWidth="4" /><path d="M23 32 L32 39 M77 32 L68 39" fill="none" /><path d="M50 78 V92" fill="none" /></g></>
    case 'mascot-rugby': return <>{jersey('#96516F','8')}<g {...stroke}><ellipse cx="88" cy="80" rx="11" ry="18" transform="rotate(35 88 80)" fill="#C39163" /><path d="M83 73 L93 87 M86 73 L82 76 M89 77 L85 80 M92 81 L88 84" fill="none" stroke="#fffdf7" /></g></>
    case 'mascot-baseball': return <>{jersey('#608DC5','7')}{cap('#608DC5')}<g {...stroke}><path d="M86 91 L98 38 Q104 33 107 40 L94 94Z" fill="#D8AA7B" /><circle cx="12" cy="79" r="9" fill="#fffdf7" /><path d="M7 72 Q14 79 7 86 M17 72 Q10 79 17 86" fill="none" stroke="#C95F65" strokeWidth="1.5" /></g></>
    case 'mascot-ski': return <>{jersey('#798DCE')}<g {...stroke}><path d="M22 30 Q26 9 50 10 Q74 9 78 30Z" fill="#AA89C7" /><circle cx="50" cy="7" r="7" fill="#AA89C7" /><path d="M22 31 H78" stroke="#fffdf7" strokeWidth="6" /><rect x="25" y="42" width="50" height="15" rx="7" fill="#B7DDED" fillOpacity=".65" /><path d="M18 106 H47 M55 106 H84" stroke="#798DCE" strokeWidth="6" /><path d="M10 78 L4 106 M91 78 L97 106" fill="none" /></g></>
    case 'mascot-skate': return <>{jersey('#57A98B')}<g {...stroke}><path d="M25 29 Q24 5 51 8 Q78 8 77 29Z" fill="#8E72BD" /><path d="M25 29 H9" stroke="#8E72BD" strokeWidth="7" /><path d="M17 103 Q50 113 83 103" fill="none" stroke="#8E72BD" strokeWidth="6" /><circle cx="30" cy="110" r="4" fill="#292329" /><circle cx="70" cy="110" r="4" fill="#292329" /></g></>
    default: return null
  }
}
