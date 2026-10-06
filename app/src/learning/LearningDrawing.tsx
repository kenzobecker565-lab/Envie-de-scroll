import { useRef, useState } from 'react'
import type { InkStroke, Lesson } from '@scroll-up/shared'
import { Button } from '../components/ui/button.tsx'
export function InkView({ strokes }: { strokes: InkStroke[] }) {
  return (
    <svg viewBox="0 0 600 600" aria-label="Mon dessin" role="img">
      {strokes.map((s, i) => (
        <path
          key={i}
          d={
            s.points.map((p, j) => `${j ? 'L' : 'M'}${p.x},${p.y}`).join(' ') + (s.points.length === 1 ? 'l.1,.1' : '')
          }
          fill="none"
          stroke={s.color}
          strokeWidth={s.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
export function DrawingExample({ visual, step = 2 }: { visual?: string; step?: number }) {
  const grid = step > 0,
    shade = step > 1
  return (
    <svg
      className="learn-example-svg"
      viewBox="0 0 360 240"
      role="img"
      aria-label={`Démonstration : ${visual ?? 'formes'}, étape ${step + 1}`}
    >
      <defs>
        <radialGradient id="learn-sphere" cx="28%" cy="25%" r="76%">
          <stop offset="0" stopColor="#fffdf5" />
          <stop offset=".5" stopColor="#c5bbc9" />
          <stop offset="1" stopColor="#4c3a60" />
        </radialGradient>
        <linearGradient id="learn-cylinder">
          <stop stopColor="#604d73" />
          <stop offset=".7" stopColor="#f3eee6" />
        </linearGradient>
      </defs>
      <rect width="360" height="240" rx="16" fill="#faf5ec" />
      {visual === 'trait' ? (
        <g fill="none" stroke="#745984" strokeWidth="3">
          <path d="M40 60H300" />
          {grid && <path d="M40 120Q110 25 175 120T320 120" />}
          {shade && <path d="M40 190Q100 130 160 190T300 190" />}
          {[40, 170, 300].map((x) => (
            <circle key={x} cx={x} cy="60" r="5" fill="#933aff" />
          ))}
        </g>
      ) : visual === 'perspective' ? (
        <g fill="none" stroke="#7b638e" strokeWidth="2">
          <path d="M0 85H360M0 0L180 85 360 0M0 240L180 85 360 240" />
          <rect x="125" y="55" width="110" height="85" />
          {grid && <path d="M65 160V40L100 52V136" />}
          <circle cx="180" cy="85" r="4" fill="#933aff" />
        </g>
      ) : visual === 'visage' ? (
        <g fill="none" stroke="#7b638e" strokeWidth="2">
          <ellipse cx="180" cy="122" rx="66" ry="91" />
          {grid && <path d="M180 32V213M114 120H246M163 164H197M151 186H209" />}
          {shade && <path d="M134 121q16-10 30 0m32 0q16-10 30 0M180 131l-6 29 11 2" />}
        </g>
      ) : visual === 'silhouette' ? (
        <g fill="none" stroke="#745984" strokeWidth="8" strokeLinecap="round">
          <circle cx="170" cy="40" r="19" />
          <path d="M170 63L185 119 159 169 136 218M185 119L220 163 256 193M179 91L126 125 93 90M179 91L224 65 244 29" />
          {grid && <path d="M145 222H166M245 199H267" stroke="#933aff" strokeWidth="3" />}
        </g>
      ) : visual === 'valeurs' ? (
        <g>
          {['#eee9e1', '#ab9daf', '#4b385a'].map((c, i) => (
            <rect key={c} x={32 + i * 103} y="25" width="90" height="65" fill={c} rx="6" />
          ))}
          <circle cx="180" cy="164" r="51" fill={shade ? 'url(#learn-sphere)' : '#eee9e1'} stroke="#9c8b9e" />
        </g>
      ) : visual === 'proportions' ? (
        <g fill="none" stroke="#806987" strokeWidth="2">
          <rect x="136" y="25" width="88" height="196" strokeDasharray="5 5" />
          <path d="M162 25H198V64L220 100V215H140V100L162 64Z" />
          {grid && <path d="M113 25V221M106 25H120M106 221H120" stroke="#933aff" />}
        </g>
      ) : visual === 'composition' ? (
        <g fill="none" stroke="#81688f" strokeWidth="2">
          {[12, 128, 244].map((x, i) => (
            <g key={x}>
              <rect x={x} y="60" width="103" height="115" rx="5" />
              <path d={`M${x + 20 + i * 12} 100v40h30v-40z`} />
              <path d={`M${x + 50 + i * 12} 105q23 12 0 25`} />
            </g>
          ))}
        </g>
      ) : visual === 'matieres' ? (
        <g stroke="#7b6684" strokeWidth="2" fill="none">
          {[0, 1, 2].map((i) => (
            <rect key={i} x={20 + i * 110} y="65" width="95" height="120" rx="4" />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${28 + i * 16} 73q25 40 0 103M140 ${80 + i * 22}q30-24 55 0`} />
          ))}
          <path d="M256 75V175M267 75V175M292 75V175" strokeWidth="9" />
        </g>
      ) : visual === 'formes' ? (
        <g fill="none" stroke="#7b6586" strokeWidth="3">
          <path d="M110 30H250L278 109H82ZM180 109V202M130 202H230" />
          {grid && <ellipse cx="180" cy="207" rx="53" ry="9" />}
        </g>
      ) : visual === 'volumes' || visual === 'scene' ? (
        <g stroke="#806987" strokeWidth="2" fill="none">
          <path d="M40 100L95 72 150 100 95 128zM40 100v76l55 30 55-30V100M95 128v78" />
          <path d="M216 70v126q35 21 70 0V70" fill={shade ? 'url(#learn-cylinder)' : 'none'} />
          <ellipse cx="251" cy="70" rx="35" ry="13" />
          {grid && <path d="M286 95q46 8 0 63" />}
        </g>
      ) : (
        <g>
          {shade && <ellipse cx="240" cy="198" rx="76" ry="15" fill="#4b395c" opacity=".25" />}
          <circle
            cx="173"
            cy="122"
            r="76"
            fill={shade ? 'url(#learn-sphere)' : '#f7f2e9'}
            stroke="#8d7a99"
            strokeWidth="2"
          />
          {grid && (
            <>
              <circle cx="42" cy="33" r="12" fill="#edc773" />
              <path d="M59 47L97 80M84 78l13 2-2-13" fill="none" stroke="#735282" strokeWidth="2" />
            </>
          )}
        </g>
      )}
    </svg>
  )
}
export function LearningDrawing({
  lesson,
  value,
  onChange,
}: {
  lesson: Lesson
  value: InkStroke[]
  onChange: (v: InkStroke[]) => void
}) {
  const ref = useRef<SVGSVGElement>(null),
    active = useRef<InkStroke | null>(null),
    [live, setLive] = useState<InkStroke>(),
    [color, setColor] = useState('#4b365b'),
    [width, setWidth] = useState(4),
    [guide, setGuide] = useState(true),
    [zoom, setZoom] = useState(1),
    [erasing, setErasing] = useState(false),
    [warning, setWarning] = useState('')
  const point = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    return {
      x: Math.round(Math.max(0, Math.min(600, ((e.clientX - r.left) * 600) / r.width))),
      y: Math.round(Math.max(0, Math.min(600, ((e.clientY - r.top) * 600) / r.height))),
    }
  }
  const end = () => {
    if (!active.current) return
    onChange([...value, active.current])
    active.current = null
    setLive(undefined)
  }
  return (
    <div className="learn-drawing">
      <div className="learn-draw-scroll">
        <div className="learn-draw-page" style={{ width: `${zoom * 100}%`, aspectRatio: '1' }}>
          {guide && (
            <div className="learn-draw-guide" aria-hidden="true">
              <DrawingExample visual={lesson.visual} step={0} />
            </div>
          )}
          <svg
            ref={ref}
            viewBox="0 0 600 600"
            aria-label="Feuille de dessin tactile"
            role="img"
            onPointerDown={(e) => {
              if (value.length >= 400 || value.reduce((n, s) => n + s.points.length, 0) > 11500) {
                setWarning('Ta feuille est bien remplie. Enregistre cet essai ou annule quelques traits.')
                return
              }
              e.currentTarget.setPointerCapture(e.pointerId)
              active.current = {
                color: erasing ? '#fffaf3' : color,
                width: erasing ? width * 3 : width,
                points: [point(e)],
              }
              setLive({ ...active.current })
            }}
            onPointerMove={(e) => {
              if (
                !active.current ||
                active.current.points.length >= 800 ||
                value.reduce((n, s) => n + s.points.length, 0) + active.current.points.length >= 12000
              )
                return
              const p = point(e),
                last = active.current.points.at(-1)!
              if (Math.hypot(p.x - last.x, p.y - last.y) < 2) return
              active.current.points.push(p)
              setLive({ ...active.current })
            }}
            onPointerUp={end}
            onPointerCancel={end}
          >
            {[...value, ...(live ? [live] : [])].map((s, i) => (
              <path
                key={i}
                d={
                  s.points.map((p, j) => `${j ? 'L' : 'M'}${p.x},${p.y}`).join(' ') +
                  (s.points.length === 1 ? 'l.1,.1' : '')
                }
                fill="none"
                stroke={s.color}
                strokeWidth={s.width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        </div>
      </div>
      <div className="learn-tools">
        {['#4b365b', '#a99cad', '#ded8d1', '#933aff'].map((c) => (
          <button
            type="button"
            key={c}
            className="learn-swatch"
            style={{ background: c }}
            aria-label={`Couleur ${c}`}
            aria-pressed={color === c && !erasing}
            onClick={() => {
              setColor(c)
              setErasing(false)
            }}
          />
        ))}
        <Button size="sm" variant="secondary" onClick={() => setErasing(!erasing)}>
          {erasing ? 'Crayon' : 'Gomme'}
        </Button>
        <Button size="sm" variant="secondary" disabled={!value.length} onClick={() => onChange(value.slice(0, -1))}>
          Annuler
        </Button>
      </div>
      <label>
        Taille du trait{' '}
        <input type="range" min="2" max="20" value={width} onChange={(e) => setWidth(+e.target.value)} />
      </label>
      <div className="learn-tools">
        <label>
          <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} /> Afficher les repères
        </label>
        <label>
          Zoom{' '}
          <select value={zoom} onChange={(e) => setZoom(+e.target.value)}>
            <option value="1">100 %</option>
            <option value="1.5">150 %</option>
            <option value="2">200 %</option>
          </select>
        </label>
      </div>
      {warning && <p role="status">{warning}</p>}
    </div>
  )
}
