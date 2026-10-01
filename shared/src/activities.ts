/**
 * ============================================================================
 *  LES 60 ACTIVITÉS DE LA V1
 * ============================================================================
 *
 * 4 passions × 3 temps × 5 activités. Le texte est celui de la liste validée,
 * recopié tel quel (ne pas le reformuler). Seule la typographie est ajustée à
 * l'affichage : apostrophes courbes et espaces insécables (voir typography.ts).
 *
 * `extra` signale les activités où « l'appli tire au hasard » quelque chose
 * (des mots, un trait de caractère, un film…) : le tirage est fait au moment
 * de la proposition, parmi les listes de prompts.ts.
 */

import { getPathStep } from './paths.ts'
import { frenchTypography } from './typography.ts'
import type { Activity, Duration, ExtraKind, PassionId } from './types.ts'

type RawActivity = string | [text: string, extra: ExtraKind]
type RawPassion = Record<Duration, [RawActivity, RawActivity, RawActivity, RawActivity, RawActivity]>

export const RAW_ACTIVITIES: Record<PassionId, RawPassion> = {
  dessin: {
    5: [
      "Dessine un objet de ton bureau",
      "Dessine ton animal préféré en formes simples (des ronds, des triangles, rien de plus)",
      "Dessine 3 petits objets autour de toi, en 1 minute chacun",
      "Dessine le thème du jour — ton mood, ton repas, ta tenue, ce que tu veux",
      "Un doodle libre : remplis la page de petits motifs répétés, sans but précis",
    ],
    15: [
      "Essaie un style que tu ne pratiques jamais (manga, cartoon, réaliste) sur un sujet simple",
      ["Dessine un personnage à partir de 3 mots que l'appli tire au hasard pour toi", 'trois-mots'],
      "Étudie l'ombre et la lumière sur un objet du quotidien",
      "Dessine un de tes personnages ou univers préférés, mais dans ton propre style",
      "Dessine la pochette d'un album ou la couverture d'un livre que tu apprécies",
    ],
    30: [
      "Portrait stylisé de toi ou de quelqu'un — pas besoin de réalisme, juste ta façon de voir un visage",
      "Reproduis une illustration ou un artwork que tu admires, en l'adaptant à ta façon",
      "Une mini-BD de 3 cases sur ta journée",
      "Dessine un décor complet autour d'un personnage",
      "Fais un portrait à partir d'une photo — la tienne, celle d'un proche, ou une photo trouvée en ligne",
    ],
  },
  ecriture: {
    5: [
      "Décris en 3 phrases ce que tu vois ou ressens là, maintenant",
      "Termine cette phrase de 5 façons différentes : \"Aujourd'hui, j'ai remarqué que...\"",
      "Écris une liste de 10 mots qui décrivent ton humeur",
      "Écris le titre et la première phrase d'une histoire que tu n'écriras jamais",
      "Décris un objet autour de toi comme si tu le voyais pour la première fois",
    ],
    15: [
      ["Écris une micro-fiction de 100 mots à partir d'un mot que l'appli tire au hasard", 'un-mot'],
      "Raconte un bon souvenir en 10 lignes",
      "Écris une lettre à un personnage de fiction que tu aimes",
      ["Continue une histoire à partir d'une première phrase donnée par l'appli", 'premiere-phrase'],
      "Décris un lieu réel autour de toi comme si un personnage le découvrait pour la première fois",
    ],
    30: [
      ["Écris une scène de dialogue entre deux personnages — l'appli te donne un trait de caractère pour chacun", 'deux-traits'],
      "Rédige une fausse interview de toi dans 10 ans, en questions-réponses",
      "Raconte un événement réel qui t'a marqué, avec tes mots, sans te soucier du style",
      "Écris une critique ou une analyse d'un livre, film ou album que tu apprécies",
      "Rédige une courte scène qui se déroule dans un lieu que tu as toujours voulu visiter",
    ],
  },
  musique: {
    5: [
      ["Écoute un morceau d'un genre que l'appli te propose, que tu ne connais pas, et note en 3 mots ce que ça t'évoque", 'genre-musical'],
      "Écoute un morceau les yeux fermés, sans rien faire d'autre, juste pour l'écouter vraiment",
      "Écoute le titre le plus populaire d'un artiste que tu ne connais pas encore",
      "Ajoute une chanson que tu viens de découvrir à une playlist \"coup de cœur\"",
      "Écoute la première chanson d'un album culte que tu n'as jamais écouté",
    ],
    15: [
      "Découvre un genre musical que tu n'écoutes jamais et écoute un titre en entier",
      "Crée une playlist de 5 titres qui correspond à ton mood, maintenant",
      "Écoute un artiste que tu aimes et découvre l'histoire derrière une de ses chansons",
      "Écoute les titres les plus populaires d'un artiste que tu ne connais pas et choisis ton préféré",
      "Regarde un extrait de concert ou un clip d'un artiste que tu apprécies",
    ],
    30: [
      "Regarde un live ou une interview d'un artiste que tu aimes",
      "Écoute un album en entier, du début à la fin, sans rien faire d'autre à côté",
      "Explore la discographie d'un artiste que tu aimes et trouve un titre que tu ne connaissais pas",
      "Découvre un nouvel artiste à partir des recommandations liées à ceux que tu aimes déjà",
      "Écoute une playlist thématique complète (une année, un mood, un genre) et note 3 titres à retenir",
    ],
  },
  cinema: {
    5: [
      ["Regarde la bande-annonce d'un film que l'appli te propose, que tu ne connais pas", 'film'],
      ["L'appli te propose un film ou anime au hasard : regarde son résumé et ajoute-le (ou non) à ta liste à voir", 'film-ou-anime'],
      "Regarde le début d'un film ou anime culte que tu n'as jamais vu",
      "Regarde une scène culte d'un film que tu adores",
      "Lis le résumé de 3 films différents et choisis celui qui te tente le plus",
    ],
    15: [
      ["L'appli te propose un court-métrage ou un épisode d'anime : regarde-le en entier", 'court-ou-episode'],
      "Découvre la filmographie d'un réalisateur ou studio que tu apprécies et repère un titre inconnu",
      "Regarde une interview ou un making-of d'un film que tu aimes",
      "Regarde un extrait d'un genre que tu évites d'habitude (horreur, comédie romantique, documentaire...)",
      "Construis ta liste \"à voir\" avec 5 films ou animes qui t'intéressent",
    ],
    30: [
      "Regarde un film ou épisode qui vient de sortir ou qui est tendance en ce moment",
      "Regarde un film ou un long épisode en entier, sans rien faire d'autre à côté",
      "Explore l'univers complet d'une saga ou franchise que tu aimes",
      "Regarde un documentaire ou une analyse sur un film ou anime que tu apprécies",
      "Découvre un nouveau film ou anime recommandé à partir de ceux que tu aimes déjà",
    ],
  },
}

