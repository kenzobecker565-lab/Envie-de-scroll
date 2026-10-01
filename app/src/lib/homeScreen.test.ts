import { describe, expect, it } from 'vitest'
import { homeScreenConfirm, homeScreenView } from './homeScreen.ts'

const phone = { supported: true, platform: 'android' }

describe('raccourci sur l’écran d’accueil', () => {
  it('propose l’ajout tant que l’icône n’est pas là, même si Telegram ne répond pas', () => {
    for (const state of ['checking', 'missed', 'unknown'] as const) {
      expect(homeScreenView(state, phone)).toMatchObject({ title: 'Ajouter à l’écran d’accueil', action: true, done: false })
    }
  })

  it('attend la confirmation, puis fête l’icône ajoutée', () => {
    expect(homeScreenView('adding', phone)).toMatchObject({ action: false, description: 'Confirme dans la fenêtre de ton téléphone.' })
    expect(homeScreenView('adding', { supported: true, platform: 'ios' }).description).toContain('page ouverte par Telegram')
    expect(homeScreenView('added', phone)).toMatchObject({ title: 'Sur ton écran d’accueil', action: false, done: true })
  })

  it('explique quoi régler quand le téléphone ne demande rien, et laisse réessayer', () => {
    const view = homeScreenView('silent', phone)
    expect(view.description).toContain('Autorise Telegram à créer des raccourcis')
    expect(view.action).toBe(true)
  })

  it('passe par une fenêtre de Telegram aux textes assez courts', () => {
    for (const platform of ['android', 'ios']) {
      const confirm = homeScreenConfirm(platform)
      expect(confirm.title.length).toBeLessThanOrEqual(64)
      expect(confirm.message.length).toBeLessThanOrEqual(256)
      expect(confirm.button).toBe('Ajouter')
    }
    expect(homeScreenConfirm('ios').message).toContain('Safari')
  })

  it('explique pourquoi quand ce n’est pas possible ici', () => {
    expect(homeScreenView('checking', { supported: false, platform: 'ios' }).description).toContain('Mets Telegram à jour')
    expect(homeScreenView('unsupported', { supported: true, platform: 'tdesktop' }).description).toContain('Sur ordinateur')
    expect(homeScreenView('missed', { supported: true, platform: 'weba' }).action).toBe(false)
    expect(homeScreenView('unsupported', phone).description).toContain('épingle la conversation')
    expect(homeScreenView('failed', phone).action).toBe(false)
  })
})
