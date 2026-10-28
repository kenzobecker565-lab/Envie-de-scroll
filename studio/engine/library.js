/**
 * Bibliothèque du studio : décors et images réutilisables d'un épisode à l'autre.
 * Les chemins partent de la racine du dépôt.
 *
 * Décor : trois éclairages (jour, coucher, nuit), la ligne du sol (y où marchent
 * les personnages, en pixels du cadre 1080 × 1920) et l'horizon.
 * Image : fichier, point d'ancrage (en pixels de l'image) et taille par défaut.
 */
const EP2 = 'minuton/episodes/02_images'

export const DECORS = {
  jardin: {
    name: 'Jardin',
    plates: { day: `${EP2}/Decors/D1.png`, sunset: `${EP2}/Decors/D2.png`, night: `${EP2}/Decors/D3.png` },
    ground: 1330,
    horizon: 1000,
    sun: [860, 260],
    moon: [250, 300],
  },
}

export const IMAGES = {
  pot: { src: `${EP2}/Plantes/PL0.png`, anchor: [512, 1472], height: 1019 },
  pousse: { src: `${EP2}/Plantes/PL1.png`, anchor: [512, 1472], height: 1019 },
  tournesol: { src: `${EP2}/Plantes/PL5.png`, anchor: [512, 1472], height: 1019 },
  'tournesol-gauche': { src: `${EP2}/Plantes/PL6.png`, anchor: [512, 1472], height: 1019 },
  'tournesol-droite': { src: `${EP2}/Plantes/PL7.png`, anchor: [512, 1472], height: 1019 },
  'tournesol-penche': { src: `${EP2}/Plantes/PL8.png`, anchor: [512, 1472], height: 1019 },
  graine: { src: `${EP2}/Elements/E1.png`, anchor: [701, 561], height: 50 },
  petale: { src: `${EP2}/Elements/E2.png`, anchor: [608, 646], height: 80 },
}

export const RIGS = { minuton: 'studio/library/minuton' }
