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
