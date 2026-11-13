/**
 * Instants clés du « Permis » (Bernard, 87 ans, et Léa, 7 ans), calculés à
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

  // Le hook : la dashcam, l'écran noir et le ballon, le replay (les pédales,
  // la famille, les accidents, le permis), Léa, puis le jugement.
  const hook = {
    REV: 1.3, // le moteur s'emballe
    GIRL: 1.5, // la petite fille court après le ballon
    SCREECH: E('01') + 0.02, // crissement de pneus
  }
  hook.HIT = hook.SCREECH + 0.42 // écran noir
  hook.REPLAY = S('02') + 0.1
  hook.REWIND = hook.REPLAY - 0.45
  hook.PEDALS = W('02', 'confondu') - 0.15
  hook.FAMILY = W('02', 'sa') - 0.12
  hook.CRASHES = W('02', 'trois') - 0.12
  hook.REFUSE = W('02', 'il') - 0.1
  hook.LEA = S('03') - 0.08
  hook.TODAY = W('03', 'aujourd') - 0.12
  hook.GAVEL = W('03', 'jugement') - 0.1

  // Les piques : fond rouge, coup de zoom, la musique se tait.
  const hot = [
    [W('06', 'il') - 0.1, E('06') + 0.15],
    [W('07', 'vous') - 0.1, E('07') + 0.15],
    [W('10', 'vous') - 0.1, E('10') + 0.15],
  ]
  // « C'est cher payé, sa liberté. » : la musique se tait jusqu'au vote.
  const impact = W('12', 'cest') - 0.15

  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('13', 'coupable', 1) + 0.4
  return { S, E, W, has, line, sections, hook, hot, impact, signature, duration: tl.duration, lines: tl.lines }
}
