/**
 * Instants clés du « Chien » (le père, la pelle et l'american staff), calculés à
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
    { id: 'tribunal', t0: cut('04'), t1: cut('13'), cut: 'wipe' },
    { id: 'vote', t0: cut('13'), t1: tl.duration, cut: 'wipe' },
  ]

  // Le hook : la caméra de sonnette (le chien, l'enfant, le père, la pelle), l'allée vide
  // et les coups hors champ, le replay (Rocky, Nathan, le père), la fuite, onze coups, le collier.
  const hook = {
    DOG: 0.35, // le chien passe sous la clôture
    BITE: 1.15, // il saute sur l'enfant
    DAD: 1.55, // le père surgit avec la pelle
    STRIKE: W('01', 'sale') - 0.05, // le premier coup
  }
  hook.FLEE = hook.STRIKE + 0.35 // le chien lâche et s'enfuit, le père le poursuit
  hook.OFF = E('01') + 0.15 // l'allée vide, les coups hors champ
  hook.REPLAY = S('02') + 0.1
  hook.REWIND = hook.REPLAY - 0.45
  hook.HITS = Array.from({ length: 10 }, (_, k) => hook.FLEE + 0.6 + k * ((hook.REWIND - hook.FLEE - 0.75) / 10)) // les coups 2 à 11
  hook.NATHAN = W('02', 'mord') - 0.1
  hook.PELLE = W('02', 'son') - 0.1
  hook.CHASE = S('03') - 0.08
  hook.ONZE = W('03', 'onze') - 0.1
  hook.DEAD = W('03', 'rocky') - 0.1
  hook.TODAY = W('03', 'aujourd') - 0.12
  hook.GAVEL = W('03', 'juge') - 0.1

  // Les piques : fond rouge, coup de zoom, la musique se tait.
  const hot = [
    [W('05', 'vous') - 0.1, E('05') + 0.15],
    [W('07', 'vous') - 0.1, E('07') + 0.1],
    [W('10', 'ce') - 0.1, E('10') + 0.15],
  ]
  // « Et un père qui est venu. » : la musique se tait jusqu'au vote.
  const impact = W('12', 'et') - 0.15

  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('13', 'coupable', 1) + 0.4
  return { S, E, W, has, line, sections, hook, hot, impact, signature, duration: tl.duration, lines: tl.lines }
}
