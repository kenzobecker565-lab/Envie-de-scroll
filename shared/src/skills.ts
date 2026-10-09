/**
 * ============================================================================
 *  LE NIVEAU DANS UNE PASSION
 * ============================================================================
 *
 * Les nouvelles passions (Piano d'abord) demandent d'où l'on part : jamais
 * joué, les bases, ou déjà à l'aise. Ce niveau, choisi sur une page juste
 * après les passions (et modifiable ensuite), cible le contenu :
 * - les activités tirées au hasard : seulement celles qui conviennent
 *   (ACTIVITY_SKILLS, dans selection.ts) ;
 * - les parcours : on commence directement au bon palier (débutant,
 *   confirmé, avancé), les précédents restant ouverts pour réviser.
 */

import { getPassion } from './passions.ts'
import { SKILL_LEVELS, type PassionId, type SkillLevel } from './types.ts'

/** Le niveau déclaré dans chaque passion qui le demande. */
export type Skills = Partial<Record<PassionId, SkillLevel>>

export function isSkillLevel(value: unknown): value is SkillLevel {
  return typeof value === 'string' && (SKILL_LEVELS as readonly string[]).includes(value)
}

/** La passion demande-t-elle le niveau ? */
export function asksSkill(passion: PassionId): boolean {
  return Boolean(getPassion(passion).skill)
}

/** Le palier de parcours ouvert d'emblée : débutant 1, les bases 2, déjà à l'aise 3. */
export const SKILL_TIER: Record<SkillLevel, 1 | 2 | 3> = { debutant: 1, bases: 2, confirme: 3 }

/** Le nom court d'un niveau (« Débutant·e »), pour les rappels. */
export const SKILL_SHORT: Record<SkillLevel, string> = { debutant: 'Débutant·e', bases: 'Les bases', confirme: 'Déjà à l’aise' }

/** Relit les niveaux enregistrés (JSON), en ignorant ce qui n'est plus valable. */
export function parseSkills(json: string | null | undefined): Skills {
  try {
    const value: unknown = JSON.parse(json ?? '{}')
    if (!value || typeof value !== 'object') return {}
    const skills: Skills = {}
    for (const [passion, level] of Object.entries(value)) {
      const id = passion as PassionId
      try {
        if (asksSkill(id) && isSkillLevel(level)) skills[id] = level
      } catch {
        // Passion inconnue : ignorée.
      }
    }
    return skills
  } catch {
    return {}
  }
}

/** Les passions choisies qui attendent encore leur niveau. */
export function missingSkills(passions: readonly PassionId[], skills: Skills): PassionId[] {
  return passions.filter((passion) => asksSkill(passion) && !skills[passion])
}
