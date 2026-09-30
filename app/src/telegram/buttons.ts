/**
 * Boutons natifs de Telegram : le bouton retour (en haut) et le bouton
 * principal (en bas, au-dessus du clavier). Hors de Telegram, les hooks
 * renvoient `false` et l'écran affiche ses propres boutons à la place.
 */

import { useEffect, useRef } from 'react'
import { themeColor } from './theme.ts'
import { supports, telegram } from './webApp.ts'

export const hasNativeBackButton = Boolean(telegram && supports.backButton)
export const hasNativeMainButton = Boolean(telegram && supports.mainButton)

/** Affiche le bouton retour de Telegram tant que `onBack` est défini. */
export function useBackButton(onBack: (() => void) | undefined): void {
  const handler = useRef(onBack)
  handler.current = onBack
  const visible = onBack !== undefined

  useEffect(() => {
    if (!telegram || !hasNativeBackButton) return
    const button = telegram.BackButton
    if (!visible) {
      button.hide()
      return
    }
    const click = () => handler.current?.()
    button.onClick(click)
    button.show()
    return () => button.offClick(click)
  }, [visible])
}

export interface MainButtonOptions {
  text: string
  onClick: () => void
  enabled?: boolean
  loading?: boolean
}

/**
 * Pilote le bouton principal de Telegram (couleurs du design system).
 * Renvoie `true` si le bouton natif est utilisé.
 */
export function useMainButton(options: MainButtonOptions | null): boolean {
  const handler = useRef(options?.onClick)
  handler.current = options?.onClick
  const active = options !== null
  const text = options?.text ?? ''
  const enabled = options?.enabled ?? true
  const loading = options?.loading ?? false

  useEffect(() => {
    if (!telegram || !hasNativeMainButton || !active) return
    const button = telegram.MainButton
    const click = () => handler.current?.()
    button.onClick(click)
    return () => {
      button.offClick(click)
      if (button.isProgressVisible) button.hideProgress()
      button.hide()
    }
  }, [active])

  useEffect(() => {
    if (!telegram || !hasNativeMainButton || !active) return
    const button = telegram.MainButton
    // D'abord la roue de chargement : hideProgress() du SDK réactive le bouton,
    // setParams() fixe ensuite l'état voulu.
    if (loading) button.showProgress(false)
    else if (button.isProgressVisible) button.hideProgress()
    button.setParams({
      text,
      color: enabled ? themeColor('--accent') : themeColor('--surface-300'),
      text_color: enabled ? themeColor('--accent-ink') : themeColor('--ink-faint'),
      is_active: enabled && !loading,
      is_visible: true,
      ...(supports.shine ? { has_shine_effect: false } : {}),
    })
  }, [active, text, enabled, loading])

  return hasNativeMainButton && active
}
