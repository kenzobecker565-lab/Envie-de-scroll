import { useRef, useState } from 'react'
import { getPassion, type PassionId } from '@scroll-up/shared'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { track } from '../api/client.ts'
import { PassionCard } from '../components/PassionCard.tsx'
import { Screen, ScreenTitle, StepProgress } from '../components/Screen.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/** Laisse voir la sélection un court instant avant de passer à l'écran suivant. */
function useAdvance() {
  const busy = useRef(false)
  return (action: () => void) => {
    if (busy.current) return
    busy.current = true
    window.setTimeout(action, 240)
  }
}

export { ScrollMenuScreen as TimeScreen } from './ScrollMenuScreen.tsx'

/* ------------------------ Passion (si plusieurs) --------------------------- */

export function PassionPickScreen() {
  const { state, dispatch } = useAppState()
  const { push } = useNavigation()
  const advance = useAdvance()
  const [selected, setSelected] = useState<PassionId | undefined>()

  const choose = (passion: PassionId) => {
    haptics.selection()
    track('passion', { passion })
    setSelected(passion)
    dispatch({ type: 'flow', flow: { passion } })
    advance(() => push({ name: 'activity' }))
  }

  return (
    <Screen>
      <ScreenTitle eyebrow={<StepProgress current={2} total={2} label="Ta passion" />} subtitle={'Parmi tes passions, laquelle te tente maintenant ?'}>
        Et tu as envie de…&nbsp;?
      </ScreenTitle>
      <ToggleGroup
        type="single"
        variant="card"
        value={selected ?? ''}
        onValueChange={(value) => choose((value || selected) as PassionId)}
        className="grid grid-cols-2 gap-4"
        aria-label="Ta passion du moment"
      >
        {state.me.user.passions.map((id, index) => (
          <PassionCard key={id} passion={getPassion(id)} index={index} selected={selected === id} />
        ))}
      </ToggleGroup>
    </Screen>
  )
}
