/**
 * Introductions affichées au-dessus de l'activité. C'est le seul endroit où
 * le mood compte : ton doux pour l'énergie basse, dynamique pour l'énergie
 * haute. Il ne change jamais l'activité proposée.
 */

import type { MoodId } from './types.ts'
import { frenchTypography } from './typography.ts'

export const INTROS: Record<MoodId, readonly string[]> = {
  // Énergie basse : on ralentit, on rassure
  ennui: [
    'L’ennui, c’est souvent une idée qui attend son tour. En voici une, tout en douceur :',
    'Rien ne presse. Laisse-toi porter par ça :',
  ],
  souffler: [
    'Respire un coup. Voici quelque chose de léger, rien que pour toi :',
    'On ralentit ensemble. Juste ça, sans pression :',
  ],
  'pause-travail': [
    'Une vraie pause, ça se savoure. Voici de quoi la remplir :',
    'Ta pause mérite mieux qu’un fil sans fin. Essaie plutôt :',
  ],
  fatigue: [
    'Pas besoin d’être en forme pour ça. Installe-toi confortablement :',
    'Doucement, à ton rythme. Voici une idée qui ne demande pas grand-chose :',
  ],
  // Énergie haute : on canalise, on y va
  stress: [
    'On transforme cette tension en quelque chose. Go :',
    'Toute cette énergie nerveuse, on la canalise. Ton défi :',
  ],
  frustration: [
    'Tu as de quoi mettre de l’intensité là-dedans. Vas-y :',
    'Cette colère a du répondant : sers-t’en. À toi de jouer :',
  ],
  procrastination: [
    'Petit défi, grand effet. On s’y met maintenant :',
    'Le meilleur moyen de démarrer, c’est de démarrer. Hop :',
  ],
  'trop-energie': [
    'Tu tiens pas en place ? Parfait, on en fait quelque chose :',
    'Canalise tout ça. Ton défi du moment :',
  ],
}

export function pickIntro(mood: MoodId, random: () => number = Math.random): string {
  const list = INTROS[mood]
  return frenchTypography(list[Math.floor(random() * list.length)] ?? list[0] ?? '')
}
