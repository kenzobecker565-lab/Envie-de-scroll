import { challengeId, type ChallengePassion } from '@scroll-up/shared'
import { track } from '../api/client.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/** The home card and daily word screen launch the same dated activity. */
export function useStartChallenge() {
  const { dispatch } = useAppState()
  const { reset } = useNavigation()
  return (passion: ChallengePassion, day: string) => {
    haptics.impact('heavy')
    track('cta', { from: 'mot-du-jour', passion })
    dispatch({ type: 'newFlow', flow: { fixedPassion: passion, fixedStep: challengeId(passion, day) } })
    reset([{ name: 'home' }, { name: 'signal' }])
  }
}
