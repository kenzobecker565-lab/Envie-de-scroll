import { ArrowLeft, Check, Sprout } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { LIFE_INTERESTS, resolveLifeInterests } from '../../data/lifeInterests'
import { getPassion } from '../../data/passions'
import { useDemoCount } from '../../hooks/useData'
import { navigate } from '../../hooks/useRoute'
import { passionAccent } from '../../lib/accent'
import { cn } from '../../lib/cn'
import { fr } from '../../lib/typography'
import { platform } from '../../platform'
import { requestPersistentStorage } from '../../services/appInit'
import { createProfile } from '../../services/profileService'
import type { LifeInterestId, PassionFamilyId, PassionId } from '../../types'
import { AppShell } from '../layout/AppShell'
import { Button, IconButton } from '../ui/Button'
import { AppMark, Logo } from '../ui/Logo'
import { BottomBar, StepHeading } from '../ui/StepHeading'
import { StepTransition, type StepDirection } from '../ui/StepTransition'
import { PassionPicker } from './PassionPicker'

type Step = 'welcome' | 'name' | 'passions' | 'interests' | 'suggestions' | 'ready'

const PROGRESS: Record<Step, number> = {
  welcome: 0,
  name: 0.2,
  passions: 0.45,
  interests: 0.6,
  suggestions: 0.8,
  ready: 1,
}

/**
 * Premier lancement : bienvenue → prénom → passions → c'est prêt.
 * Si aucune passion n'est choisie : « Qu'est-ce qui te plaît dans la vie ? »
 * → familles suggérées (passions débutant pré-cochées) → c'est prêt.
 */
