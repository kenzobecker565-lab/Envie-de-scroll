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

  // Le hook (un seul plan, filmé par le téléphone du youtubeur) : le selfie, la cagoule, la caméra
  // retournée, l'enfant attrapé, le passant, le poing, la chute du téléphone. Puis le replay.
  const hook = { MASK: W('01', 'je') + 0.15, FLIP: W('01', 'et') + 0.04, GRAB: W('01', 'reagit') + 0.4 }
  hook.PASS = hook.GRAB + 0.3
  hook.PUNCH = S('01b') + 1.35
  hook.FALL = hook.PUNCH + 0.05
  hook.GROUND = hook.PUNCH + 0.65
  hook.SIREN = hook.GROUND + 1.0
  hook.REPLAY = S('02') + 0.1
  hook.REWIND = hook.REPLAY - 0.45
  hook.FAUX = W('02', 'un') - 0.1 // « Un faux enlèvement, en direct »
  hook.TIMEO = W('02', 'timeo') - 0.1
  hook.RACHID = S('03') - 0.08
  hook.COUP = W('03', 'un') - 0.1 // « Un seul coup de poing »
  hook.COMA = W('03', 'trois') - 0.1
  hook.TODAY = W('03', 'aujourd') - 0.12
  hook.GAVEL = W('03', 'juge') - 0.1

  // Les plans de coupe du procès : [début, fin] de chaque illustration plein écran.
  const tribEnd = cut('13')
  const cuts = {
    CHRONO: [W('04', 'cest') - 0.08, W('04', 'jai') - 0.08], // 1,8 s entre le cri et le poing
    FILM: [W('04', 'jai') - 0.08, W('04', 'il') - 0.1], // le live, image par image
    VAN: [W('05', 'cest') - 0.05, W('05', 'mon') - 0.07], // 1,8 s : la portière qui claque
    SCALE: [W('06', 'mais') - 0.08, W('06', 'kevin') - 0.08], // proportionnée ?
    BAG: [W('06', 'kevin') - 0.08, E('06') + 0.12], // pas d'arme ; une cagoule à 9 €
    MASKED: [W('07', 'il') - 0.06, W('07', 'un', 1) - 0.08], // ce que voit Rachid
    KIDCRY: [W('07', 'un', 1) - 0.08, W('07', 'et', 1) - 0.06],
    FROZEN: [W('07', 'et', 1) - 0.06, E('07') + 0.1], // personne ne bouge
    XRAY: [W('09', 'cest') - 0.06, W('09', 'et') - 0.06], // la tête sur le trottoir
    BACK: [W('09', 'et') - 0.06, E('09') + 0.1], // il lui tournait le dos
    HUG: [W('10', 'parce') - 0.1, E('10') + 0.1], // il consolait Timéo ; les secours
    FISTS: [W('11', 'dans') - 0.08, E('11') + 0.1], // frappez d'abord
    PHONES: [W('12', 'dans') - 0.1, tribEnd], // filmez
  }

  // La pique : fond rouge, coup de zoom, la musique se tait.
  const hot = [[W('04', 'il') - 0.1, E('04') + 0.1]]
  // « dans le doute… filmez. » : la musique se tait jusqu'au vote.
  const impact = W('12', 'dans') - 0.15

  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('13', 'coupable', 1) + 0.4
  return { S, E, W, has, line, sections, hook, cuts, hot, impact, signature, duration: tl.duration, lines: tl.lines }
}
