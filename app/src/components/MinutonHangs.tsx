import { Frame } from 'lucide-react'
import type { CompletionDTO } from '@scroll-up/shared'
import { Mascot } from './Mascot.tsx'
import '../screens/AtelierScreen.css'
export function MinutonHangs({ item }: { item: CompletionDTO }) {
  return (
    <div className="minuton-hangs" aria-label="Minuton installe ton activité dans l’atelier">
      <div className="minuton-hangs-mascot">
        <Mascot pose="cheer" size={98} animated={false} />
      </div>
      <div className="minuton-hangs-frame">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt="" />
        ) : (
          <>
            <Frame aria-hidden="true" />
            <span>{item.text ?? item.exploredTitle ?? item.activityText}</span>
          </>
        )}
      </div>
    </div>
  )
}
