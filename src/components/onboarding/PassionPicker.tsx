import { PASSION_FAMILIES } from '../../data/passions'
import { accentStyle } from '../../lib/accent'
import type { PassionFamilyId, PassionId } from '../../types'
import { PassionChip } from '../ui/Passion'
import { Picto } from '../ui/Picto'

interface PassionPickerProps {
  selected: PassionId[]
  onChange: (selected: PassionId[]) => void
  /** Limite l'affichage à certaines familles (chemin « je ne sais pas trop »). */
  familyIds?: PassionFamilyId[]
}

/**
 * Catalogue des passions, famille par famille, en sélection multiple.
 * Utilisé à l'onboarding et dans le profil.
 */
export function PassionPicker({ selected, onChange, familyIds }: PassionPickerProps) {
  const families = familyIds ? PASSION_FAMILIES.filter((family) => familyIds.includes(family.id)) : PASSION_FAMILIES

  const toggle = (passionId: PassionId) => {
    onChange(selected.includes(passionId) ? selected.filter((id) => id !== passionId) : [...selected, passionId])
  }

  return (
    <div className="space-y-5">
      {families.map((family) => {
        const count = family.passionIds.filter((id) => selected.includes(id)).length
        return (
          <fieldset key={family.id}>
            <legend className="mb-2.5 flex w-full items-center gap-2.5">
              <span style={accentStyle(family.color)} className="grid size-8 place-items-center">
                <Picto name={family.picto} spot className="size-7" />
              </span>
              <span className="font-display text-[1.05rem] font-extrabold tracking-tight">{family.label}</span>
              {count > 0 && (
                <span style={accentStyle(family.color)} className="ml-auto rounded-full tint-accent px-2 py-0.5 text-xs font-bold text-accent">
                  {count} choisie{count > 1 ? 's' : ''}
                </span>
              )}
            </legend>
            <div className="flex flex-wrap gap-2">
              {family.passionIds.map((passionId) => (
                <PassionChip key={passionId} passionId={passionId} selected={selected.includes(passionId)} onClick={() => toggle(passionId)} />
              ))}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}
