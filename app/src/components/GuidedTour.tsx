import { ChevronRight } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { api, track } from '../api/client.ts'
import { rememberTutorial, TOUR_STEPS, tourCardPosition, type TourRect } from '../lib/tutorial.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { useBackButtonOverlay } from '../telegram/buttons.ts'
import { haptics } from '../telegram/webApp.ts'
import { MinutonFigure } from './Mascot.tsx'
import './GuidedTour.css'

/** A modal coach above the real home; spotlight coordinates follow scrolling and resizing. */
export function GuidedTour() {
  const { state, dispatch } = useAppState()
  const { push } = useNavigation()
  const [step, setStep] = useState(0)
  const [rects, setRects] = useState<TourRect[]>([])
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [cardHeight, setCardHeight] = useState(230)
  const card = useRef<HTMLDivElement>(null)
  const finishing = useRef(false)
  const maskId = useId().replace(/:/g, '')
  const current = TOUR_STEPS[step] ?? TOUR_STEPS[0]
  const last = step === TOUR_STEPS.length - 1

  const finish = useCallback((start = false) => {
    if (finishing.current) return
    finishing.current = true
    rememberTutorial(state.me.user.id)
    dispatch({ type: 'tutorialCompleted' })
    // Saving must never hold up a first activity. A local fallback also prevents repeat prompts.
    void api.updateSettings({ tutorialCompleted: true }).catch(() => {})
    haptics.impact('light')
    if (start) { track('cta', { from: 'tutorial' }); dispatch({ type: 'newFlow' }); push({ name: 'signal' }) }
  }, [dispatch, push, state.me.user.id])
  useBackButtonOverlay(() => finish())

  useLayoutEffect(() => {
    let frame = 0
    let alive = true
    let scrolled = false
    const selector = (target: string) => `[data-tour-target="${target}"]`
    const measure = () => {
      if (!alive) return
      const elements = current.targets.map(target => document.querySelector<HTMLElement>(selector(target)))
      if (elements.some(element => !element)) { frame = requestAnimationFrame(measure); return }
      const first = elements[0]!.getBoundingClientRect()
      const height = window.visualViewport?.height ?? window.innerHeight
      const nav = document.querySelector('.studio-tabbar')?.getBoundingClientRect()
      const bottom = nav ? Math.min(height, nav.top) : height - 16
      if (!scrolled && (first.top < 16 || first.bottom > bottom - 12)) {
        scrolled = true
        elements[0]!.scrollIntoView({ block: 'center', behavior: 'instant' })
      }
      setViewport({ width: window.innerWidth, height })
      setRects(elements.map(element => {
        const r = element!.getBoundingClientRect()
        return { x: r.left - 5, y: r.top - 5, width: r.width + 10, height: r.height + 10 }
      }))
    }
    frame = requestAnimationFrame(measure)
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    window.visualViewport?.addEventListener('resize', measure)
    // Router and tab-bar transitions finish after their first layout. Recheck those coordinates.
    const settled = window.setTimeout(measure, 500)
    return () => {
      alive = false; cancelAnimationFrame(frame); clearTimeout(settled); observer.disconnect()
      window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [current])

  useLayoutEffect(() => {
    if (!card.current) return
    const measure = () => { if (card.current) setCardHeight(card.current.getBoundingClientRect().height) }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(card.current)
    return () => observer.disconnect()
  }, [rects.length])
  useEffect(() => { card.current?.focus({ preventScroll: true }) }, [step])

  useLayoutEffect(() => {
    if (!rects[0]) return
    const p = tourCardPosition(rects[0], viewport, cardHeight)
    const overlap = rects[0].y + rects[0].height + 20 - p.top
    if (p.side === 'below' && overlap > 1 && rects[0].y > 100) window.scrollBy({ top: overlap, behavior: 'instant' })
  }, [rects, viewport, cardHeight])

  if (!rects.length) return null
  const position = tourCardPosition(rects[0]!, viewport, cardHeight)
  return <DialogPrimitive.Root open onOpenChange={open => { if (!open) finish() }}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="tour-overlay">
        <svg width="100%" height="100%" aria-hidden="true">
          <defs><mask id={maskId}><rect width="100%" height="100%" fill="white"/>{rects.map((r, index) => <rect key={index} {...r} rx={step === 0 || step === 3 && index === 0 ? 30 : 19} fill="black"/>)}</mask></defs>
          <rect width="100%" height="100%" fill="#050A21" fillOpacity=".68" mask={`url(#${maskId})`}/>
          {rects.map((r, index) => <g key={index} className="tour-focus-ring"><rect {...r} rx={step === 0 || step === 3 && index === 0 ? 30 : 19} fill="none" stroke="#AD69FF" strokeWidth="5"/><rect {...r} rx={step === 0 || step === 3 && index === 0 ? 30 : 19} fill="none" stroke="#FFF7FF" strokeWidth="2"/></g>)}
        </svg>
      </DialogPrimitive.Overlay>
      <DialogPrimitive.Content ref={card} tabIndex={-1} className="tour-card" data-side={position.side} style={{ top: position.top, left: position.left, width: position.width, maxHeight: viewport.height - 32 }} onOpenAutoFocus={event => { event.preventDefault(); card.current?.focus({ preventScroll: true }) }} onCloseAutoFocus={event => { event.preventDefault(); requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-tour-target="swipe"]')?.focus({ preventScroll: true })) }} onPointerDownOutside={event => event.preventDefault()}>
        {position.showPointer && <span className="tour-pointer" style={{ left: position.pointer }} aria-hidden="true"/>}
        <span className="tour-minuton"><MinutonFigure pose={(['welcome','draw','idea','cheer'] as const)[step]} size={77} animated={false}/></span>
        <div className="tour-card-body">
          <div className="tour-progress" aria-label={`Étape ${step + 1} sur ${TOUR_STEPS.length}`}><span>{step + 1}/{TOUR_STEPS.length}</span><span className="tour-dots" aria-hidden="true">{TOUR_STEPS.map((_, i) => <i key={i} data-done={i <= step}/>)}</span></div>
          <DialogPrimitive.Title>{current.title}</DialogPrimitive.Title>
          <DialogPrimitive.Description>{current.text}</DialogPrimitive.Description>
          <div className="tour-controls"><button type="button" onClick={() => finish()}>Passer</button><button type="button" className={last ? 'tour-start' : 'tour-next'} onClick={() => { if (last) finish(true); else { haptics.selection(); setStep(value => value + 1) } }}>{last ? 'Faire mon premier swipe' : 'Suivant'}{!last && <ChevronRight size={19}/>}</button></div>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
}
