import { useRef, useState, type CSSProperties } from 'react'

/** The creative portal stays a native button and leaves vertical scrolling to the browser. */
export function ScrollCallToAction({ onStart }: { onStart: () => void }) {
  const [pressed, setPressed] = useState(false)
  const [point, setPoint] = useState({ x: 0, y: 0 })
  const [launching, setLaunching] = useState(false)
  const started = useRef(false)
  const start = () => {
    if (started.current) return
    started.current = true
    setLaunching(true)
    onStart()
  }
  return <button type="button" className="studio-scroll-cta" data-tour-target="swipe" data-pressed={pressed} data-launching={launching}
    style={{ '--press-x': `${point.x}px`, '--press-y': `${point.y}px` } as CSSProperties} onClick={start}
    onPointerDown={event => { const box = event.currentTarget.getBoundingClientRect(); setPoint({ x: event.clientX - box.left, y: event.clientY - box.top }); setPressed(true) }}
    onPointerUp={() => setPressed(false)} onPointerCancel={() => setPressed(false)} onPointerLeave={() => setPressed(false)} onBlur={() => setPressed(false)}>
    <span className="scroll-portal-cards" aria-hidden="true">
      <span className="scroll-portal-card"><span className="scroll-portal-paper">
        <svg viewBox="0 0 48 48" width="43" height="43"><rect x="5" y="7" width="38" height="34" rx="4" fill="#3B204E"/>{[0,1,2,3,4].map(i => <rect key={i} x={8+i*7} y="10" width="6" height="28" rx="1" fill="#FFFEF5"/>)}{[0,1,3].map(i => <rect key={i} x={12+i*7} y="10" width="4" height="17" rx="1" fill="#3B204E"/>)}</svg>
      </span></span>
      <span className="scroll-portal-card"><span className="scroll-portal-paper">
        <svg viewBox="0 0 48 48" width="43" height="43" fill="none"><path d="M8 36c-4 6 4 10 10 4s10 3 16-2" stroke="#B379E9" strokeWidth="4" strokeLinecap="round"/><path d="m20 27 16-20c3-3 6-1 4 3L25 31Z" fill="#AF74DD" stroke="#482459" strokeWidth="2"/><path d="M21 26c-6-2-7 3-7 8 5 0 11-1 10-6" fill="#60317A"/></svg>
      </span></span>
      <span className="scroll-portal-card"><span className="scroll-portal-paper">
        <svg viewBox="0 0 48 48" width="43" height="43"><text x="5" y="33" fontFamily="Georgia, serif" fontStyle="italic" fontSize="29" fill="#482459">Aa</text><path d="M8 39h30" stroke="#AC8353" strokeWidth="1.7" strokeLinecap="round"/></svg>
      </span></span>
    </span>
    <span className="scroll-portal-surface" aria-hidden="true"><span className="scroll-portal-ripple"/></span>
    <span className="scroll-cta-label">J’ai envie de scroll</span>
    <span className="scroll-portal-launch" aria-hidden="true"><svg width="27" height="27" viewBox="0 0 27 27" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m7 16 6.5-6.5L20 16"/></svg></span>
  </button>
}
