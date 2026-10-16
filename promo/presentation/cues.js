/**
 * Repères de la vidéo de présentation, calés sur la voix off
 * (media/voix-off.mp3, générée avec vidIQ) : chaque instant est celui d'un
 * mot, lu dans la transcription horodatée (voir README.md). La voix démarre à
 * VO_START.
 *
 * La musique (../viral/media/musique-vidiq.mp3, 120 BPM) est posée pour que
 * son break tombe sur « Et si on en reprenait un peu ? » et sa reprise sur
 * « Voici Scroll-up ». Elle laisse la place au jazz noir de l'app sur « un
 * petit air de jazz », puis revient sur « Scroll-up ».
 */

export const WIDTH = 1080
export const HEIGHT = 1920
export const FPS = 60
export const DURATION = 61

/** Début de la voix off dans la vidéo. */
export const VO_START = 0.5
/** Instant de la vidéo où la voix off dit ce qu'elle dit à `t` dans son fichier. */
export const vo = (t) => Math.round((VO_START + t) * 1000) / 1000

/**
 * La musique : quel instant du morceau jouer à l'instant t de la vidéo.
 * Avant le jazz : le morceau avance de 2,85 s ; après : il reprend 2 s plus tôt,
 * sur un premier temps, pour finir sur sa propre descente.
 */
export const MUSIC = { before: 2.85, after: -2.19 }

export const T = {
  // 1 · L'accroche : 2 mois par an
  months: vo(0.2), // « mois »
  perYear: vo(0.4),
  screens: vo(1.42), // « C'est le temps qu'on passe devant nos écrans »
  feed: 2.38,
  scrolls: [2.38, 2.88, 3.38, 3.88, 4.13, 4.38, 4.56, 4.72],
  average: vo(3.36), // « en moyenne »
  pause: 4.88, // break de la musique
  question: vo(4.44), // « Et si on en reprenait un peu ? »
  aLittle: vo(5.36),
  // 2 · Voici Scroll-up, dans Telegram
  reveal: 6.88, // reprise de la musique, « Voici »
  name: vo(6.82), // « Scroll-up »
  telegram: vo(8.38), // « une app qui vit dans Telegram »
  telegramWord: vo(9.3),
  openApp: 10.38,
  // 3 · Les passions
  start: 11.38, // tap « C'est parti »
  passions: vo(11.22), // « tu choisis tes passions »
  picks: [vo(12.6), vo(13.34), vo(14.24)], // Dessin, Écriture, Musique
  cinema: vo(14.82),
  go: 15.88,
  // 4 · Un seul bouton
  then: vo(15.88), // « Ensuite »
  itch: vo(16.7), // « quand ton pouce te démange »
  tapCta: 19.88, // « un seul bouton »
  oneButton: vo(19.26),
  // 5 · Trois petits taps
  mood: vo(20.72),
  tapMood: 21.38,
  time: vo(21.64),
  tapTime: 22.38,
  passion: vo(22.32),
  tapPassion: 22.88,
  threeTaps: vo(23.12),
  // 6 · L'activité
  activity: 23.6,
  creative: vo(25.64), // « une activité créative »
  minutes: vo(27.04), // « de 5 à 30 minutes »
  reroll: 28.38, // tap « Une autre idée »
  // 7 · Créer, puis valider
  verbs: [vo(29.36), vo(30.28), vo(31.14), vo(32.02)], // dessines, écris, écoutes, regardes
  backToTake: 33.45,
  tapValidate: 33.88, // « Tu valides »
  photo: vo(34.54),
  words: vo(34.8), // « ou quelques mots »
  tapSave: 36.38,
  // 8 · Pièces d'or et paliers
  done: 36.6,
  coins: vo(37.7), // « une pièce d'or »
  milestone: vo(38.98), // « chaque palier »
  party: vo(39.76), // « se fête »
  // 9 · La galerie
  tapGallery: 40.88,
  gallery: vo(40.78),
  noCalendar: vo(43.3),
  noGuilt: vo(44.5),
  // 10 · Les thèmes, et le jazz
  settings: 45.9,
  tapSettings: 46.12,
  style: vo(45.94),
  themes: [46.88, 47.38, 47.88, 48.38], // Pop Nuit, BD, Memphis, Pop
  jazz: 48.88, // tap sur la musique : le jazz noir entre
  carry: vo(48.48), // « laisse-toi porter »
  jazzWord: vo(49.58), // « par un petit air de jazz »
  // 11 · La fin
  end: 51.92, // « Scroll-up » : la musique revient
  slogan: [vo(52.64), vo(53.42), vo(53.54), vo(53.8), vo(53.96)], // Transforme ton temps de scroll
  creativity: vo(54.26), // « en créativité »
  free: vo(55.92), // « C'est gratuit, sur Telegram »
  final: 58.42,
}