const DURATION_ORDER: readonly Duration[] = [5, 15, 30]

function build(): Activity[] {
  const list: Activity[] = []
  for (const passion of Object.keys(RAW_ACTIVITIES) as PassionId[]) {
    DURATION_ORDER.forEach((duration, durationIndex) => {
      RAW_ACTIVITIES[passion][duration].forEach((raw, index) => {
        const number = durationIndex * 5 + index + 1
        const [text, extra] = typeof raw === 'string' ? [raw, undefined] : raw
        list.push({
          id: `${passion}-${duration}-${number}`,
          passion,
          duration,
          number,
          text: frenchTypography(text),
          ...(extra ? { extra } : {}),
        })
      })
    })
  }
  return list
}

export const ACTIVITIES: readonly Activity[] = build()

const BY_ID = new Map(ACTIVITIES.map((activity) => [activity.id, activity]))

/** Une des 60 activités, ou une étape de parcours (voir paths.ts). */
export function getActivity(id: string): Activity | undefined {
  return BY_ID.get(id) ?? getPathStep(id)
}

/** Vrai pour les 60 activités de base (pas les étapes de parcours) : celles de la collection. */
export function isBaseActivity(id: string): boolean {
  return BY_ID.has(id)
}

/** Les 5 activités d'une passion pour un temps donné. */
export function activitiesFor(passion: PassionId, duration: Duration): Activity[] {
  return ACTIVITIES.filter((activity) => activity.passion === passion && activity.duration === duration)
}
