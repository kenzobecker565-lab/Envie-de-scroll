import { describe, expect, it } from 'vitest'
import { cn } from './utils.ts'

describe('cn', () => {
  it('connaît les tailles de texte du design system', () => {
    expect(cn('text-15 text-ink', 'text-13')).toBe('text-ink text-13')
    expect(cn('text-mono-xs text-good-ink')).toBe('text-mono-xs text-good-ink')
  })

  it('connaît les rayons, ombres et polices du design system', () => {
    expect(cn('rounded-md', 'rounded-pill')).toBe('rounded-pill')
    expect(cn('shadow-card', 'shadow-none')).toBe('shadow-none')
    expect(cn('font-display font-bold', 'font-sans')).toBe('font-bold font-sans')
    expect(cn('shadow-card', 'shadow-chip')).toBe('shadow-chip')
    expect(cn('text-46 text-on-color', 'text-40')).toBe('text-on-color text-40')
  })

  it('garde la dernière couleur en cas de conflit', () => {
    expect(cn('bg-accent', false, 'bg-accent-soft')).toBe('bg-accent-soft')
  })
})
