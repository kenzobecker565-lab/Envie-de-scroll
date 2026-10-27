import { useEffect, useRef, useState } from 'react'
import { BookOpen, Check, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import {
  LEARNING_LESSONS,
  LEARNING_LEVELS,
  LEARNING_PASSIONS,
  emptyLearningWork,
  getPassion,
  learningCorrect,
  learningAttempted,
  learningLesson,
  validateLearning,
  SPORT_SOURCES,
  type LearningPassion,
  type LearningWork,
  type Lesson,
  type PassionId,
  type SportExerciseId,
  type StudioTask,
} from '@scroll-up/shared'
import { api } from '../api/client.ts'
import { AppHeader } from '../components/AppHeader.tsx'
import { Screen } from '../components/Screen.tsx'
import { Button } from '../components/ui/button.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { PassionArtwork } from '../components/PassionArtwork.tsx'
import { SportInstructions } from '../components/SportMovement.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { useLearning } from './useLearning.ts'
import { DrawingExample, InkView, LearningDrawing } from './LearningDrawing.tsx'
import { LearningPiano, NotePlayback } from './LearningPiano.tsx'
import './Learning.css'
export function LearningOverview({ passion }: { passion?: PassionId }) {
  const { push } = useNavigation(),
    { items, loading, error, reload } = useLearning(),
    current = items.find((i) => !i.completed && (!passion || i.passion === passion)),
    lessons = LEARNING_LESSONS.filter((l) => l.passion === passion)
  const known = new Set(items.filter((i) => i.completed).map((i) => i.lessonId))
  const practiced = new Set(items.filter((i) => i.attempted).map((i) => i.lessonId))
  return (
    <Screen tabs className="learning-screen">
      <AppHeader />
      <header className="learn-heading">
        <div>
          <span className="learn-eyebrow">À ton rythme</span>
          <h1>{passion ? getPassion(passion).label : 'Apprendre'}</h1>
          <p>{passion ? '12 leçons · 3 niveaux · des exercices dédiés' : 'Comprendre, essayer, puis progresser.'}</p>
        </div>
        <Mascot pose="idea" size={76} />
      </header>
      {passion && (
        <button className="learn-text-button" onClick={() => push({ name: 'learn' })}>
          <ChevronLeft size={16} />
          Toutes les passions
        </button>
      )}
      {loading && <p role="status">Chargement de tes carnets…</p>}
      {error && (
        <div role="alert" className="learn-message">
          <p>{error}</p>
          <Button variant="secondary" onClick={() => void reload()}>
            Réessayer
          </Button>
        </div>
      )}
      {current && (
        <section className="learn-resume">
          <small>Ta leçon en cours</small>
          <h2>{current.title}</h2>
          <Button onClick={() => push({ name: 'learningLesson', lessonId: current.lessonId, entryId: current.id })}>
            Continuer ma leçon
            <ChevronRight size={17} />
          </Button>
        </section>
      )}
      {!passion ? (
        <div className="learn-passions">
          {LEARNING_PASSIONS.map((id) => (
            <button className="learn-row" key={id} onClick={() => push({ name: 'learnPassion', passion: id })}>
              <PassionArtwork passion={id} />
              <span>
                <strong>{getPassion(id).label}</strong>
                <small>
                  {LEARNING_LESSONS.filter((l) => l.passion === id && known.has(l.id)).length} / 12 leçons consultées
                </small>
                <small>{items.filter(i => i.passion === id && i.attempted && i.completed).length} essais conservés{['francais','logique'].includes(id) && ` · ${new Set(items.filter(i => i.passion === id && i.mastered).map(i => i.lessonId)).size} résolues sans aide`}</small>
              </span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      ) : (
        LEARNING_LEVELS.map((level, index) => (
          <section key={level} className="learn-level">
            <div className="learn-section-title">
              <span>{index + 1}</span>
              <h2>{level}</h2>
            </div>
            {lessons
              .filter((l) => l.level === index)
              .map((l) => {
                const entry = items.find((i) => i.lessonId === l.id),
                  mastered = items.some((i) => i.lessonId === l.id && i.mastered)
                return (
                  <button
                    className="learn-row"
                    key={l.id}
                    onClick={() =>
                      push({
                        name: 'learningLesson',
                        lessonId: l.id,
                        ...(entry && !entry.completed ? { entryId: entry.id } : {}),
                      })
                    }
                  >
                    <span className="learn-number">{known.has(l.id) ? <Check size={18} /> : l.number}</span>
                    <span>
                      <strong>{l.title}</strong>
                      <small>{l.goal}</small>
                      <small>
                        {mastered
                          ? 'Exercices résolus sans aide'
                          : items.some(i => i.lessonId === l.id && i.review)
                            ? 'À revoir · reprendre la leçon'
                          : practiced.has(l.id)
                            ? 'Essayée · poursuivre ma pratique'
                          : known.has(l.id)
                            ? 'Consultée · faire un premier essai'
                            : 'Découvrir · pratiquer · faire le point'}
                      </small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                )
              })}
          </section>
        ))
      )}
      <button
        className="learn-notebook-link"
        onClick={() => push({ name: 'learningNotebooks', passion: passion as LearningPassion | undefined })}
      >
        <BookOpen />
        <span>
          <strong>Mes carnets d’apprentissage</strong>
          <small>Essais, dessins, textes et enregistrements</small>
        </span>
        <ChevronRight />
      </button>
      {passion === 'francais' && (
        <button
          className="learn-notebook-link"
          onClick={() => push({ name: 'learningNotebooks', passion: 'francais', review: true })}
        >
          <RotateCcw />
          <span>
            <strong>Mes règles à revoir</strong>
            <small>Retrouver mes leçons à retravailler</small>
          </span>
        </button>
      )}
    </Screen>
  )
}
export function LearningNotebooks({ passion, review = false }: { passion?: LearningPassion; review?: boolean }) {
  const { push } = useNavigation(),
    { items, loading, error, reload } = useLearning(),
    [filter, setFilter] = useState(passion ?? 'all'),
    [onlyReview, setOnlyReview] = useState(review)
  const shown = items.filter((i) => (i.attempted || (onlyReview && i.review)) && (filter === 'all' || i.passion === filter) && (!onlyReview || i.review))
  return (
    <Screen tabs className="learning-screen">
      <AppHeader />
      <h1>Mes carnets d’apprentissage</h1>
      <p>Chaque essai conserve son contenu. Les activités scroll restent dans Chez Minuton.</p>
      <div className="learn-filters">
        <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          Tout
        </button>
        {LEARNING_PASSIONS.map((p) => (
          <button aria-pressed={filter === p} key={p} onClick={() => setFilter(p)}>
            {getPassion(p).label}
          </button>
        ))}
      </div>
      <label className="learn-check">
        <input type="checkbox" checked={onlyReview} onChange={(e) => setOnlyReview(e.target.checked)} />À revoir
        uniquement
      </label>
      {loading ? (
        <p role="status">Chargement…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <Button onClick={() => void reload()}>Réessayer</Button>
        </div>
      ) : shown.length ? (
        shown.map((i) => (
          <button
            key={i.id}
            className="learn-row"
            onClick={() => push({ name: 'learningLesson', lessonId: i.lessonId, entryId: i.id })}
          >
            <BookOpen />
            <span>
              <strong>{i.title}</strong>
              <small>
                {getPassion(i.passion).label} · {new Date(i.updatedAt).toLocaleDateString('fr-FR')}
              </small>
              <small>
                {i.mastered ? 'Résolu sans aide' : !i.attempted ? 'Leçon consultée' : i.completed ? 'Essai conservé' : 'Essai en cours'}
                {i.review ? ' · À revoir' : ''}
              </small>
            </span>
            <ChevronRight />
          </button>
        ))
      ) : (
        <section className="learn-card">
          <Mascot pose="wait" size={84} />
          <h2>{onlyReview ? 'Aucune leçon à revoir' : 'Ton carnet attend tes premiers essais'}</h2>
          <Button onClick={() => push({ name: 'learn' })}>Découvrir les leçons</Button>
        </section>
      )}
    </Screen>
  )
}
function Timer() {
  const [seconds, setSeconds] = useState(20),
    [running, setRunning] = useState(false),
    deadline = useRef(0)
  useEffect(() => {
    if (!running) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))
      setSeconds(left)
      if (left === 0) setRunning(false)
    }
    const id = window.setInterval(tick, 150)
    const hide = () => {
      if (document.hidden) {
        tick()
        setRunning(false)
      }
    }
    document.addEventListener('visibilitychange', hide)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', hide)
    }
  }, [running])
  return (
    <div className="learn-timer">
      <strong aria-live="off">{seconds} s</strong>
      <span>Essai ou pause · durée libre</span>
      <div className="learn-tools">
        <Button
          variant="secondary"
          onClick={() => {
            if (running) setRunning(false)
            else {
              const n = seconds || 20
              setSeconds(n)
              deadline.current = Date.now() + n * 1000
              setRunning(true)
            }
          }}
        >
          {running ? 'Pause' : seconds === 0 ? 'Recommencer' : 'Démarrer'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setRunning(false)
            setSeconds(30)
          }}
        >
          Pause de 30 s
        </Button>
      </div>
      <small>Tu peux t’arrêter ou prolonger la pause à tout moment.</small>
    </div>
  )
}
function Question({
  task,
  work,
  change,
}: {
  task: StudioTask
  work: LearningWork
  change: (patch: Partial<LearningWork>) => void
}) {
  const [hint, setHint] = useState(0),
    [reveal, setReveal] = useState(false),
    value = String(work.answers[task.id] ?? ''),
    checked = work.checked.includes(task.id),
    correct = learningCorrect(task, value),
    shortAnswer = String(task.solution).length <= 45 && !String(task.solution).includes('\n'),
    updateAnswer = (value: string) => {
      setReveal(false)
      change({ answers: { ...work.answers, [task.id]: value }, checked: work.checked.filter(id => id !== task.id) })
    }
  return (
    <section className="learn-card">
      <h2>{task.title}</h2>
      <p>{task.prompt}</p>
      <label className="learn-label">
        Ma réponse
        {shortAnswer ? <input type="text" maxLength={1000} value={value} autoComplete="off" onChange={e => updateAnswer(e.target.value)} /> :
          <textarea rows={3} maxLength={1000} value={value} onChange={e => updateAnswer(e.target.value)} />}
      </label>
      <div className="learn-tools">
        <Button
          variant="secondary"
          onClick={() => {
            setHint(Math.min(3, hint + 1))
            change({ hints: Math.min(100, work.hints + 1) })
          }}
        >
          Un indice
        </Button>
        <Button
          disabled={!value.trim()}
          onClick={() => change({ checked: [...new Set([...work.checked, task.id])], review: work.review || !correct })}
        >
          Vérifier
        </Button>
      </div>
      {hint > 0 && <p className="learn-lilac">{task.hints[hint - 1]}</p>}
      {checked && (
        <div role="status" className={correct ? 'learn-mint' : 'learn-lilac'}>
          {correct
            ? 'Ton raisonnement aboutit à la bonne réponse.'
            : 'Cette réponse ne respecte pas encore toutes les conditions. Tu peux réessayer.'}
        </div>
      )}
      {checked && correct ? (
        task.explanation.map((p) => <p key={p}>{p}</p>)
      ) : (
        <>
          {!reveal ? (
            <button
              className="learn-text-button"
              onClick={() => {
                setReveal(true)
                change({ hints: Math.min(100, work.hints + 1), review: true })
              }}
            >
              Voir la solution expliquée
            </button>
          ) : (
            <>
              <strong>{String(task.solution)}</strong>
              {task.explanation.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </>
          )}
        </>
      )}
    </section>
  )
}
function ReadWork({ lesson, work }: { lesson: Lesson; work: LearningWork }) {
  return (
    <>
      {lesson.passion === 'dessin' ? (
        <div className="learn-compare">
          <section>
            <h3>Mon essai guidé</h3>
            <InkView strokes={work.firstInk} />
          </section>
          <section>
            <h3>Mon essai autonome</h3>
            <InkView strokes={work.ink} />
          </section>
        </div>
      ) : lesson.passion === 'piano' ? (
        <>
          <NotePlayback notes={work.firstNotes} label="Mon premier essai" />
          <LearningPiano lesson={lesson} notes={work.notes} onChange={() => {}} review />
        </>
      ) : (
        <>
          {work.first && (
            <section className="learn-card">
              <h3>{lesson.passion === 'sport' ? 'Mes premières observations' : 'Mon premier jet'}</h3>
              <p className="learn-prose">{work.first}</p>
            </section>
          )}
          {work.final && (
            <section className="learn-card">
              <h3>{lesson.passion === 'sport' ? 'Mon essai autonome' : 'Mon texte / ma version retravaillée'}</h3>
              <p className="learn-prose">{work.final}</p>
            </section>
          )}
        </>
      )}
      {lesson.tasks.map((t) => (
        <section className="learn-card" key={t.id}>
          <h3>{t.title}</h3>
          <p>{t.prompt}</p>
          <div className="learn-lilac">Ma réponse : {String(work.answers[t.id] ?? 'Sans réponse')}</div>
          <div className="learn-mint">Réponse : {String(t.solution)}</div>
          {t.explanation.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}
      {work.notebook && (
        <section className="learn-card">
          <h3>Mes notes</h3>
          <p className="learn-prose">{work.notebook}</p>
        </section>
      )}
    </>
  )
}
export function LearningLessonScreen({ lessonId, entryId }: { lessonId: string; entryId?: string }) {
  const lesson = learningLesson(lessonId),
    { state } = useAppState(),
    { push } = useNavigation(),
    key = `scroll-up:learning:${state.me.user.id}:${lessonId}`
  const [draft] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(key) ?? 'null')
      if (v && typeof v.id === 'string' && (!entryId || v.id === entryId)) {
        const valid = validateLearning(lessonId, v.work)
        return { ...v, work: valid.work, local: true } as { id: string; work: LearningWork; local: boolean }
      }
    } catch {}
    return { id: entryId ?? crypto.randomUUID(), work: emptyLearningWork(), local: false }
  })
  const [work, setWork] = useState<LearningWork>(draft.work),
    [id, setId] = useState(draft.id),
    [loading, setLoading] = useState(!!entryId || draft.local),
    [readOnly, setReadOnly] = useState(false),
    [reviewStatus, setReviewStatus] = useState(false),
    [reviewMessage, setReviewMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [localOK, setLocalOK] = useState(true),
    [saved, setSaved] = useState(false),
    [loadFailed, setLoadFailed] = useState(false),
    [loadRevision, setLoadRevision] = useState(0),
    [demo, setDemo] = useState(0),
    [easy, setEasy] = useState(false)
  const saving = useRef(false),
    revision = useRef(0)
  useEffect(() => {
    const lookupId = entryId ?? (draft.local ? draft.id : undefined)
    if (!lookupId) {
      setLoading(false)
      return
    }
    let live = true
    setLoading(true)
    setLoadFailed(false)
    api
      .learningEntry(lookupId)
      .then((r) => {
        if (!live) return
        if (r.lessonId !== lessonId || !r.work) throw Error('Ce carnet ne correspond pas à cette leçon.')
        if (r.completed || draft.id !== lookupId || !draft.local) setWork(r.work)
        setId(r.id)
        setReadOnly(r.completed)
        setReviewStatus(r.review)
        setLoading(false)
      })
      .catch((e) => {
        if (live && !entryId && (e as { status?: number }).status === 404) {
          setLoading(false)
          return
        }
        if (live) {
          setError((e as Error).message)
          setLoadFailed(true)
          setLoading(false)
        }
      })
    return () => {
      live = false
    }
  }, [entryId, lessonId, loadRevision])
  useEffect(() => {
    if (loading || loadFailed || readOnly || saved) return
    try {
      localStorage.setItem(key, JSON.stringify({ id, work }))
      setLocalOK(true)
    } catch {
      setLocalOK(false)
    }
  }, [work, id, key, loading, loadFailed, readOnly, saved])
  const change = (patch: Partial<LearningWork>) => {
    revision.current++
    setWork((w) => ({ ...w, ...patch }))
    setSaved(false)
  }
  const go = (step: number) => {
    change({ step })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const save = async (completed: boolean) => {
    if (saving.current) return
    saving.current = true
    setBusy(true)
    setError('')
    const before = revision.current
    try {
      const result = await api.saveLearning(id, lessonId, { ...work, completed, step: completed ? 3 : work.step })
      if (before === revision.current) {
        setSaved(true)
        if (completed) {
          setReadOnly(true)
          setReviewStatus(result.review)
          setWork(result.work!)
          try {
            localStorage.removeItem(key)
          } catch {
            /* The server copy is already saved. */
          }
        }
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      saving.current = false
      setBusy(false)
    }
  }
  const retry = () => {
    const next = crypto.randomUUID()
    setId(next)
    setReadOnly(false)
    setSaved(false)
    setWork(emptyLearningWork())
    setDemo(0)
    setError('')
    setReviewMessage('')
    window.scrollTo(0, 0)
  }
  const toggleReview = async () => {
    if (saving.current) return
    saving.current = true
    setBusy(true)
    setError('')
    setReviewMessage('')
    try {
      const result = await api.setLearningReview(id, !reviewStatus)
      setReviewStatus(result.review)
      setReviewMessage(result.review ? 'Ajouté aux révisions. Ton essai est conservé.' : 'Retiré des révisions. Ton essai est conservé.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      saving.current = false
      setBusy(false)
    }
  }
  if (!lesson)
    return (
      <Screen tabs>
        <p>Cette leçon n’existe pas.</p>
        <Button onClick={() => push({ name: 'learn' })}>Retour aux leçons</Button>
      </Screen>
    )
  if (loadFailed)
    return (
      <Screen tabs>
        <AppHeader />
        <p role="alert">{error}</p>
        <Button onClick={() => setLoadRevision((v) => v + 1)}>Réessayer</Button>
        <Button variant="secondary" onClick={() => push({ name: 'learn' })}>
          Retour aux leçons
        </Button>
      </Screen>
    )
  if (loading)
    return (
      <Screen tabs>
        <p role="status">Ouverture du carnet…</p>
      </Screen>
    )
  return (
    <Screen className="learning-screen learning-lesson">
      <AppHeader />
      <button className="learn-text-button" onClick={() => push({ name: 'learnPassion', passion: lesson.passion })}>
        <ChevronLeft size={16} />
        Apprendre · {getPassion(lesson.passion).label}
      </button>
      <div className="learn-step-label">
        <span>{LEARNING_LEVELS[lesson.level]}</span>
        <span>Leçon {lesson.number} / 12</span>
      </div>
      <div className="learn-progress">
        <i style={{ width: `${(work.step + 1) * 25}%` }} />
      </div>
      <h1>{lesson.title}</h1>
      <p>{lesson.goal}</p>
      {readOnly ? (
        <>
          <div className="learn-mint">{learningAttempted(work) ? 'Essai conservé dans ton carnet' : 'Leçon consultée · ta lecture est enregistrée'}</div>
          <ReadWork lesson={lesson} work={work} />
          <section className="learn-card">
            <h2>{reviewStatus ? 'À revoir' : 'Hors de mes révisions'}</h2>
            <p>Tu peux modifier ce statut sans changer ton essai ni son résultat.</p>
            <Button disabled={busy} variant="secondary" onClick={() => void toggleReview()}>{busy ? 'Enregistrement…' : reviewStatus ? 'C’est acquis · retirer des révisions' : 'Ajouter aux révisions'}</Button>
            {reviewMessage && <p role="status">{reviewMessage}</p>}
          </section>
          <Button disabled={busy} onClick={retry}>{learningAttempted(work) ? 'Faire un nouvel essai' : 'Faire mon premier essai'}</Button>
          <Button variant="secondary" onClick={() => push({ name: 'learnPassion', passion: lesson.passion })}>Choisir ma prochaine leçon</Button>
          <Button variant="secondary" onClick={() => push({ name: 'learningNotebooks', passion: lesson.passion })}>
            Mes carnets d’apprentissage
          </Button>
        </>
      ) : (
        <fieldset disabled={busy} className="learn-editable">
          <div className="learn-stages">
            {['Comprendre', 'Essai guidé', 'À toi', 'Bilan'].map((s, i) => (
              <span key={s} data-active={work.step === i}>
                {i + 1}. {s}
              </span>
            ))}
          </div>
          {work.step === 0 ? (
            <>
              <section className="learn-card">
                <h2>Observer et comprendre</h2>
                {lesson.passion === 'dessin' && <DrawingExample visual={lesson.visual} step={demo} />}
                <p className="learn-demo-text">{lesson.teaching[demo]}</p>
                <div className="learn-tools">
                  <Button size="sm" variant="secondary" disabled={demo === 0} onClick={() => setDemo((d) => d - 1)}>
                    Précédent
                  </Button>
                  <span>
                    {demo + 1} / {lesson.teaching.length}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={demo === lesson.teaching.length - 1}
                    onClick={() => setDemo((d) => d + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </section>
              <details className="learn-card"><summary>Voir un exemple</summary><p className="learn-example-text">{lesson.example}</p></details>
              {lesson.passion === 'piano' && (
                <LearningPiano lesson={lesson} notes={work.firstNotes} onChange={(v) => change({ firstNotes: v })} />
              )}{' '}
              {lesson.passion === 'sport' && (
                <SportInstructions exercise={lesson.exercise as SportExerciseId} easy={easy} onEasy={setEasy} />
              )}
              <Button onClick={() => go(1)}>
                À moi d’essayer
                <ChevronRight size={17} />
              </Button>
            </>
          ) : work.step === 1 || work.step === 2 ? (
            <>
              {lesson.tasks.length ? <details className="learn-practice-help"><summary>Les repères de cet exercice</summary><p>{work.step === 1 ? lesson.guided : lesson.practice}</p></details> : <section className="learn-card learn-practice-brief"><h2>{work.step === 1 ? 'Essai guidé' : 'À toi de pratiquer'}</h2><p>{work.step === 1 ? lesson.guided : lesson.practice}</p></section>}
              {lesson.tasks.length ? (
                <Question
                  key={lesson.tasks[work.step - 1]!.id}
                  task={lesson.tasks[work.step - 1]!}
                  work={work}
                  change={change}
                />
              ) : lesson.passion === 'dessin' ? (
                <LearningDrawing
                  key={work.step}
                  lesson={lesson}
                  value={work.step === 1 ? work.firstInk : work.ink}
                  onChange={(v) => change(work.step === 1 ? { firstInk: v } : { ink: v })}
                />
              ) : lesson.passion === 'piano' ? (
                <LearningPiano
                  key={work.step}
                  lesson={lesson}
                  notes={work.step === 1 ? work.firstNotes : work.notes}
                  onChange={(v) => change(work.step === 1 ? { firstNotes: v } : { notes: v })}
                />
              ) : (
                <>
                  {lesson.passion === 'sport' && (
                    <>
                      <SportInstructions exercise={lesson.exercise as SportExerciseId} easy={easy} onEasy={setEasy} />
                      <Timer />
                      <p className="learn-safety">
                        Garde une amplitude confortable. Arrête en cas de douleur ou de malaise.
                      </p>
                    </>
                  )}
                  <label className="learn-label">
                    {lesson.passion === 'sport'
                      ? 'Mes observations'
                      : work.step === 1
                        ? 'Mon premier jet'
                        : 'Mon texte'}
                    <textarea
                      rows={9}
                      maxLength={12000}
                      value={work.step === 1 ? work.first : work.final}
                      onChange={(e) => change(work.step === 1 ? { first: e.target.value } : { final: e.target.value })}
                      placeholder={lesson.passion === 'sport' ? 'Les repères qui m’aident…' : 'Écris à ton rythme…'}
                    />
                  </label>
                </>
              )}
              <details className="learn-card">
                <summary>Revoir la méthode</summary>
                {lesson.teaching.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </details>
              <Button onClick={() => go(work.step + 1)}>
                {work.step === 1 ? 'Passer à l’exercice autonome' : 'Faire le point'}
              </Button>
              <Button variant="secondary" onClick={() => go(work.step - 1)}>
                Revenir à l’étape précédente
              </Button>
            </>
          ) : (
            <>
              <h2>{learningAttempted(work) ? 'Faire le point sur mon essai' : 'Lire les corrections'}</h2>
              {!learningAttempted(work) && <p>Tu peux terminer ta lecture sans répondre. La leçon sera marquée « consultée », sans ajouter un essai vide à ton carnet.</p>}
              <ReadWork lesson={lesson} work={work} />
              {lesson.passion === 'ecriture' && (
                <label className="learn-label">
                  Ma version retravaillée
                  <textarea
                    rows={9}
                    maxLength={12000}
                    value={work.final}
                    onChange={(e) => change({ final: e.target.value })}
                  />
                </label>
              )}
              <section className="learn-card">
                <h2>Mes points à vérifier</h2>
                {lesson.checklist.map((label, i) => (
                  <label className="learn-check" key={label}>
                    <input
                      type="checkbox"
                      checked={!!work.selfChecks[i]}
                      onChange={(e) => {
                        const checks = lesson.checklist.map((_, j) =>
                          j === i ? e.target.checked : !!work.selfChecks[j],
                        )
                        change({ selfChecks: checks })
                      }}
                    />
                    {label}
                  </label>
                ))}
                <small>Ces repères t’aident à relire ton essai ; ils ne constituent pas une note automatique.</small>
              </section>
              <label className="learn-check">
                <input type="checkbox" checked={work.review} onChange={(e) => change({ review: e.target.checked })} />
                Garder cette leçon à revoir
              </label>
              <Button disabled={busy} onClick={() => void save(true)}>
                {busy ? 'Enregistrement…' : learningAttempted(work) ? 'Garder mon essai dans le carnet' : 'Marquer la leçon comme consultée'}
              </Button>
              <Button variant="secondary" onClick={() => go(2)}>
                Retravailler mon essai
              </Button>
            </>
          )}
          {work.step > 0 && (
            <details className="learn-card">
              <summary>Mon carnet de notes</summary>
              <label className="learn-label">
                Mes observations et déductions
                <textarea
                  rows={5}
                  maxLength={12000}
                  value={work.notebook}
                  onChange={(e) => change({ notebook: e.target.value })}
                />
              </label>
            </details>
          )}
          <Button variant="secondary" disabled={busy} onClick={() => void save(false)}>
            {busy ? 'Enregistrement…' : 'Sauvegarder ma progression'}
          </Button>
          <small role="status">
            {saved
              ? 'Progression sauvegardée dans ton compte.'
              : localOK
                ? 'Brouillon conservé sur cet appareil.'
                : 'Stockage local indisponible : sauvegarde ta progression avant de quitter.'}
          </small>
        </fieldset>
      )}
      {error && (
        <p role="alert" className="learn-error">
          {error}
        </p>
      )}
      {lesson.passion === 'sport' && (
        <details className="learn-sources">
          <summary>Sources et repères</summary>
          {SPORT_SOURCES.map((url) => (
            <a href={url} key={url} target="_blank" rel="noreferrer">
              {new URL(url).hostname}
            </a>
          ))}
        </details>
      )}
    </Screen>
  )
}
