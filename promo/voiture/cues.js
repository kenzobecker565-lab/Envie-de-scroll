/**
 * Instants clés de « La voiture du voisin », calculés à
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

  // L'ouverture « fait divers » (le narrateur pose l'affaire), puis la caméra de bord de la
  // voiture volée : un seul plan, six feux rouges, six flashs, la maternité. Puis le replay.
  const hook = { LIVE0: S('01') - 0.05, INTRO_VOL: W('00', 'vole') - 0.12, INTRO_FEUX: W('00', 'grille') - 0.1 }
  hook.FLASHES = [W('01', 'sarah') + 0.15, W('01', 'dix') - 0.05, S('01b') + 0.05, W('01b', 'arrive') + 0.1, W('01b', 'sens') + 0.4, E('01b') + 0.85]
  hook.ARRIVE = E('01b') + 1.25 // la maternité
  hook.REPLAY = S('02') - 0.1
  hook.REWIND = hook.REPLAY - 0.45
  hook.BERNARD = W('02', 'la') - 0.08
  hook.KEYS = W('02', 'les') - 0.08
  hook.INAYA = S('03') - 0.08
  hook.FINES = W('03', 'trois') - 0.1
  hook.POINTS = W('03', 'son') - 0.08
  hook.TODAY = W('03', 'aujourd') - 0.12
  hook.GAVEL = W('03', 'juge') - 0.1

  // Les plans de coupe du procès : [début, fin] de chaque illustration plein écran.
  const tribEnd = cut('13')
  const cuts = {
    TV: [W('04', 'bernard') - 0.08, W('04', 'il') - 0.08], // la télé allumée, vue de la rue
    STREET: [W('04', 'il') - 0.08, E('04') + 0.1], // traverser et frapper : 20 mètres
    WAIT: [W('05', 'attendre') - 0.08, W('05', 'la') - 0.06], // frapper, expliquer, attendre : le chrono
    CORD: [W('05', 'la') - 0.06, E('05') + 0.1], // le monitoring, le cordon
    TRUCK: [W('06', 'cest') - 0.06, W('06', 'a', 1) - 0.06], // le carrefour, le camion
    LIVES: [W('06', 'a', 1) - 0.06, W('06', 'et') - 0.06], // trois vies contre une
    CODE: [W('07', 'quand') - 0.08, E('07') + 0.1], // le Code pénal, article 122-7
    CHOCO: [W('09', 'il') - 0.06, W('09', 'les') - 0.06], // la voiture rendue, le plein, les chocolats
    MAIL: [W('09', 'les') - 0.06, W('09', 'aujourd') - 0.08], // les six amendes dans la boîte aux lettres
    BUS: [W('09', 'aujourd') - 0.08, E('09') + 0.1], // Bernard à l'arrêt de bus
    PAY: [W('10', 'il') - 0.06, W('10', 'bernard') - 0.06], // 1 300 € par mois, l'échéancier
    TAXI: [W('11', 'chaque') - 0.08, E('11') + 0.1], // chaque voiture garée devient un taxi
    BABY: [W('12', 'il') - 0.06, tribEnd], // il ne s'excusera pas d'avoir fait naître sa fille
  }

  // La pique : fond rouge, coup de zoom, la musique se tait.
  const hot = [[W('04', 'on') - 0.1, W('04', 'bernard') - 0.12]]
  // « Il ne s'excusera pas… » : la musique se tait jusqu'au vote.
  const impact = W('12', 'il') - 0.15

  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('13', 'coupable', 1) + 0.4
  return { S, E, W, has, line, sections, hook, cuts, hot, impact, signature, duration: tl.duration, lines: tl.lines }
}
