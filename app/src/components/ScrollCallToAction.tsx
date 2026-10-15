import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { ArrowUp } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { Mascot } from './Mascot.tsx'

/** Home 3: a tactile circular dial, with feedback before the existing activity flow. */
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

  return <button type="button" className="grand-geste-cta declic-cta" data-tour-target="swipe"
    data-launching={launching} disabled={launching} aria-busy={launching} aria-labelledby={labelId}
    style={{ '--press-x': `${point.x}%`, '--press-y': `${point.y}%` } as CSSProperties}
    onPointerDown={event => {
      const box = event.currentTarget.getBoundingClientRect()
      setPoint({ x: (event.clientX - box.left) / box.width * 100, y: (event.clientY - box.top) / box.height * 100 })
    }} onClick={start}>
    <span className="declic-art" aria-hidden="true" />
    <span className="grand-geste-heading declic-heading" id={labelId}>J’ai envie<br/>de scroller.</span>
    <span className="declic-stage" aria-hidden="true">
      <span className="declic-ripple declic-ripple-outer"/>
      <span className="declic-ripple declic-ripple-inner"/>
      <span className="declic-dial">
        <span className="declic-arrow"><ArrowUp size={78} strokeWidth={2.8}/></span>
        <span className="declic-hint">Appuie pour<br/>changer d’élan</span>
      </span>
      <span className="declic-character"><Mascot pose="welcome" size={132} animated={false}/></span>
    </span>
    <span className="grand-geste-flash" aria-hidden="true"/>
  </button>
}
