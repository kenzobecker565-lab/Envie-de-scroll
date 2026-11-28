/**
 * Instants clés du « Vrai verdict : Thiais », calculés à
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

  // Le hook : l'ouverture « fait divers » (l'affaire en une phrase), la reconstitution en caméra de
  // surveillance (un seul plan), puis la cour d'assises.
  const hook = { LIVE0: S('01') - 0.05, REWIND: -9, REPLAY: -9 }
  hook.SCENE = S('01') - 0.1
  hook.PABLO = W('01', 'pablo') - 0.1
  hook.ARRIVE = W('01', 'deux') - 0.1
  hook.KNIFE = W('01', 'couteau') - 0.1
  hook.KEYS = W('01', 'cles') - 0.1
  hook.HURT = W('02', 'blesse') - 0.1
  hook.GRAB = W('02', 'arrache') - 0.1
  hook.FIGHT = W('02', 'bagarre') - 0.1
  hook.DOWN = W('02', 'ne') - 0.1
  hook.SIREN = W('02', 'pas') + 0.2
  hook.COURT = S('03') - 0.1
  hook.GAVEL = W('03', 'ecartee') - 0.1

  // Les plans de coupe du procès : [début, fin] de chaque illustration plein écran.
  const tribEnd = cut('13')
  const cuts = {
    LAW: [W('04', 'cest') - 0.08, W('04', 'ici') - 0.08], // nécessaire et proportionnée (article 122-5)
    BODY: [W('04', 'ici') - 0.08, W('04', 'nest') - 0.25], // cinq plaies au thorax, deux à la tête
    DARK: [W('05', 'dans') - 0.08, E('05') + 0.1], // dans le noir, on ne compte pas ses coups
    KNIFE: [W('06', 'son') - 0.08, W('06', 'menace') - 0.25], // l'arme change de mains
    TWO: [W('07', 'ils') - 0.08, W('07', 'vous') - 0.08], // ils étaient deux
    CLOCK: [W('07', 'vous') - 0.08, E('07') + 0.1], // trois secondes
    VERDICT: [S('09') - 0.1, tribEnd], // 12 ans ; l'agresseur survivant : 5 ans dont 3 avec sursis
  }

  // La pique : « Ce n'est plus se défendre. C'est s'acharner. »
  const hot = [[W('04', 'nest') - 0.25, E('04') + 0.1]]
  // Le verdict : la musique se tait jusqu'au vote.
  const impact = S('09') - 0.15

  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('13', 'combien') + 0.4
  return { S, E, W, has, line, sections, hook, cuts, hot, impact, signature, duration: tl.duration, lines: tl.lines }
}
