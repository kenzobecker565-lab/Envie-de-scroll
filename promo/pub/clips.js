/**
 * Clips vidéo réels utilisés dans la pub (Pexels, licence libre ; crédits dans
 * credits.json). « in » et « length » : le passage extrait (en secondes) ;
 * « fps » : la cadence d'origine du clip.
 */
export const CLIPS = {
  'hook-fille': { in: 2.0, length: 3.2, fps: 25 },
  'hook-lit': { in: 1.0, length: 3.2, fps: 25 },
  dessin: { in: 2.5, length: 3.2, fps: 24 },
  musique: { in: 3.5, length: 3.2, fps: 25 },
  cuisine: { in: 11.0, length: 3.2, fps: 25 },
  sport: { in: 1.5, length: 3.2, fps: 25 },
  // Les vidéos du fil, qui défilent pendant l'accroche
  'feed-danse': { in: 1.0, length: 2.0, fps: 25 },
  'feed-chat': { in: 0.5, length: 2.0, fps: 25 },
  'feed-food': { in: 0.3, length: 2.0, fps: 30 },
  'feed-skate': { in: 4.5, length: 2.0, fps: 25 },
}
