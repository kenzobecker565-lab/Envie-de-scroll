import { Eraser, Trash2, Undo2 } from 'lucide-react'
import { motion } from 'motion/react'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useEquipped } from '../lib/shop.ts'
import { cn } from '@/lib/utils'
import { haptics } from '../telegram/webApp.ts'

/**
 * Une feuille à dessiner au doigt, pour quand on n'a pas de papier sous la
 * main (au lit, dans le métro). Couleurs fixes (le dessin garde ses couleurs
 * quel que soit le thème), trois épaisseurs, gomme, annuler, tout effacer.
 * Le dessin part comme une photo : un JPEG carré de 1080 px.
 */

/** Résolution de la feuille, quelle que soit la taille de l'écran. */
const SIZE = 1080
const PAPER = '#FFFDF7'
const COLORS = [
  { name: 'Encre', value: '#1F1A17' },
  { name: 'Tomate', value: '#FF5A3C' },
  { name: 'Ciel', value: '#3B9AF5' },
  { name: 'Menthe', value: '#2FBF7F' },
  { name: 'Soleil', value: '#FFC53D' },
  { name: 'Lilas', value: '#9B7BF0' },
] as const
/** Épaisseurs, en pixels de la feuille (1080 px de côté). */
const WIDTHS = [
  { name: 'Fin', value: 6 },
  { name: 'Moyen', value: 16 },
  { name: 'Épais', value: 36 },
] as const

interface Stroke {
  color: string
  width: number
  points: { x: number; y: number }[]
}

export interface DrawingPadHandle {
  /** Le dessin, en JPEG, ou null si la feuille est vide. */
  toBlob(): Promise<Blob | null>
}

