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

  // Le hook (un seul plan) : le live de la remise. Maëlys tend l'enveloppe ; Gérard compte :
  // 6 000 € ; il remercie ; le chat comprend ; « on coupe ! », la main sur l'objectif.
  // Puis le replay (Maëlys, Gérard, la cagnotte qui s'emballe, les billets, l'enveloppe), le jugement.
  const hook = { GIVE: W('01', 'voila') - 0.05, PANIC: S('01c') }
  hook.TAKE = hook.GIVE + 0.75
  hook.OPEN = hook.TAKE + 0.7
  hook.COUNT = hook.OPEN + 0.2
  hook.COUNT_END = hook.COUNT + 1.3
  hook.CHAT = hook.COUNT_END + 0.5
  hook.STICKER = hook.CHAT + 0.6
  hook.HAND = hook.PANIC + 1.15
  hook.END = hook.HAND + 0.8
  hook.REPLAY = S('02') + 0.1
  hook.REWIND = hook.REPLAY - 0.45
  hook.GERARD_R = W('02', 'gerard') - 0.15
  hook.EIGHTY = W('02', 'recolte') - 0.1
  hook.SIX = S('03') - 0.08
  hook.HEART = W('03', 'dans') - 0.1
  hook.TODAY = W('03', 'aujourd') - 0.12
  hook.GAVEL = W('03', 'jugee') - 0.1

  // Les piques : fond rouge, coup de zoom, la musique se tait.
  const hot = [
    [W('07', 'elle') - 0.1, E('07') + 0.1],
    [W('10', 'zero') - 0.1, E('10') + 0.1],
    [S('11') - 0.05, E('11') + 0.1],
  ]
  // « Il dit qu'elle lui a sauvé la vie. » : la musique se tait jusqu'au vote.
  const impact = W('12', 'il') - 0.15

  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('13', 'coupable', 1) + 0.4
  return { S, E, W, has, line, sections, hook, hot, impact, signature, duration: tl.duration, lines: tl.lines }
}
