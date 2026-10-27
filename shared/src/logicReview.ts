import { normalizeCode, permutations, type Assignment, type Puzzle } from './workshops.ts'

export interface PuzzleExplanation { solution: string[]; steps: string[]; mistakes: string[] }
/** Explain the actual constraints, not just disclose the expected answer. */
export function explainPuzzle(puzzle: Puzzle, answer?: unknown): PuzzleExplanation {
  if (puzzle.kind === 'grid') {
    const perms = permutations([0, 1, 2, 3])
    let possibilities = perms.flatMap(rooms => perms.map(times => ({ rooms, times })))
    const known = new Set<string>()
    const steps = ['Chaque personne possède une seule salle et un seul horaire. Les salles et les horaires ne se répètent pas : on commence avec 24 × 24 = 576 répartitions possibles.']
    puzzle.clues.forEach((clue, index) => {
      const before = possibilities.length
      possibilities = possibilities.filter(clue.accepts)
      const deductions: string[] = []
      puzzle.people.forEach((person, i) => {
        for (const kind of ['rooms', 'times'] as const) {
          const values = new Set(possibilities.map(s => s[kind][i]))
          const key = `${kind}-${i}`
          if (values.size === 1 && !known.has(key)) {
            known.add(key)
            const value = [...values][0]!
            deductions.push(`${person} : ${kind === 'rooms' ? puzzle.rooms[value] : puzzle.times[value]}.`)
          }
        }
      })
      steps.push(`Indice ${index + 1} : ${clue.text} On écarte les répartitions qui le contredisent (${before - possibilities.length} éliminée${before - possibilities.length > 1 ? 's' : ''}). Il en reste ${possibilities.length}, en respectant aussi les indices précédents.${deductions.length ? ' Ce croisement impose : ' + deductions.join(' ') : ' Il faut croiser cet indice avec les suivants avant de confirmer une attribution.'}`)
    })
    steps.push('La dernière répartition est la seule qui respecte tous les indices simultanément. On vérifie chaque salle, chaque horaire et chaque délai une dernière fois.')
    const value = answer as Assignment | undefined
    const mistakes: string[] = []
    if (!value || !Array.isArray(value.rooms) || !Array.isArray(value.times) || [...value.rooms, ...value.times].some(v => v === -1)) mistakes.push('Ta réponse est incomplète : certaines salles ou certains horaires n’ont pas été attribués.')
    else if (new Set(value.rooms).size !== 4 || new Set(value.times).size !== 4) mistakes.push('Une même salle ou un même horaire a été attribué plusieurs fois, alors que chacun ne doit apparaître qu’une fois.')
    else puzzle.clues.forEach((clue, index) => { if (!clue.accepts(value)) mistakes.push(`Ta répartition contredit l’indice ${index + 1} : ${clue.text}`) })
    return { solution: puzzle.people.map((person, i) => `${person} → ${puzzle.rooms[puzzle.solution.rooms[i]!]} → ${puzzle.times[puzzle.solution.times[i]!]}`), steps, mistakes }
  }
  const mistakes = typeof answer !== 'string' || !answer.trim() ? ['Tu n’as pas proposé de réponse. Tu peux tout de même terminer et étudier la méthode.'] : []
  if (typeof answer === 'string' && answer.trim() && normalizeCode(answer) !== puzzle.answer) mistakes.push('Ta proposition ne correspond pas à la solution. Reprends les contraintes et la vérification détaillées ci-dessous.')
  if (puzzle.family === 'Cryptographie') {
    const encoded = puzzle.prompt.match(/Déchiffre : ([A-Z]+)\./)?.[1] ?? ''
    const shift = ((encoded.charCodeAt(0) - puzzle.answer.charCodeAt(0)) + 26) % 26
    return { solution: [puzzle.answer], mistakes, steps: [
      `Le mot connu « CLE » permet de retrouver le décalage : C devient ${String.fromCharCode(65 + (2 + shift) % 26)}. Chaque lettre a donc avancé de ${shift} places.`,
      `Pour déchiffrer, on recule de ${shift} places pour chaque lettre ; si on dépasse A, on reprend à Z.`,
      [...encoded].map((letter, i) => `${letter} → ${puzzle.answer[i]}`).join(' ; ') + '.',
      `Les lettres obtenues forment « ${puzzle.answer} ». En avançant à nouveau chaque lettre de ${shift} places, on retrouve ${encoded} : c’est la vérification.`,
    ] }
  }
  const digits = [1, 2, 3, 4, 5, 6, 7]
  let codes = digits.flatMap(a => digits.filter(b => b !== a).flatMap(b => digits.filter(c => c !== a && c !== b).flatMap(c => digits.filter(d => d !== a && d !== b && d !== c).map(d => `${a}${b}${c}${d}`))))
  const clues = [...puzzle.prompt.matchAll(/(\d{4}) : (\d) chiffre\(s\) bien placé\(s\), (\d) chiffre\(s\) présent\(s\) mais mal placé\(s\)/g)]
  const score = (guess: string, code: string) => { const exact = [...guess].filter((v, i) => code[i] === v).length; return [exact, [...guess].filter(v => code.includes(v)).length - exact] }
  const steps = ['On utilise quatre chiffres différents entre 1 et 7 : 7 × 6 × 5 × 4 = 840 codes possibles. Un chiffre bien placé n’est jamais recompté comme mal placé.']
  for (const clue of clues) {
    const guess = clue[1]!, exact = Number(clue[2]), misplaced = Number(clue[3])
    codes = codes.filter(code => { const s = score(guess, code); return s[0] === exact && s[1] === misplaced })
    steps.push(`Essai ${guess} : exactement ${exact} chiffre(s) à la bonne position et ${misplaced} autre(s) présent(s) à une position différente. Cela signifie ${exact + misplaced} chiffre(s) présents et ${4 - exact - misplaced} absent(s). En croisant cet essai avec les précédents, il reste ${codes.length} code(s) compatible(s).`)
    if (typeof answer === 'string' && /^[1-7]{4}$/.test(answer)) { const s = score(guess, answer); if (s[0] !== exact || s[1] !== misplaced) mistakes.push(`Avec ta réponse ${answer}, l’essai ${guess} donne ${s[0]} bien placé(s) et ${s[1]} mal placé(s), au lieu de ${exact} et ${misplaced}.`) }
  }
  steps.push(`Il ne reste que ${puzzle.answer}. On le compare à chaque essai : tous les nombres de chiffres bien placés et mal placés correspondent.`)
  return { solution: [puzzle.answer], steps, mistakes }
}
