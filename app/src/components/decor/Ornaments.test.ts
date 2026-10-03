import { expect, it } from 'vitest'
import { dayPeriod } from './Ornaments.tsx'

it('change d’ambiance aux frontières locales du matin, du jour, du soir et de la nuit', () => {
  expect([0, 5, 6, 10, 11, 16, 17, 20, 21, 23].map(dayPeriod)).toEqual([
    'night', 'night', 'morning', 'morning', 'day', 'day', 'dusk', 'dusk', 'night', 'night',
  ])
})
