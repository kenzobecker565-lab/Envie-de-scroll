import { useEffect, useId, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { Mascot } from './Mascot.tsx'

/** A single accessible action with a brief takeoff before the existing flow. */
export function ScrollCallToAction({ onStart }: { onStart: () => void }) {
  const [launching, setLaunching] = useState(false)
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

  return <section className="flight-scene" data-launching={launching} aria-labelledby={labelId}>
    <h2 className="grand-geste-heading" id={labelId}>J’ai envie<br/>de scroller.</h2>
    <p className="flight-subtitle">Transforme cette envie en une idée.</p>
    <div className="flight-stage" aria-hidden="true">
      <div className="flight-craft">
        <span className="flight-pilot"><Mascot pose="cheer" size={138} animated={false}/></span>
        <img className="flight-plane" src="/art/home-takeoff.webp" alt="" draggable={false}/>
      </div>
    </div>
    <button type="button" className="grand-geste-cta flight-launch" data-tour-target="swipe"
      data-launching={launching} disabled={launching} aria-busy={launching} onClick={start}>
      <span>Je me lance</span><ArrowUpRight size={30} aria-hidden="true"/>
    </button>
  </section>
}
