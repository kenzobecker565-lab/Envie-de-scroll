/**
 * Instants clés de « La chambre froide » (le boucher et les militants), calculés à
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

  // Le hook : caméra extérieure (le tag), caméra intérieure (la poussée, la porte),
  // le cadenas et le froid, le replay (les attaques, Marc qui attend), l'intérieur glacé, le jugement.
  const hook = {
    CAM2: 1.0, // on passe sur la caméra intérieure
    MARC: 1.35, // le boucher sort de l'ombre
    PUSH: W('01', 'allez') - 0.1, // il les pousse
    SLAM: E('01') + 0.12, // la porte claque
  }
  hook.LOCK = hook.SLAM + 0.55 // le cadenas
  hook.REPLAY = S('02') + 0.1
  hook.REWIND = hook.REPLAY - 0.45
  hook.PORTRAIT = W('02', 'marc') - 0.12
  hook.WAIT = W('02', 'attendait') - 0.1
  hook.INSIDE = W('02', 'il') - 0.1
  hook.COLD = S('03') - 0.08
  hook.HYPO = W('03', 'une') - 0.1
  hook.TODAY = W('03', 'aujourd') - 0.12
  hook.GAVEL = W('03', 'juge') - 0.1

  // Les piques : fond rouge, coup de zoom, la musique se tait.
  const hot = [
    [S('06') - 0.05, E('06') + 0.15],
    [W('07', 'ils') - 0.1, E('07') + 0.1],
    [W('11', 'pas') - 0.1, E('11') + 0.15],
  ]
  // « Et aujourd'hui, c'est lui que vous jugez. » : la musique se tait jusqu'au vote.
  const impact = W('12', 'et') - 0.15

  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('13', 'coupable', 1) + 0.4
  return { S, E, W, has, line, sections, hook, hot, impact, signature, duration: tl.duration, lines: tl.lines }
}
