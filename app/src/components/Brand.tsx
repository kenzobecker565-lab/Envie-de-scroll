import { cn } from '@/lib/utils'

export function LogoIcon({ size = 32, className }: { size?: number; square?: boolean; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={cn('shrink-0', className)}><path d="M18 1 Q20 0 20 4 L21 11 Q22 14 26 15 L33 17 Q36 18 32 20 L25 22 Q22 23 21 27 L19 34 Q18 38 16 34 L14 27 Q13 24 9 23 L2 21 Q-1 20 3 18 L10 16 Q13 15 14 11 L16 3Z" fill="#AA6AFB"/><path d="M31 26 L33 31 L39 33 L33 35 L31 40 L29 35 L24 33 L29 31Z" fill="#CB9EFF"/></svg>
}
export function Wordmark({ height = 20, decorative = false, className, style }: { height?: number; decorative?: boolean; className?: string; style?: React.CSSProperties }) {
  return <span className={cn('brand-wordmark', className)} style={{fontSize:height*1.3,...style}} {...(decorative ? {'aria-hidden':true} : {role:'img','aria-label':'Scroll-up'})}>Scroll-up</span>
}
export function Logo({ height = 32, className }: { height?: number; className?: string }) {
 return <span className={cn('inline-flex shrink-0 items-center gap-2',className)} role="img" aria-label="Scroll-up"><LogoIcon size={height}/><Wordmark height={height*.59} decorative/></span>
}
export function BrandMark({ size = 28 }: { size?: number }) {
 return <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0"><rect x="3" y="5" width="34" height="33" rx="10" fill="#5426ad" stroke="#241047" strokeWidth="1.5"/><rect x="3" y="2" width="34" height="33" rx="10" fill="#9262ec" stroke="#39206b" strokeWidth="1.5"/><rect x="6" y="5" width="28" height="27" rx="7" fill="#fff9e9"/><path d="M26 5h6l2 7Z" fill="#ffca46"/><rect x="11" y="11" width="19" height="17" rx="5" fill="#ffce46" stroke="#e9a526"/><path d="m15 23 2-8 4 6 4-6 1 8" fill="none" stroke="#663298" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
