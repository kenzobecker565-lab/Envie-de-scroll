import { Moon, Sun, Sunrise } from 'lucide-react'
import { setAppearance, useAppearance } from '../lib/appearance.ts'

export function AppearancePicker() {
  const { mode } = useAppearance()
  return <div className="da-appearance" role="group" aria-label="Ambiance de l’application">
    {([['auto', 'Automatique', Sunrise], ['light', 'Clair', Sun], ['dark', 'Sombre', Moon]] as const).map(([value, label, Icon]) => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setAppearance(value)}><Icon size={15} aria-hidden="true" />{label}</button>)}
  </div>
}
