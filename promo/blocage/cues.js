/**
 * Instants clés du « Blocage » (la militante, le périphérique et l'ambulance),
 * calculés à partir de timeline.json (écrit par voix.py). Partagés par l'image
 * (main.js) et le son (audio.mjs).
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
    { id: 'tribunal', t0: cut('04'), t1: cut('14'), cut: 'wipe' },
    { id: 'vote', t0: cut('14'), t1: tl.duration, cut: 'wipe' },
  ]

  // Le hook : le téléphone de l'automobiliste, l'arrêt sur image, le replay vu du ciel,
  // l'ambulance, puis Lou devant la justice.
  const hook = {
    MIRROR: W('01', 'ambulance') - 0.15, // on regarde dans le rétroviseur
    BACK: W('01', 'bande') - 0.1, // retour sur les militants
    LUNGE: W('01', 'vous') - 0.1, // il sort de la voiture et fonce sur Lou
    BURST: E('01') + 0.05, // arrêt sur image : le cœur de Michel
  }
  hook.BEEPS = [0.14, 0.4, 0.64].map((d) => hook.BURST + d) // les trois derniers battements
  hook.FLAT = hook.BURST + 0.85 // la ligne devient plate
  hook.REPLAY = S('02') + 0.1 // « Ce matin-là » : vu du ciel
  hook.REWIND = hook.REPLAY - 0.45
  hook.AMBU = S('03') - 0.08 // dans l'ambulance
  hook.CRISIS = W('03', 'infarctus') - 0.15
  hook.DEAD = W('03', 'il', 1) - 0.1 // « Il ne se réveillera pas. »
  hook.TODAY = W('03', 'aujourd') - 0.12 // la photo de Lou
  hook.GAVEL = W('03', 'jugee') - 0.1

  // Les piques : fond rouge, coup de zoom, la musique se tait.
  const hot = [
    [W('06', 'filme') - 0.1, E('06') + 0.15],
    [W('07', 'ces') - 0.1, E('07') + 0.1],
    [W('08', 'fin') - 0.25, E('08') + 0.15],
    [W('11', 'pendant') - 0.1, E('11') + 0.1],
  ]
  // « Il voulait juste arriver à l'hôpital. » : la musique se tait jusqu'au vote.
  const impact = W('13', 'il') - 0.15

  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('14', 'coupable', 1) + 0.4
  return { S, E, W, has, line, sections, hook, hot, impact, signature, duration: tl.duration, lines: tl.lines }
}
