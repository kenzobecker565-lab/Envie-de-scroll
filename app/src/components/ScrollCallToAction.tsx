import { useId, useState } from 'react'

/** The main entry point stays a native button; animation never intercepts page scrolling. */
export function ScrollCallToAction({ onStart }: { onStart: () => void }) {
  const screenId = useId()
  const [pressed, setPressed] = useState(false)
  return <button type="button" className="studio-scroll-cta" data-tour-target="swipe" data-pressed={pressed} onClick={onStart}
    onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)}
    onPointerCancel={() => setPressed(false)} onPointerLeave={() => setPressed(false)} onBlur={() => setPressed(false)}>
    <svg className="scroll-cta-phone" width="32" height="38" viewBox="0 0 32 38" aria-hidden="true">
      <defs><clipPath id={screenId}><rect x="6" y="7" width="16" height="24" rx="2"/></clipPath></defs>
      <rect x="3" y="2" width="22" height="34" rx="6" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M11 5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <g clipPath={`url(#${screenId})`}><g className="scroll-cta-feed">
        {Array.from({ length: 9 }, (_, i) => <g key={i} transform={`translate(0 ${i * 8})`}>
          <rect x="7" y="8" width="14" height="5" rx="1.5" fill="currentColor" opacity={i % 3 === 0 ? .65 : .25}/>
          <path d="M9 10.5h5" stroke="#DAFFF0" strokeWidth="1.2" strokeLinecap="round"/>
        </g>)}
      </g></g>
      <g className="scroll-cta-gesture"><circle cx="23" cy="26" r="4" fill="#DAFFF0" stroke="currentColor" strokeWidth="1.5"/><path d="M23 25v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></g>
    </svg>
    <span className="scroll-cta-label">J’ai envie de scroll</span>
    <svg className="scroll-cta-arrows" width="26" height="28" viewBox="0 0 26 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path className="scroll-cta-arrow-top" d="m7 12 6-6 6 6"/>
      <path className="scroll-cta-arrow-bottom" d="m7 22 6-6 6 6"/>
    </svg>
  </button>
}
