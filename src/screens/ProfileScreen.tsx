import { Monitor, Moon, RotateCcw, Sun } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { AppShell, Card, ScreenTitle, SectionTitle } from '../components/layout/AppShell'
import { PassionPicker } from '../components/onboarding/PassionPicker'
import { Button } from '../components/ui/Button'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { Switch } from '../components/ui/Switch'
import { useToast } from '../components/ui/Toast'
import { getPassion } from '../data/passions'
import { useDemoCount } from '../hooks/useData'
import { navigate } from '../hooks/useRoute'
import { useTheme } from '../hooks/useTheme'
import { passionAccent } from '../lib/accent'
import { cn } from '../lib/cn'
import { pluralize } from '../lib/dates'
import { fr } from '../lib/typography'
import { isStorageTemporary } from '../services/appInit'
import { removeDemoData, resetAllData, restoreDemoData } from '../services/demoData'
import type { ThemePreference } from '../services/preferences'
import { updateProfile } from '../services/profileService'
import type { PassionId, UserProfile } from '../types'

const THEMES: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'Auto', Icon: Monitor },
  { value: 'light', label: 'Clair', Icon: Sun },
  { value: 'dark', label: 'Sombre', Icon: Moon },
]

export function ProfileScreen({ profile }: { profile: UserProfile }) {
  const toast = useToast()
  const { preference, setPreference } = useTheme()
  const demoCount = useDemoCount()

  const [firstName, setFirstName] = useState(profile.firstName)
  const [savingName, setSavingName] = useState(false)
  const [editingPassions, setEditingPassions] = useState(false)
  const [draftPassions, setDraftPassions] = useState<PassionId[]>(profile.passionIds)
  const [savingPassions, setSavingPassions] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const nameChanged = firstName.trim() !== profile.firstName

  const saveName = async (event: FormEvent) => {
    event.preventDefault()
    if (!nameChanged) return
    setSavingName(true)
    try {
      await updateProfile({ firstName })
      toast(firstName.trim() ? 'Prénom enregistré' : 'Prénom retiré')
    } catch {
      toast('Impossible d’enregistrer le prénom')
    } finally {
      setSavingName(false)
    }
  }

  const openPassionEditor = () => {
    setDraftPassions(profile.passionIds)
    setEditingPassions(true)
  }

  const savePassions = async () => {
    setSavingPassions(true)
    try {
      await updateProfile({ passionIds: draftPassions })
      setEditingPassions(false)
      toast('Passions mises à jour')
    } catch {
      toast('Impossible d’enregistrer tes passions')
    } finally {
      setSavingPassions(false)
    }
  }

  const toggleBeginner = async (beginnerMode: boolean) => {
    try {
      await updateProfile({ beginnerMode })
      toast(beginnerMode ? 'Mode débutant activé' : 'Mode débutant désactivé')
    } catch {
      toast('Impossible d’enregistrer ce réglage')
    }
  }

  const toggleDemo = async () => {
    setDemoBusy(true)
    try {
      if (demoCount) {
        await removeDemoData()
        toast('Données de démonstration retirées')
      } else {
        await restoreDemoData()
        toast('Données de démonstration ajoutées')
      }
    } catch {
      toast('Impossible de modifier les données de démonstration')
    } finally {
      setDemoBusy(false)
    }
  }

  const initial = profile.firstName.trim().charAt(0).toUpperCase()

  return (
    <AppShell activeTab="profil">
      <ScreenTitle title="Ton profil" subtitle="Tes passions et tes réglages.">
        <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-primary font-display text-2xl font-semibold text-on-primary shadow-soft">
          {initial || '🙂'}
        </span>
      </ScreenTitle>

      <div className="space-y-4">
        <Card>
          <form onSubmit={saveName}>
            <label htmlFor="profile-name" className="mb-2 block font-display text-lg font-semibold">
              Ton prénom
            </label>
            <div className="flex gap-2">
              <input
                id="profile-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                maxLength={40}
                autoComplete="given-name"
                placeholder="Ton prénom (facultatif)"
                className="h-12 min-w-0 flex-1 rounded-2xl border-[1.5px] border-line bg-paper px-4 text-base outline-none transition placeholder:text-ink-faint focus:border-primary"
              />
              <Button type="submit" disabled={!nameChanged} busy={savingName}>
                Enregistrer
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <SectionTitle action={<span className="text-sm text-ink-soft">{profile.passionIds.length}</span>}>Tes passions</SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {profile.passionIds.map((passionId) => (
              <li
                key={passionId}
                style={passionAccent(passionId)}
                className="flex items-center gap-1.5 rounded-full tint-accent-strong px-3 py-1.5 text-sm font-medium"
              >
                <span aria-hidden>{getPassion(passionId).emoji}</span>
                {getPassion(passionId).label}
              </li>
            ))}
          </ul>
          <Button variant="secondary" block className="mt-4" onClick={openPassionEditor}>
            Modifier mes passions
          </Button>
        </Card>

        <Card>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label htmlFor="beginner-mode" className="font-display text-lg font-semibold">
                Mode débutant
              </label>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                Propose surtout des activités simples, sans matériel ni expérience. Les idées «&nbsp;niveau intermédiaire&nbsp;» sont mises de côté.
              </p>
            </div>
            <Switch id="beginner-mode" label="Mode débutant" checked={profile.beginnerMode} onChange={toggleBeginner} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Apparence</SectionTitle>
          <div role="radiogroup" aria-label="Thème de l’application" className="grid grid-cols-3 gap-1 rounded-2xl bg-paper p-1">
            {THEMES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={preference === value}
                onClick={() => setPreference(value)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition',
                  preference === value ? 'bg-card text-ink shadow-soft' : 'text-ink-soft hover:text-ink',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Tes données</SectionTitle>
          <p className="text-sm leading-relaxed text-ink-soft">
            {fr(
              isStorageTemporary()
                ? 'Ton navigateur bloque le stockage : tes données restent en mémoire le temps de la session. Rien n’est envoyé sur internet.'
                : 'Tout est enregistré sur cet appareil, dans ton navigateur. Rien n’est envoyé sur internet.',
            )}
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-paper p-3">
            <div className="flex-1 text-sm">
              <p className="font-semibold">Données de démonstration</p>
              <p className="text-ink-soft">
                {demoCount ? `${pluralize(demoCount, 'activité')} d’exemple dans ton historique` : 'Aucune activité d’exemple'}
              </p>
            </div>
            <Button size="sm" variant="secondary" busy={demoBusy} onClick={toggleDemo}>
              {demoCount ? 'Retirer' : 'Ajouter'}
            </Button>
          </div>

          <Button variant="danger-ghost" block className="mt-3" icon={<RotateCcw className="size-4" aria-hidden />} onClick={() => setConfirmReset(true)}>
            Réinitialiser toutes mes données
          </Button>
        </Card>

        <p className="pt-2 text-center text-xs text-ink-soft">Plutôt Que Scroller · prototype 0.1</p>
      </div>

      <Modal
        open={editingPassions}
        onClose={() => setEditingPassions(false)}
        variant="sheet"
        title="Modifier mes passions"
        description="Choisis toutes celles qui te parlent."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingPassions(false)}>
              Annuler
            </Button>
            <Button onClick={savePassions} busy={savingPassions} disabled={draftPassions.length === 0}>
              {draftPassions.length === 0 ? 'Choisis au moins une passion' : `Enregistrer (${draftPassions.length})`}
            </Button>
          </>
        }
      >
        <PassionPicker selected={draftPassions} onChange={setDraftPassions} />
      </Modal>

      <ConfirmDialog
        open={confirmReset}
        title="Tout effacer ?"
        message="Ton profil, ton historique et tes photos seront supprimés de cet appareil. Cette action est définitive."
        confirmLabel="Oui, tout effacer"
        tone="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          try {
            await resetAllData()
            navigate('accueil', { replace: true })
          } catch {
            toast('La réinitialisation a échoué. Réessaie dans un instant.')
            setConfirmReset(false)
          }
        }}
      />
    </AppShell>
  )
}
