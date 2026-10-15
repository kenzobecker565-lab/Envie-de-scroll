import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { ArrowUp } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { Mascot } from './Mascot.tsx'

/** A native, keyboard-accessible button. Let the ribbon finish before navigating. */
export function ScrollCallToAction({ onStart }: { onStart: () => void }) {
  const [launching, setLaunching] = useState(false)
  const [point, setPoint] = useState({ x: 50, y: 60 })
  const started = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const reducedMotion = useReducedMotion()
  const labelId = useId()
  useEffect(() => () => { if (timer.current !== undefined) clearTimeout(timer.current) }, [])

  const start = () => {
    if (started.current) return
    started.current = true
    setLaunching(true)
    // Motion-sensitive users go straight to the existing activity flow.
    timer.current = setTimeout(onStart, reducedMotion ? 0 : 520)
  }

  return <button type="button" className="grand-geste-cta" data-tour-target="swipe"
    data-launching={launching} disabled={launching} aria-busy={launching} aria-labelledby={labelId}
    style={{ '--press-x': `${point.x}%`, '--press-y': `${point.y}%` } as CSSProperties}
    onPointerDown={event => {
      const box = event.currentTarget.getBoundingClientRect()
      setPoint({ x: (event.clientX - box.left) / box.width * 100, y: (event.clientY - box.top) / box.height * 100 })
    }} onClick={start}>
    <span className="grand-geste-art" aria-hidden="true" />
    <span className="grand-geste-heading" id={labelId}>J’ai envie<br/>de scroller.</span>
    <span className="grand-geste-hint">Appuie pour changer d’élan</span>
    <span className="grand-geste-character" aria-hidden="true"><Mascot pose="idea" size={158} animated={false}/></span>
    <span className="grand-geste-ribbon" aria-hidden="true">
      <svg viewBox="0 0 360 360" fill="none" preserveAspectRatio="none">
        <path className="grand-geste-trail" d="M24 380C37 302 287 302 225 221C173 153 100 185 161 81C177 54 185 32 185 8"/>
        <path className="grand-geste-comet" d="M24 380C37 302 287 302 225 221C173 153 100 185 161 81C177 54 185 32 185 8" pathLength="100"/>
      </svg>
      <span className="grand-geste-grip"><ArrowUp size={36} strokeWidth={2.5}/></span>
    </span>
    <span className="grand-geste-flash" aria-hidden="true"/>
  </button>
}
