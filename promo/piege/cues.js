/**
 * Instants clés du « Piège » (le streamer « chasseur de prédateurs »), calculés à
 * partir de timeline.json (écrit par voix.py). Partagés par l'image (main.js) et
 * le son (audio.mjs).
 */

export const FPS = 30
export const WIDTH = 1080
export const HEIGHT = 1920

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')

export function makeCues(tl) {
  const line = (id) => {
    const l = tl.lines.find((x) => x.id.startsWith(id))
    if (!l) throw new Error(`Réplique inconnue : ${id}`)
    return l
  }
  const has = (id) => tl.lines.some((x) => x.id.startsWith(id))
  const S = (id) => line(id).start
  const E = (id) => line(id).start + line(id).dur
  const W = (id, word, n = 0) => {
    const found = line(id).words.filter((w) => norm(w.w).startsWith(norm(word)))
    if (!found[n]) throw new Error(`Mot « ${word} » introuvable dans ${id}`)
    return found[n].t
  }
  const cut = (id) => S(id) - 0.15

  // Les scènes. « cut » : transition d'entrée.
  const sections = [
    { id: 'hook', t0: 0, t1: cut('04') },
    { id: 'tribunal', t0: cut('04'), t1: cut('12'), cut: 'wipe' },
    { id: 'vote', t0: cut('12'), t1: tl.duration, cut: 'wipe' },
  ]

  // Le hook : le direct sur le parking, l'arrêt sur image, la chaîne de Yanis,
  // l'erreur, le harcèlement, puis Yanis devant la justice.
  const hook = {
    RUSH: W('01', 'treize', 1) - 0.1, // il fonce sur l'homme
    FACE: W('01', 'regarde') - 0.12, // « Regarde la caméra ! » : gros plan
    BURST: E('01') + 0.05, // capture d'écran : PRÉDATEUR ?
  }
  hook.REPLAY = S('02') + 0.1 // la chaîne de Yanis
  hook.REWIND = hook.REPLAY - 0.45
  hook.WRONG = W('02', 'mais') - 0.1 // « Mais ce soir-là… »
  hook.DIFF = W('02', 'celui') - 0.12 // ce n'était pas lui
  hook.DATE = S('03') - 0.08 // le vrai rendez-vous
  hook.HATE = W('03', 'trois') - 0.12 // trois jours de harcèlement
  hook.DEAD = W('03', 'suicide') - 0.1
  hook.TODAY = W('03', 'aujourd') - 0.12 // Yanis devant son anneau lumineux
  hook.GAVEL = W('03', 'juge') - 0.1

  // Les piques : fond rouge, coup de zoom, la musique se tait.
  const hot = [
    [W('06', 'les', 1) - 0.1, E('06') + 0.15],
    [W('09', 'sans') - 0.1, E('09') + 0.1],
    [W('10', 'mais') - 0.1, E('10') + 0.15],
  ]
  // « Un pouce bleu… et une corde ? » : la musique se tait jusqu'au vote.
  const impact = W('11', 'pouce') - 0.4

  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('12', 'coupable', 1) + 0.4
  return { S, E, W, has, line, sections, hook, hot, impact, signature, duration: tl.duration, lines: tl.lines }
}
