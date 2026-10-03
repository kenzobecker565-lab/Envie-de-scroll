import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Screen } from '../components/Screen.tsx'
import { SettingsContent, EraseDialog } from '../components/SettingsSheet.tsx'
import { FeedbackDialog } from '../components/FeedbackDialog.tsx'
import { useNavigation } from '../state/AppState.tsx'
import { track } from '../api/client.ts'

export function SettingsScreen() {
  const { back, push } = useNavigation()
  const [feedback, setFeedback] = useState(false)
  const [erase, setErase] = useState(false)
  useEffect(() => track('settings_open'), [])
  return <Screen tabs className="studio-settings">
    <header className="studio-subpage-heading"><button type="button" className="studio-icon-button" aria-label="Retour" onClick={back}><ArrowLeft size={22}/></button><h1>Réglages</h1></header>
    <SettingsContent embedded onEditPassions={() => push({ name: 'passions', mode: 'edit' })} onFeedback={() => setFeedback(true)} onErase={() => setErase(true)}/>
    <FeedbackDialog open={feedback} onOpenChange={setFeedback} context="réglages"/>
    <EraseDialog open={erase} onOpenChange={setErase}/>
  </Screen>
}
