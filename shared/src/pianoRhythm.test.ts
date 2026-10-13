import { expect, it } from 'vitest'
import { RHYTHM_SONGS, rhythmTiles, rhythmTarget } from './pianoRhythm.ts'
import { isNote } from './keyboard.ts'
it('construit des morceaux finis et jouables à quatre colonnes',()=>{
  for(const song of RHYTHM_SONGS){const tiles=rhythmTiles(song);expect(tiles.length).toBeGreaterThan(20);expect(tiles.every(t=>t.lane>=0&&t.lane<=3&&isNote(t.note)&&t.at<song.durationMs-1000)).toBe(true)}
})
it('refuse une mauvaise colonne, une touche hors temps et une note déjà jouée',()=>{
  const tiles=rhythmTiles(RHYTHM_SONGS[0]!),first=tiles[0]!,used=new Set<number>()
  expect(rhythmTarget(tiles,used,first.lane,first.at)).toEqual(first)
  expect(rhythmTarget(tiles,used,(first.lane+1)%4,first.at)).toBeUndefined()
  expect(rhythmTarget(tiles,used,first.lane,first.at-900)).toBeUndefined()
  used.add(first.id);expect(rhythmTarget(tiles,used,first.lane,first.at)).toBeUndefined()
})
it('suit le tempo musical avec des touches courtes et longues dans chaque morceau',()=>{
  for(const song of RHYTHM_SONGS){
    const tiles=rhythmTiles(song)
    expect(tiles.some(t=>t.holdMs>0)).toBe(true)
    expect(tiles.some(t=>t.holdMs===0)).toBe(true)
    expect(tiles[0]!.at).toBeLessThan(1200)
    expect(tiles.length/(song.durationMs/1000)).toBeGreaterThan(2)
    for(let i=1;i<tiles.length;i++){expect(tiles[i]!.at-tiles[i-1]!.at).toBeCloseTo(tiles[i-1]!.lengthMs);expect(tiles[i]!.lane).not.toBe(tiles[i-1]!.lane)}
    expect(tiles.every(t=>t.at+t.holdMs<song.durationMs)).toBe(true)
  }
})
it('exige une vraie tenue jusqu’à la fin et conserve les anciennes sessions',async()=>{
  const {rhythmHoldComplete,rhythmSong}=await import('./pianoRhythm.ts')
  const tile=rhythmTiles(RHYTHM_SONGS[0]!).find(t=>t.holdMs>0)!
  expect(rhythmHoldComplete(tile,tile.at,tile.at+100)).toBe(false)
  expect(rhythmHoldComplete(tile,tile.at,tile.at+tile.holdMs)).toBe(true)
  expect(rhythmHoldComplete(tile,tile.at-600,tile.at+tile.holdMs)).toBe(false)
  expect(rhythmTiles(rhythmSong('lumiere')!)[0]!.at).toBe(2600)
})
