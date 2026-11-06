import { ArrowRight, Camera, Heart, MessageCircle, Music2, Play } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Les « posts » du mini-fil dessiné dans le bouton : hauteur, icône, et s'il
 * est un peu plus visible que les autres. Trois colonnes qui défilent à des
 * vitesses différentes (chaque colonne est répétée deux fois pour boucler).
 */
const COLUMNS: { speed: string; offset: string; posts: [number, LucideIcon | null, boolean?][] }[] = [
  { speed: '16s', offset: '0px', posts: [[124, Play, true], [86, Heart], [150, Play], [104, null], [132, Music2, true]] },
  { speed: '12s', offset: '-44px', posts: [[98, Heart], [142, Play, true], [90, MessageCircle], [156, Play], [112, Camera]] },
  { speed: '19s', offset: '-16px', posts: [[146, Play], [102, null, true], [120, Camera], [88, Heart, true], [138, Play]] },
]

function Post({ height, Icon, bright }: { height: number; Icon: LucideIcon | null; bright?: boolean }) {
  return (
    <span
      className={`relative mb-2.5 block shrink-0 rounded-[14px] ring-1 ring-white/15 ${bright ? 'bg-white/25' : 'bg-white/13'}`}
      style={{ height }}
    >
      <span className="absolute left-2 top-2 size-3.5 rounded-full bg-white/45" />
      {Icon && <Icon className="absolute left-1/2 top-1/2 size-5 -translate-1/2 text-white/85" strokeWidth={2.4} fill={Icon === Play || Icon === Heart ? 'currentColor' : 'none'} />}
      <span className="absolute bottom-2 left-2 h-1.5 w-3/5 rounded-full bg-white/35" />
    </span>
  )
}

/**
 * LE bouton de l'app : une carte qui montre l'envie telle qu'elle est (un fil
 * qui défile sans fin), que le crayon de la marque vient barrer de temps en
 * temps (« plutôt que scroller »). Appuyer fige le fil.
 */
export function UrgeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="J’ai envie de scroller"
      className="group urge-card relative isolate block h-[17.5rem] w-full overflow-hidden rounded-[2rem] text-left text-white transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985]"
    >
      {/* Le fil qui défile, incliné, et qui s'efface vers le bas */}
      <span aria-hidden className="urge-feed absolute inset-x-0 top-0 h-[78%]">
        <span className="urge-plane absolute -inset-x-8 -top-24 flex gap-2.5">
          {COLUMNS.map((column, c) => (
            <span key={c} className="flex-1 overflow-visible" style={{ marginTop: column.offset }}>
              {/* Marge sous chaque post (pas de gap) : la moitié de la pile vaut une boucle exacte, sans saut. */}
              <span className="flex animate-feed-up flex-col group-active:[animation-play-state:paused]" style={{ animationDuration: column.speed }}>
                {[...column.posts, ...column.posts].map(([height, Icon, bright], k) => (
                  <Post key={k} height={height} Icon={Icon} bright={bright} />
                ))}
              </span>
            </span>
          ))}
        </span>
      </span>

      {/* Le trait de crayon qui barre le fil, de temps en temps (sans animation : toujours là) */}
      <svg aria-hidden viewBox="0 0 300 60" preserveAspectRatio="none" className="pointer-events-none absolute left-[6%] top-[26%] h-12 w-[88%] overflow-visible">
        <path
          d="M4 38 C 40 18, 70 44, 108 30 S 170 14, 204 32 S 262 42, 296 20"
          pathLength={1}
          strokeDasharray="1 2"
          className="animate-urge-strike"
          fill="none"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>

      <span aria-hidden className="grain pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay" />

      {/* Le texte et la flèche */}
      <span className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
        <span>
          <span className="block font-display text-[1.9rem] font-extrabold leading-[1.02] tracking-tight">
            J’ai envie
            <br />
            de scroller
          </span>
          <span aria-hidden className="mt-1.5 block text-[0.92rem] font-medium leading-snug text-white">
            Appuie : on la transforme en idée.
          </span>
        </span>
        <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-[#c4381a] shadow-[0_10px_24px_-10px_rgb(0_0_0/0.45)]">
          <ArrowRight className="size-6 animate-nudge" strokeWidth={2.8} />
        </span>
      </span>
    </button>
  )
}
