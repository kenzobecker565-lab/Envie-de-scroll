import {describe,it,expect} from 'vitest'
import {paginateText,calendarMonth,mergeCreations} from './gallery.ts'
import type {CompletionDTO} from '@scroll-up/shared'
describe('la galerie personnelle',()=>{
 it('feuillette sans perdre un caractère, même avec paragraphes, emoji et mots longs',()=>{
 for(const text of ['Bonjour\n\n'+('Une phrase à conserver. '.repeat(250)), '🟣'.repeat(700),'a'.repeat(6000)]){const pages=paginateText(text,220);expect(pages.join('')).toBe(text);expect(pages.every(page=>page.length<=220)).toBe(true);expect(pages.some(page=>/[\uD800-\uDBFF]$/.test(page))).toBe(false)}
 })
 it('aligne octobre 2026 au jeudi et conserve les 31 jours',()=>{const cells=calendarMonth(2026,9);expect(cells.slice(0,3)).toEqual([null,null,null]);expect(cells[3]).toBe(1);expect(cells.at(-1)).toBe(31)})
 it('ne duplique pas une création au chargement des pages',()=>{const item={id:'a',text:'avant'} as CompletionDTO;expect(mergeCreations([item],[{...item,text:'après'}])).toEqual([{...item,text:'après'}])})
})
