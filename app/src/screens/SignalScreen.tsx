import { useEffect } from 'react'
import { getActivity } from '@scroll-up/shared'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { ScrollMenuScreen } from './ScrollMenuScreen.tsx'
import { FlowStatus } from '../components/FlowStatus.tsx'

export function SignalScreen() {
  const { state, dispatch } = useAppState()
  const { replace } = useNavigation()
  const step = state.flow.fixedStep ? getActivity(state.flow.fixedStep) : undefined
  useEffect(() => {
    if (!step) return
    dispatch({ type: 'flow', flow: { passion: step.passion, duration: step.duration } })
    replace({ name: 'activity' })
  }, [step, dispatch, replace])
  return step ? <FlowStatus title="Ton activité arrive" description="On ouvre ton atelier." pose="wait"/> : <ScrollMenuScreen/>
}