export function Onboarding() {
  const [step, setStep] = useState<Step>('welcome')
  const [direction, setDirection] = useState<StepDirection>('forward')
  const [firstName, setFirstName] = useState(() => platform.suggestedFirstName() ?? '')
  const [passionIds, setPassionIds] = useState<PassionId[]>([])
  const [lifeInterestIds, setLifeInterestIds] = useState<LifeInterestId[]>([])
  const [suggestedFamilies, setSuggestedFamilies] = useState<PassionFamilyId[]>([])
  const [showAllFamilies, setShowAllFamilies] = useState(false)
  const [usedAlternativePath, setUsedAlternativePath] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const demoCount = useDemoCount()

  const goTo = (next: Step, dir: StepDirection = 'forward') => {
    setDirection(dir)
    setStep(next)
    window.scrollTo({ top: 0 })
  }

  const goBack = () => {
    const previous: Partial<Record<Step, Step>> = {
      name: 'welcome',
      passions: 'name',
      interests: 'passions',
      suggestions: 'interests',
      ready: usedAlternativePath ? 'suggestions' : 'passions',
    }
    const target = previous[step]
    if (target) goTo(target, 'back')
  }

  const continueFromInterests = () => {
    const { familyIds, suggestedPassionIds } = resolveLifeInterests(lifeInterestIds)
    setSuggestedFamilies(familyIds)
    setPassionIds(suggestedPassionIds)
    setShowAllFamilies(false)
    setUsedAlternativePath(true)
    goTo('suggestions')
  }

  const finish = async () => {
    setSaving(true)
    setError(undefined)
    try {
      await createProfile({
        firstName,
        passionIds,
        beginnerMode: usedAlternativePath,
        lifeInterestIds: usedAlternativePath ? lifeInterestIds : [],
      })
      platform.haptic('success')
      requestPersistentStorage()
      navigate('accueil', { replace: true })
    } catch {
      setError('Impossible d’enregistrer ton profil. Réessaie dans un instant.')
      setSaving(false)
    }
  }

  const passionCountLabel = `${passionIds.length} passion${passionIds.length > 1 ? 's' : ''}`

  return (
    <AppShell hideNav>
      {step !== 'welcome' && (
        <header className="flex items-center gap-2 py-1">
          <IconButton label="Étape précédente" onClick={goBack} className="-ml-2">
            <ArrowLeft className="size-5" aria-hidden />
          </IconButton>
          <div
            role="progressbar"
            aria-label="Progression de l’inscription"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(PROGRESS[step] * 100)}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
          >
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${PROGRESS[step] * 100}%` }} />
          </div>
          <span className="w-10" aria-hidden />
        </header>
      )}

      <StepTransition stepKey={step} direction={direction} className="flex flex-1 flex-col pt-4">
        {step === 'welcome' && <WelcomeStep onNext={() => goTo('name')} />}

        {step === 'name' && (
          <form
            className="flex flex-1 flex-col"
            onSubmit={(event: FormEvent) => {
              event.preventDefault()
              goTo('passions')
            }}
          >
            <StepHeading title="Comment tu t’appelles ?" subtitle="C’est juste pour te saluer. Tu peux aussi passer cette étape." focus={false} />
            <label htmlFor="first-name" className="sr-only">
              Ton prénom
            </label>
            <input
              id="first-name"
              autoFocus
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              maxLength={40}
              autoComplete="given-name"
              placeholder="Ton prénom"
              className="h-14 w-full rounded-2xl border-[1.5px] border-line bg-card px-4 text-lg text-ink shadow-soft outline-none transition placeholder:text-ink-faint focus:border-primary"
            />
            <BottomBar>
              <Button type="submit" size="lg" block>
                {firstName.trim() ? 'Continuer' : 'Passer cette étape'}
              </Button>
            </BottomBar>
          </form>
        )}

        {step === 'passions' && (
          <>
            <StepHeading
              title={firstName.trim() ? `Qu’est-ce qui te passionne, ${firstName.trim()} ?` : 'Qu’est-ce qui te passionne ?'}
              subtitle="Choisis-en autant que tu veux. Tu pourras changer plus tard."
            />
            <PassionPicker selected={passionIds} onChange={setPassionIds} />
            <BottomBar>
              {passionIds.length > 0 ? (
                <Button
                  size="lg"
                  block
                  onClick={() => {
                    setUsedAlternativePath(false)
                    goTo('ready')
                  }}
                >
                  Continuer avec {passionCountLabel}
                </Button>
              ) : (
                <>
                  <Button size="lg" variant="secondary" block icon={<Sprout className="size-5 text-sage" aria-hidden />} onClick={() => goTo('interests')}>
                    Je ne sais pas trop
                  </Button>
                  <p className="text-center text-sm text-ink-soft">Rien ne te parle vraiment&nbsp;? On t’aide à trouver par où commencer.</p>
                </>
              )}
            </BottomBar>
          </>
        )}

        {step === 'interests' && (
          <>
            <StepHeading
              title="Qu’est-ce qui te plaît dans la vie ?"
              subtitle="Pas besoin d’avoir déjà une passion : on part de ce qui te fait du bien. Plusieurs réponses possibles."
            />
            <ul className="space-y-2.5">
              {LIFE_INTERESTS.map((interest) => {
                const selected = lifeInterestIds.includes(interest.id)
                return (
                  <li key={interest.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setLifeInterestIds((current) =>
                          selected ? current.filter((id) => id !== interest.id) : [...current, interest.id],
                        )
                      }
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl border-[1.5px] p-3 text-left transition active:scale-[0.99]',
                        selected ? 'border-sage bg-sage-soft shadow-soft' : 'border-line bg-card hover:border-ink-faint',
                      )}
                    >
                      <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-paper text-2xl">
                        {interest.emoji}
                      </span>
                      <span className="flex-1 font-medium leading-snug">{interest.label}</span>
                      <span
                        aria-hidden
                        className={cn(
                          'grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] transition',
                          selected ? 'border-sage bg-sage text-card' : 'border-line',
                        )}
                      >
                        {selected && <Check className="size-3.5" strokeWidth={3.5} />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <BottomBar>
              <Button size="lg" block disabled={lifeInterestIds.length === 0} onClick={continueFromInterests}>
                Voir ce qui pourrait me plaire
              </Button>
            </BottomBar>
          </>
        )}

        {step === 'suggestions' && (
          <>
            <StepHeading
              title="Voilà par où commencer"
              subtitle="D’après tes réponses, ces familles pourraient te plaire. On a coché des passions faciles à démarrer : ajuste comme tu veux."
            />
            <p className="mb-6 flex gap-3 rounded-2xl bg-sage-soft p-3.5 text-[0.95rem] leading-relaxed">
              <span aria-hidden className="text-xl leading-none">🌱</span>
              <span>
                <strong className="font-semibold">Mode débutant activé&nbsp;:</strong> on te proposera surtout des activités simples, sans
                matériel ni expérience. Tu pourras le désactiver dans ton profil.
              </span>
            </p>
            <PassionPicker selected={passionIds} onChange={setPassionIds} familyIds={showAllFamilies ? undefined : suggestedFamilies} />
            {!showAllFamilies && (
              <Button variant="ghost" size="sm" className="mt-4 self-start" onClick={() => setShowAllFamilies(true)}>
                Voir tout le catalogue de passions
              </Button>
            )}
            <BottomBar>
              <Button size="lg" block disabled={passionIds.length === 0} onClick={() => goTo('ready')}>
                {passionIds.length > 0 ? `Continuer avec ${passionCountLabel}` : 'Choisis au moins une passion'}
              </Button>
            </BottomBar>
          </>
        )}

        {step === 'ready' && (
          <>
            <div aria-hidden className="mb-5 grid size-16 animate-pop place-items-center rounded-3xl bg-saffron-soft text-4xl">
              🎉
            </div>
            <StepHeading
              title={firstName.trim() ? `Tout est prêt, ${firstName.trim()} !` : 'Tout est prêt !'}
              subtitle="Voilà comment ça marche :"
              className="mb-4"
            />
            <ol className="space-y-3">
              {[
                'Tu sens l’envie de scroller ? Ouvre l’app et appuie sur le gros bouton.',
                'Dis-nous ton humeur, la passion qui te tente et le temps que tu as.',
                'Fais l’activité proposée, enregistre-la… et regarde ta progression grandir.',
              ].map((text, index) => (
                <li key={text} className="flex gap-3 rounded-2xl border border-line bg-card p-3.5 shadow-soft">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-display font-semibold text-on-primary">
                    {index + 1}
                  </span>
                  <span className="pt-1 leading-snug">{fr(text)}</span>
                </li>
              ))}
            </ol>

            <h2 className="mb-2.5 mt-6 font-display text-lg font-semibold">Tes passions</h2>
            <ul className="flex flex-wrap gap-2">
              {passionIds.map((passionId) => (
                <li key={passionId} style={passionAccent(passionId)} className="flex items-center gap-1.5 rounded-full tint-accent-strong px-3 py-1.5 text-sm font-medium">
                  <span aria-hidden>{getPassion(passionId).emoji}</span>
                  {getPassion(passionId).label}
                </li>
              ))}
            </ul>

            {demoCount !== undefined && demoCount > 0 && (
              <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                Pour te montrer à quoi ressemble ta progression, on a ajouté quelques activités d’exemple. Tu pourras les retirer dans ton
                profil.
              </p>
            )}

            <BottomBar>
              {error && (
                <p role="alert" className="text-center text-sm font-medium text-danger">
                  {error}
                </p>
              )}
              <Button size="lg" block busy={saving} onClick={finish}>
                C’est parti&nbsp;!
              </Button>
            </BottomBar>
          </>
        )}
      </StepTransition>
    </AppShell>
  )
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <AppMark className="size-9" />
        <Logo className="text-xl" />
      </div>

      <div className="relative my-8 h-56" aria-hidden>
        <IdeaCard className="left-0 top-0 [--tilt:-4deg]" emoji="✏️" title="Croquis express" meta="Dessin · 5 min" delay="0s" />
        <IdeaCard className="right-0 top-[4.7rem] [--tilt:3deg]" emoji="🎬" title="Court-métrage" meta="Cinéma · 15 min" delay="-1.6s" />
        <IdeaCard className="bottom-0 left-[9%] [--tilt:-1.5deg]" emoji="🍳" title="Mug cake" meta="Cuisine · 15 min" delay="-3.2s" />
      </div>

      <h1 className="font-display text-[2.15rem] font-semibold leading-[1.08] tracking-tight">
        Et si chaque envie de scroller devenait un petit moment créatif&nbsp;?
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">
        Quand l’envie arrive, on te propose une activité liée à ce que tu aimes. Et tu vois ta progression grandir, jour après jour.
      </p>

      <BottomBar>
        <Button size="lg" block onClick={onNext}>
          C’est parti
        </Button>
        <p className="text-center text-xs text-ink-soft">Tes données restent sur ton appareil.</p>
      </BottomBar>
    </>
  )
}

function IdeaCard({ className, emoji, title, meta, delay }: { className: string; emoji: string; title: string; meta: string; delay: string }) {
  return (
    <div
      className={cn('absolute w-[64%] animate-float rounded-2xl border border-line bg-card p-3 shadow-lift', className)}
      style={{ animationDelay: delay, transform: 'rotate(var(--tilt))' }}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-xl">{emoji}</span>
        <div className="min-w-0">
          <p className="truncate font-display font-semibold">{title}</p>
          <p className="text-xs text-ink-soft">{meta}</p>
        </div>
      </div>
    </div>
  )
}
