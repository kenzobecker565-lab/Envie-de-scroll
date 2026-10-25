import type { Duration } from './types.ts'
import type { Melody } from './keyboard.ts'

export type PianoSupport = 'guided' | 'start' | 'memory'
export type PianoPracticeStep = { title: string; support: PianoSupport; melody: Melody; final: boolean }
export const isPianoPracticeActivity = (id:string) => /^piano-(5|15|30)-\d+$/.test(id)

/** Keep beginner excerpts short enough to repeat during the chosen session. */
export function pianoPracticeExcerpt(melody:Melody,duration:Duration):Melody {
 const count=duration===5?1:duration===15?2:4
 const phrases=melody.phrases.slice(0,count)
 const notes=phrases.flat()
 return {...melody,phrases,notes,partStarts:[0],...(melody.beats?{beats:melody.beats.slice(0,notes.length)}:{})}
}
/** Every phrase is recalled before the complete excerpt is attempted. */
export function pianoPracticePlan(melody: Melody, duration: Duration): PianoPracticeStep[] {
 const steps: PianoPracticeStep[] = []
 const add = (title: string, support: PianoSupport, phrases: readonly (readonly string[])[], final = false) => {
  const notes = phrases.flat()
  const offset = melody.phrases.slice(0, melody.phrases.indexOf(phrases[0]!)).flat().length
  steps.push({ title, support, final, melody: { title: melody.title, phrases, notes, partStarts: [0], ...(melody.beats ? { beats: melody.beats.slice(offset, offset + notes.length) } : {}) } })
 }
 melody.phrases.forEach((phrase, i) => {
  const name = `Phrase ${i + 1}`
  add(`${name} · découvrir`, 'guided', [phrase])
  add(`${name} · répéter`, 'guided', [phrase])
  add(`${name} · retrouver`, 'start', [phrase])
  add(`${name} · de mémoire`, 'memory', [phrase])
  if (duration !== 5) add(`${name} · confirmer`, 'memory', [phrase])
  if (i > 0 && duration === 30) add(`Relier les phrases 1 à ${i + 1}`, 'memory', melody.phrases.slice(0, i + 1))
 })
 add('Tout relier', 'start', melody.phrases)
 add('Ton essai sans aide', 'memory', melody.phrases, true)
 add('Confirmer de mémoire', 'memory', melody.phrases, true)
 return steps
}
/** Metadata only. Musical arrangements must be supplied before publication. */
export const PIANO_BEGINNER_CATALOG = [
 {id:'piano-pop-blinding-5',duration:5,title:'Blinding Lights',artist:'The Weeknd',excerpt:'Motif instrumental court',phrases:1},
 {id:'piano-pop-asitwas-5',duration:5,title:'As It Was',artist:'Harry Styles',excerpt:'Boucle instrumentale courte',phrases:1},
 {id:'piano-pop-golden-5',duration:5,title:'Golden',artist:'HUNTR/X',excerpt:'Une phrase du refrain',phrases:1},
 {id:'piano-pop-birds-15',duration:15,title:'BIRDS OF A FEATHER',artist:'Billie Eilish',excerpt:'Deux phrases du refrain',phrases:2},
 {id:'piano-pop-someone-15',duration:15,title:'Someone You Loved',artist:'Lewis Capaldi',excerpt:'Passage court du refrain',phrases:2},
 {id:'piano-pop-another-15',duration:15,title:'Another Love',artist:'Tom Odell',excerpt:'Motif d’introduction simplifié',phrases:2},
 {id:'piano-pop-golden-30',duration:30,title:'Golden',artist:'HUNTR/X',excerpt:'Refrain développé',phrases:4},
 {id:'piano-pop-someone-30',duration:30,title:'Someone You Loved',artist:'Lewis Capaldi',excerpt:'Refrain développé',phrases:4},
 {id:'piano-pop-birds-30',duration:30,title:'BIRDS OF A FEATHER',artist:'Billie Eilish',excerpt:'Refrain développé',phrases:4},
] as const
