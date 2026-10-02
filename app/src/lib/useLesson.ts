import type { PathStep } from '@scroll-up/shared'
import { track } from '../api/client.ts'
import { tabStack } from '../components/TabBar.tsx'
import { useAppState, useNavigation, type Route } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/** La pile d'une leçon : Progresser, le parcours, puis l'écran donné (la leçon, sa réussite). */
export function lessonStack(step: PathStep, screen: Route): Route[] {
  return [...tabStack('passionHub'), { name: 'passionSpace', passion: step.passion }, { name: 'path', pathId: step.pathId }, screen]
}

/**
 * Le mode progression : une leçon (étape de parcours) se lance tout de suite,
 * sans signal, sans humeur ni choix du temps. Le retour ramène au parcours.
 * `from` : depuis l'écran du parcours, ou enchaînée après la leçon précédente.
 */
export function useStartLesson() {
  const { dispatch } = useAppState()
  const { reset } = useNavigation()
  return (step: PathStep, from: 'parcours' | 'enchainement') => {
    haptics.impact('heavy')
    track('lesson', { step: step.id, from })
    dispatch({ type: 'newFlow', flow: { fixedPassion: step.passion, fixedStep: step.id, passion: step.passion, duration: step.duration } })
    reset(lessonStack(step, { name: 'activity' }))
  }
}