export const DrawingPad = forwardRef<DrawingPadHandle, { onInkChange?: (hasInk: boolean) => void; className?: string }>(function DrawingPad({ onInkChange, className }, ref) {
  const palette = useEquipped('palette')
  const colors = palette ? palette.colors.map((value, index) => ({ name: `${palette.title} ${index + 1}`, value })) : COLORS
  const canvas = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Stroke[]>([])
  const current = useRef<Stroke | null>(null)
  const [color, setColor] = useState<string>(COLORS[0].value)
  useEffect(() => { setColor(colors[0].value) }, [palette?.id])
  const [width, setWidth] = useState<number>(WIDTHS[1].value)
  const [erasing, setErasing] = useState(false)
  const [count, setCount] = useState(0)

  const context = () => canvas.current?.getContext('2d') ?? null

  /** Redessine tout (après « Annuler » ou « Tout effacer »). */
  const redraw = useCallback(() => {
    const ctx = context()
    if (!ctx) return
    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, SIZE, SIZE)
    for (const stroke of strokes.current) drawStroke(ctx, stroke)
  }, [])

  useEffect(() => redraw(), [redraw])
  useEffect(() => onInkChange?.(count > 0), [count, onInkChange])

  useImperativeHandle(ref, () => ({
    toBlob: () =>
      new Promise((resolve) => {
        if (!canvas.current || strokes.current.length === 0) return resolve(null)
        canvas.current.toBlob(resolve, 'image/jpeg', 0.9)
      }),
  }))

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: ((event.clientX - rect.left) / rect.width) * SIZE, y: ((event.clientY - rect.top) / rect.height) * SIZE }
  }

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const stroke: Stroke = { color: erasing ? PAPER : color, width: erasing ? width * 2 : width, points: [point(event)] }
    current.current = stroke
    const ctx = context()
    if (ctx) drawStroke(ctx, stroke)
  }

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const stroke = current.current
    const ctx = context()
    if (!stroke || !ctx) return
    // Les points intermédiaires (coalescés) rendent le trait plus fluide.
    const events = event.nativeEvent.getCoalescedEvents?.() ?? []
    const rect = event.currentTarget.getBoundingClientRect()
    const added = (events.length ? events : [event.nativeEvent]).map((native) => ({
      x: ((native.clientX - rect.left) / rect.width) * SIZE,
      y: ((native.clientY - rect.top) / rect.height) * SIZE,
    }))
    const from = Math.max(0, stroke.points.length - 2)
    stroke.points.push(...added)
    drawStroke(ctx, stroke, from)
  }

  const end = () => {
    if (!current.current) return
    strokes.current.push(current.current)
    current.current = null
    setCount(strokes.current.length)
  }

  const undo = () => {
    if (!strokes.current.length) return
    haptics.selection()
    strokes.current.pop()
    setCount(strokes.current.length)
    redraw()
  }

  const clear = () => {
    if (!strokes.current.length) return
    haptics.impact('medium')
    strokes.current = []
    setCount(0)
    redraw()
  }

  return (
    <div className={cn('drawing-pad flex flex-col gap-3', className)}>
      <motion.div
        className="overflow-hidden rounded-md border-[2.5px] border-outline shadow-card"
        initial={{ opacity: 0, scale: 0.95, rotate: -1.5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
      >
        <canvas
          ref={canvas}
          width={SIZE}
          height={SIZE}
          className="block aspect-square w-full touch-none select-none"
          style={{ backgroundColor: PAPER, cursor: 'crosshair' }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
          role="img"
          aria-label={count ? `Ton dessin, ${count} traits` : 'Feuille blanche : dessine au doigt'}
        />
      </motion.div>

      {/* Couleurs et gomme. */}
      <div className="flex items-center justify-between gap-2" role="toolbar" aria-label="Outils de dessin">
        <div className="flex flex-wrap items-center gap-1.5">
          {colors.map((option) => {
            const active = !erasing && color === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  haptics.selection()
                  setColor(option.value)
                  setErasing(false)
                }}
                aria-label={option.name}
                aria-pressed={active}
                className={cn('h-8 w-8 rounded-pill border-[2.5px] border-outline transition-transform duration-150', active ? '-translate-y-1 scale-110 shadow-chip' : '')}
                style={{ backgroundColor: option.value }}
              />
            )
          })}
        </div>
        <ToolButton label="Gomme" pressed={erasing} onClick={() => setErasing((value) => !value)}>
          <Eraser aria-hidden="true" />
        </ToolButton>
      </div>

      {/* Épaisseur, annuler, tout effacer. */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Épaisseur du trait">
          {WIDTHS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={width === option.value}
              aria-label={option.name}
              onClick={() => {
                haptics.selection()
                setWidth(option.value)
              }}
              className={cn('flex h-10 w-10 items-center justify-center rounded-pill border-2 border-outline', width === option.value ? 'bg-surface-200 shadow-chip' : 'bg-card')}
            >
              <span className="rounded-pill bg-ink" style={{ width: 4 + option.value / 3, height: 4 + option.value / 3 }} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <ToolButton label="Annuler le dernier trait" disabled={!count} onClick={undo}>
            <Undo2 aria-hidden="true" />
          </ToolButton>
          <ToolButton label="Tout effacer" disabled={!count} onClick={clear}>
            <Trash2 aria-hidden="true" />
          </ToolButton>
        </div>
      </div>
    </div>
  )
})

function ToolButton({ label, pressed, disabled, onClick, children }: { label: string; pressed?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => {
        haptics.selection()
        onClick()
      }}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-pill border-2 border-outline text-ink disabled:border-ink-faint disabled:text-ink-faint [&>svg]:size-[18px] [&>svg]:stroke-[2.4]',
        pressed ? 'bg-warm text-on-color shadow-chip' : 'bg-card',
      )}
    >
      {children}
    </button>
  )
}

/** Trace un trait lissé (courbes entre les milieux des points), à partir du point `from`. */
function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, from = 0) {
  const { points } = stroke
  ctx.strokeStyle = stroke.color
  ctx.fillStyle = stroke.color
  ctx.lineWidth = stroke.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (points.length === 1) {
    const [only] = points
    ctx.beginPath()
    ctx.arc(only!.x, only!.y, stroke.width / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  const start = points[from]!
  ctx.moveTo(start.x, start.y)
  for (let index = from + 1; index < points.length - 1; index++) {
    const point = points[index]!
    const next = points[index + 1]!
    ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2)
  }
  const last = points[points.length - 1]!
  ctx.lineTo(last.x, last.y)
  ctx.stroke()
}
