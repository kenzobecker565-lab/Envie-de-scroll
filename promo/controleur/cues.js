/**
 * Instants clés du « Contrôleur » (Manon, 15 ans, débarquée du train la nuit), calculés à
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

  // Le hook : le téléphone d'un passager dans le TER de nuit, les portes qui se ferment,
  // Manon seule sur le quai, le replay (la gare, Manon, le contrôleur), la route, l'hôpital, le jugement.
  const hook = {
    STOP: W('01', 'descends') - 0.25, // le train s'arrête, la porte s'ouvre
    OUT: W('01', 'dit') - 0.05, // elle descend
    CLOSE: E('01') + 0.15, // les portes se referment
  }
  hook.DEPART = hook.CLOSE + 0.45 // le train repart : elle rétrécit sur le quai
  hook.REPLAY = S('02') + 0.1
  hook.REWIND = hook.REPLAY - 0.45
  hook.MANON = W('02', 'manon') - 0.12
  hook.AGENT = W('02', 'le') - 0.1
  hook.ROAD = S('03') - 0.08
  hook.CAR = W('03', 'une') - 0.1 // les phares
  hook.HIT = W('03', 'percutee') + 0.15
  hook.HOSP = W('03', 'trois') - 0.12
  hook.TODAY = W('03', 'aujourd') - 0.12
  hook.GAVEL = W('03', 'juge') - 0.1

  // Les piques : fond rouge, coup de zoom, la musique se tait.
  const hot = [
    [W('06', 'cest') - 0.1, E('06') + 0.15],
    [W('10', 'ou') - 0.1, E('10') + 0.1],
    [W('11', 'et') - 0.1, E('11') + 0.15],
  ]
  // « Lui, il les a appliquées. » : la musique se tait jusqu'au vote.
  const impact = W('12', 'lui') - 0.15

  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('13', 'coupable', 1) + 0.4
  return { S, E, W, has, line, sections, hook, hot, impact, signature, duration: tl.duration, lines: tl.lines }
}
