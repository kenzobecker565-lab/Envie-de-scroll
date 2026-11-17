/**
 * Instants clés du « Vrai verdict : le piolet », calculés à
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

  // Le hook : l'ouverture par le verdict (10 ans / 10 mois avec sursis), la reconstitution de nuit en
  // caméra infrarouge (un seul plan), puis la cour d'assises.
  const hook = { LIVE0: S('01') - 0.05, REWIND: -9, REPLAY: -9 }
  hook.MOIS = W('00', 'dix', 1) - 0.1
  hook.SCENE = S('01') - 0.1
  hook.GAEL = W('01', 'gael') - 0.1
  hook.TWO = W('01', 'deux', 1) - 0.1
  hook.FLEE = W('02', 'lun') - 0.1
  hook.WAIT = W('02', 'lautre') - 0.1
  hook.AXE = W('02', 'gael') - 0.1
  hook.HIT = W('02', 'frappe') - 0.1
  hook.TWELVE = W('02', 'douze') - 0.1
  hook.COURT = S('03') - 0.1
  hook.GAVEL = W('03', 'ecartee') - 0.1

  // Les plans de coupe du procès : [début, fin] de chaque illustration plein écran.
  const tribEnd = cut('13')
  const cuts = {
    LAW: [W('04', 'repousse') - 0.3, W('04', 'mais') - 0.08], // article 122-6 : la nuit, chez soi
    FLEE: [W('04', 'mais') - 0.08, E('04') + 0.1], // les voleurs fuyaient ; c'est lui qui a couru après
    DARK: [W('05', 'une') - 0.1, E('05') + 0.1], // un deuxième homme quelque part dans le noir
    COUNT: [W('06', 'douze') - 0.1, W('06', 'ce') - 0.1], // douze coups
    SCALE: [W('07', 'ils') - 0.08, E('07') + 0.1], // 10 mois avec sursis contre 10 ans
    VERDICT: [S('09') - 0.1, tribEnd],
  }

  // La pique : « Au douzième, ce n'est plus de la peur. »
  const hot = [[W('06', 'ce') - 0.1, E('06') + 0.1]]
  // Le verdict : la musique se tait jusqu'au vote.
  const impact = S('09') - 0.15

  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('13', 'combien') + 0.4
  return { S, E, W, has, line, sections, hook, cuts, hot, impact, signature, duration: tl.duration, lines: tl.lines }
}
