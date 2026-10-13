export interface RhythmSong { id: string; title: string; description: string; durationMs: number; notes: readonly string[] }
// Original short melodies, shared by the client and server. No endless playlist.
export const RHYTHM_SONGS: readonly RhythmSong[] = [
  { id: 'lumiere', title: 'Lumière douce', description: 'Un départ en douceur', durationMs: 60_000, notes: ['C4','E4','G4','E4','D4','F4','A4','F4','E4','G4','B4','G4','F4','E4','D4','C4'] },
  { id: 'promenade', title: 'Petite promenade', description: 'Un pas après l’autre', durationMs: 90_000, notes: ['C4','D4','E4','G4','E4','D4','F4','A4','G4','E4','C4','D4','F4','E4','D4','C4'] },
  { id: 'etoiles', title: 'Sous les étoiles', description: 'Une pause tranquille', durationMs: 120_000, notes: ['A4','E4','C4','E4','G4','D4','B4','D4','F4','C4','A4','C4','E4','B4','G4','A4'] },
  { id: 'elan', title: 'Un peu d’élan', description: 'Une mélodie plus vive', durationMs: 120_000, notes: ['C4','E4','D4','G4','F4','A4','G4','E4','D4','F4','E4','B4','A4','G4','E4','C4'] },
  { id: 'vagues', title: 'Les petites vagues', description: 'Laisse-toi porter', durationMs: 180_000, notes: ['C4','D4','E4','F4','G4','F4','E4','D4','E4','F4','G4','A4','G4','E4','D4','C4'] },
]
export const rhythmSong = (id: string) => RHYTHM_SONGS.find(song => song.id === id)
export interface RhythmTile { id: number; lane: number; note: string; at: number }
export function rhythmTiles(song: RhythmSong): RhythmTile[] {
  const count = Math.floor((song.durationMs - 4000) / 900)
  return Array.from({ length: count }, (_, i) => ({ id: i, lane: (i * 3 + Math.floor(i / 4)) % 4, note: song.notes[i % song.notes.length]!, at: 2600 + i * 900 }))
}
export const RHYTHM_WINDOW_MS = 450
export function rhythmTarget(tiles: readonly RhythmTile[], used: ReadonlySet<number>, lane: number, time: number): RhythmTile | undefined {
  return tiles.filter(tile => tile.lane === lane && !used.has(tile.id) && Math.abs(tile.at - time) <= RHYTHM_WINDOW_MS).sort((a,b) => Math.abs(a.at-time)-Math.abs(b.at-time))[0]
}
