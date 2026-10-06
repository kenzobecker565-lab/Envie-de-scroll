import { useEffect, useMemo, useRef, useState } from 'react'
import { noteLabel, type Lesson, type PlayedNote } from '@scroll-up/shared'
import { PianoKeyboard } from '../components/PianoKeyboard.tsx'
import { playNote, type NoteHandle } from '../lib/pianoSound.ts'
import { Button } from '../components/ui/button.tsx'
export function NotePlayback({ notes, label }: { notes: PlayedNote[]; label: string }) {
  const [playing, setPlaying] = useState(false),
    timers = useRef<number[]>([]),
    sounds = useRef<NoteHandle[]>([])
  const stop = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    sounds.current.forEach((h) => h.release())
    sounds.current = []
    setPlaying(false)
  }
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout)
      sounds.current.forEach((h) => h.release())
    },
    [],
  )
  const start = () => {
    stop()
    if (!notes.length) return
    setPlaying(true)
    const base = Math.min(...notes.map((n) => n.at))
    for (const n of notes) {
      timers.current.push(
        window.setTimeout(() => {
          const h = playNote(n.note)
          sounds.current.push(h)
          timers.current.push(window.setTimeout(() => h.release(), n.duration || 180))
        }, n.at - base),
      )
    }
    timers.current.push(window.setTimeout(stop, Math.max(...notes.map((n) => n.at + n.duration)) - base + 400))
  }
  return (
    <div className="learn-audio">
      <span>
        <strong>{label}</strong>
        <small>{notes.length} notes · enregistrement des touches</small>
      </span>
      <Button size="sm" variant="secondary" disabled={!notes.length} onClick={playing ? stop : start}>
        {playing ? 'Arrêter' : 'Écouter'}
      </Button>
    </div>
  )
}
export function LearningPiano({
  lesson,
  notes,
  onChange,
  review = false,
}: {
  lesson: Lesson
  notes: PlayedNote[]
  onChange: (v: PlayedNote[]) => void
  review?: boolean
}) {
  const [phraseMode, setPhraseMode] = useState(lesson.number >= 4)
  const melody = useMemo(
    () => ({
      title: lesson.title,
      notes: lesson.notes!,
      beats: lesson.beats,
      partStarts: phraseMode ? Array.from({ length: Math.ceil(lesson.notes!.length / 4) }, (_, i) => i) : undefined,
      phrases: lesson.notes!.reduce<string[][]>((a, n, i) => {
        if (i % 4 === 0) a.push([])
        a.at(-1)!.push(n)
        return a
      }, []),
    }),
    [lesson, phraseMode],
  )
  const [recording, setRecording] = useState(false),
    origin = useRef(0),
    held = useRef(new Map<string, number>()),
    current = useRef(notes),
    callback = useRef(onChange)
  callback.current = onChange
  current.current = notes
  const record = (note: string, down: boolean) => {
    if (!recording) return
    if (down) {
      if (current.current.length >= 1200) return
      held.current.set(note, performance.now())
      const next = [...current.current, { note, at: Math.round(performance.now() - origin.current), duration: 180 }]
      current.current = next
      callback.current(next)
    } else {
      const start = held.current.get(note)
      if (start === undefined) return
      const next = [...current.current]
      for (let i = next.length - 1; i >= 0; i--)
        if (next[i]!.note === note) {
          next[i] = { ...next[i]!, duration: Math.min(60000, Math.round(performance.now() - start)) }
          break
        }
      held.current.delete(note)
      current.current = next
      callback.current(next)
    }
  }
  const toggle = () => {
    if (recording) {
      for (const n of held.current.keys()) record(n, false)
      setRecording(false)
    } else {
      origin.current = performance.now()
      held.current.clear()
      current.current = []
      onChange([])
      setRecording(true)
    }
  }
  useEffect(() => {
    if (!recording) return
    const timer = window.setTimeout(() => {
      for (const n of held.current.keys()) record(n, false)
      setRecording(false)
    }, 300000)
    return () => window.clearTimeout(timer)
  }, [recording])
  const model = lesson.notes!.map((note, i) => ({
    note,
    at: lesson.beats!.slice(0, i).reduce((a, b) => a + b, 0) * 600,
    duration: lesson.beats![i]! * 550,
  }))
  const mismatch = notes.findIndex((n, i) => lesson.notes![i] !== n.note)
  return (
    <div className="learn-piano">
      {!review && (
        <>
          {lesson.number !== 11 && (
            <label className="learn-check">
              <input type="checkbox" checked={phraseMode} onChange={(e) => setPhraseMode(e.target.checked)} />
              Travailler phrase par phrase
            </label>
          )}
          <PianoKeyboard key={String(phraseMode)} melody={lesson.number === 11 ? undefined : melody} onNote={record} />
          <Button variant="secondary" onClick={toggle}>
            {recording ? 'Arrêter mon enregistrement' : 'Enregistrer un nouvel essai'}
          </Button>
          <small>Seules les touches jouées sont conservées. Durée maximale : 5 minutes.</small>
        </>
      )}
      <NotePlayback notes={notes} label="Mon essai" />
      <NotePlayback notes={model} label="Le modèle avec ses durées" />
      {lesson.visual === 'portee' && (
        <svg
          viewBox="0 0 320 130"
          role="img"
          aria-label="Portée : Mi sur la première ligne, Fa dans le premier interligne et Sol sur la deuxième ligne"
        >
          {[30, 45, 60, 75, 90].map((y) => (
            <path key={y} d={`M20 ${y}H300`} stroke="#90779c" />
          ))}
          {[90, 82.5, 75].map((y, i) => (
            <g key={i}>
              <ellipse cx={100 + i * 60} cy={y} rx="9" ry="6" fill="#633682" />
              <path d={`M${109 + i * 60} ${y}v-40`} stroke="#633682" />
              <text x={90 + i * 60} y="118" fontSize="13">
                {['Mi', 'Fa', 'Sol'][i]}
              </text>
            </g>
          ))}
        </svg>
      )}
      {review && notes.length > 0 && lesson.number !== 11 && (
        <p className="learn-mint">
          {mismatch >= 0
            ? `Note ${mismatch + 1} : tu as joué ${noteLabel(notes[mismatch]!.note)}${lesson.notes![mismatch] ? `, le modèle propose ${noteLabel(lesson.notes![mismatch]!)}` : '. Elle dépasse la phrase du modèle'}.`
            : notes.length < lesson.notes!.length
              ? 'Le début correspond ; il reste des notes à jouer.'
              : 'Les notes suivent le modèle. Réécoute pour comparer le rythme et les tenues.'}
        </p>
      )}
    </div>
  )
}
