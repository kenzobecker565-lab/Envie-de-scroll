import { melody } from './keyboard.ts'
import { RHYTHM_SONGS as LEGACY, rhythmTiles as legacyTiles } from './pianoRhythmLegacy.ts'
export interface RhythmSong { id: string; title: string; description: string; durationMs: number; notes: readonly string[]; composer?: string; bpm?: number; beats?: readonly number[]; source?: string }
const tune = (notation: string) => melody('', notation).notes
// Short, monophonic adaptations, synthesized locally; no third-party recordings.
export const RHYTHM_SONGS: readonly RhythmSong[] = [
  { id:'elise', title:'Lettre à Élise', composer:'Ludwig van Beethoven', description:'Vif · notes rapides et tenues', durationMs:90_000, bpm:152, notes:tune('E5 D#5 E5 D#5 E5 B4 D5 C5 A4 C4 E4 A4 B4 E4 G#4 B4 C5 E5 D#5 E5 D#5 E5 B4 D5 C5 A4 C4 E4 A4 B4 E4 C5 B4 A4'), beats:[.5,.5,.5,.5,.5,.5,.5,.5,2,.5,.5,.5,1,.5,.5,.5,2], source:'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=931' },
  { id:'joie', title:'Ode à la joie', composer:'Ludwig van Beethoven', description:'Cadencé · un thème familier', durationMs:60_000, bpm:160, notes:tune('E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4 D4 D4 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4 C4 C4'), beats:[1,1,1,1,1,1,1,1,1,1,1,1,1.5,.5,2], source:'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=528' },
  { id:'turque', title:'Marche turque', composer:'Wolfgang Amadeus Mozart', description:'Énergique · le défi le plus rapide', durationMs:90_000, bpm:144, notes:tune('B4 A4 G#4 A4 C5 D5 C5 B4 C5 E5 F5 E5 D#5 E5 B5 A5 G#5 A5 B5 A5 G#5 A5 C6 A5 C6 A5 C6 A5 C6 A5 C6 B5 A5 G5 F5 E5 D5 C5 B4 A4'), beats:[.5,.5,.5,.5,2,.5,.5,.5,.5,2,.5,.5,.5,.5,2,.5,.5,.5,.5,.5,.5,.5,.5,1,1,1,1,1,1,1,1,.5,.5,.5,.5,.5,.5,.5,.5,2], source:'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=108' },
  { id:'canon', title:'Canon de Pachelbel', composer:'Johann Pachelbel', description:'Fluide · descentes et touches longues', durationMs:120_000, bpm:148, notes:tune('F#5 E5 D5 C#5 B4 A4 B4 C#5 D5 C#5 B4 A4 G4 F#4 G4 E4 F#4 A4 D5 C#5 B4 D5 F#5 G5 A5 G5 F#5 E5 D5 C#5 B4 A4'), beats:[1,1,1,1,1,1,1,2,.5,.5,.5,.5,1,1,1,2], source:'https://imslp.org/wiki/Canon_and_Gigue_in_D_major%2C_P.37_(Pachelbel%2C_Johann)' },
  { id:'twinkle', title:'Ah ! vous dirai-je, maman', composer:'Air traditionnel', description:'Cadencé · l’air de Twinkle Twinkle', durationMs:60_000, bpm:164, notes:tune('C4 C4 G4 G4 A4 A4 G4 F4 F4 E4 E4 D4 D4 C4 G4 G4 F4 F4 E4 E4 D4 G4 G4 F4 F4 E4 E4 D4'), beats:[1,1,1,1,1,1,2,1,1,1,1,1,1,2], source:'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2236' },
  { id:'jacques', title:'Frère Jacques', composer:'Air traditionnel', description:'Vif · petits groupes de notes', durationMs:60_000, bpm:160, notes:tune('C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4 E4 F4 G4 G4 A4 G4 F4 E4 C4 G4 A4 G4 F4 E4 C4 C4 G3 C4 C4 G3 C4'), beats:[1,1,1,1,1,1,1,1,1,1,2,1,1,2,.5,.5,.5,.5,1,1,.5,.5,.5,.5,1,1,1,1,2,1,1,2], source:'https://imslp.org/wiki/Fr%C3%A8re_Jacques_(Rameau,_Jean-Philippe)' },
]
export const rhythmSong = (id: string): RhythmSong | undefined => RHYTHM_SONGS.find(song => song.id === id) ?? LEGACY.find(song => song.id === id)
export interface RhythmTile { id: number; lane: number; note: string; at: number; holdMs: number; lengthMs: number }
export const RHYTHM_TRAVEL_MS = 1050
export const RHYTHM_WINDOW_MS = 210
export function rhythmTiles(song: RhythmSong): RhythmTile[] {
  if (!song.bpm) return legacyTiles(song).map(t => ({ ...t, holdMs:0, lengthMs:700 }))
  const tiles: RhythmTile[] = [], beat = 60000 / song.bpm
  let at = 1100, i = 0
  while (at < song.durationMs - 1400) {
    const beats = song.beats?.[i % (song.beats?.length ?? 1)] ?? 1, lengthMs = beat * beats
    if (at + lengthMs > song.durationMs - 700) break
    let lane = (i * 3 + Math.floor(i / 5)) % 4
    if (tiles.at(-1)?.lane === lane) lane = (lane + 1) % 4
    tiles.push({ id:i, lane, note:song.notes[i % song.notes.length]!, at, lengthMs, holdMs:beats >= 1.5 ? lengthMs : 0 })
    at += lengthMs; i++
  }
  return tiles
}
export function rhythmTarget(tiles: readonly RhythmTile[], used: ReadonlySet<number>, lane: number, time: number): RhythmTile | undefined {
  return tiles.filter(t => t.lane === lane && !used.has(t.id) && Math.abs(t.at - time) <= RHYTHM_WINDOW_MS).sort((a,b) => Math.abs(a.at-time)-Math.abs(b.at-time))[0]
}
export function rhythmHoldComplete(tile: RhythmTile, startedAt: number, releasedAt: number): boolean {
  return tile.holdMs > 0 && Math.abs(startedAt - tile.at) <= RHYTHM_WINDOW_MS && releasedAt >= tile.at + tile.holdMs - 100
}
