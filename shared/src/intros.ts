/**
 * Introductions affichées au-dessus de l'activité : ton doux pour l'énergie
 * basse, dynamique pour l'énergie haute. Tard le soir et tôt le matin, elles
 * tiennent aussi compte de l'heure.
 */

import { getMood } from './moods.ts'
import type { Energy, MoodId } from './types.ts'
import { frenchTypography } from './typography.ts'

export const INTROS: Record<MoodId, readonly string[]> = {
  // Énergie basse : on ralentit, on rassure
  ennui: [
    'L’ennui, c’est souvent une idée qui attend son tour. En voici une, tout en douceur :',
    'Rien ne presse. Laisse-toi porter par ça :',
    'Et si l’ennui devenait le début de quelque chose ? Essaie ça :',
    'Bonne nouvelle : tu as du temps devant toi. On le remplit joliment :',
  ],
  souffler: [
    'Respire un coup. Voici quelque chose de léger, rien que pour toi :',
    'On ralentit ensemble. Juste ça, sans pression :',
    'Ici, pas de course. Un petit moment rien qu’à toi :',
    'Pose tes épaules. On fait simple et doux :',
  ],
  'pause-travail': [
    'Une vraie pause, ça se savoure. Voici de quoi la remplir :',
    'Ta pause mérite mieux qu’un fil sans fin. Essaie plutôt :',
    'Quelques minutes pour toi avant d’y retourner. Au programme :',
    'Ton cerveau a besoin d’autre chose que des écrans de boulot. Tiens :',
  ],
  fatigue: [
    'Pas besoin d’être en forme pour ça. Installe-toi confortablement :',
    'Doucement, à ton rythme. Voici une idée qui ne demande pas grand-chose :',
    'Fatigué·e, mais encore curieux·se ? Parfait pour ceci :',
    'Quelque chose de calme, pour finir la journée en douceur :',
  ],
  // Énergie haute : on canalise, on y va
  stress: [
    'On transforme cette tension en quelque chose. Go :',
    'Toute cette énergie nerveuse, on la canalise. Ton défi :',
    'Le stress adore les mains vides. Occupe-les avec ça :',
    'On déplace la pression ailleurs, sur une feuille ou dans tes oreilles :',
  ],
  frustration: [
    'Tu as de quoi mettre de l’intensité là-dedans. Vas-y :',
    'Cette colère a du répondant : sers-t’en. À toi de jouer :',
    'Transforme ce qui t’agace en matière première. C’est parti :',
    'Défoule-toi, mais en créant. Voici ton terrain de jeu :',
  ],
  procrastination: [
    'Petit défi, grand effet. On s’y met maintenant :',
    'Le meilleur moyen de démarrer, c’est de démarrer. Hop :',
    'Pas besoin d’être prêt·e : il suffit de commencer. Tiens :',
    'Cinq minutes, pas plus. Tu verras bien après :',
  ],
  'trop-energie': [
    'Tu tiens pas en place ? Parfait, on en fait quelque chose :',
    'Canalise tout ça. Ton défi du moment :',
    'Plein de jus ? Voici où le mettre :',
    'Ton énergie mérite mieux qu’un pouce qui défile. Fonce :',
  ],
}

/**
 * Tard le soir ou tôt le matin, une introduction sur deux parle du moment
 * plutôt que du mood (toujours dans le ton de sa famille d'énergie).
 */
export const MOMENT_INTROS: Record<'nuit' | 'matin', Record<Energy, readonly string[]>> = {
  nuit: {
    basse: [
      'Il est tard : on fait doux, et après, au lit. Voici :',
      'Plutôt qu’un dernier scroll, un dernier petit plaisir :',
      'La nuit, les idées sont plus libres. Tranquillement :',
    ],
    haute: [
      'Il est tard et ça bouillonne ? On vide la tête avant de dormir :',
      'Même à cette heure-ci, cette énergie mérite mieux qu’un écran. Tiens :',
    ],
  },
  matin: {
    basse: ['Le café n’est pas fini ? Parfait pour ça :', 'Un début de journée tout en douceur :'],
    haute: ['La journée démarre fort ? On canalise tout de suite :', 'Bien réveillé·e ? On commence par créer :'],
  },
}

/** `hour` : l'heure locale de l'utilisateur (0-23), si on la connaît. */
export function pickIntro(mood: MoodId, random: () => number = Math.random, hour?: number): string {
  const moment = hour === undefined ? null : hour >= 22 || hour < 5 ? 'nuit' : hour >= 5 && hour < 9 ? 'matin' : null
  const list = moment && random() < 0.5 ? MOMENT_INTROS[moment][getMood(mood).energy] : INTROS[mood]
  return frenchTypography(list[Math.floor(random() * list.length)] ?? list[0] ?? '')
}
