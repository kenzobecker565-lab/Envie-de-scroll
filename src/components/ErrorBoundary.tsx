import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AppMark } from './ui/Logo'

interface State {
  error: Error | null
}

/**
 * Filet de sécurité : si un écran plante (bug imprévu), on affiche un
 * message clair avec un bouton pour relancer l'app, au lieu d'une page
 * blanche. Les données, elles, restent intactes dans la base locale.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur inattendue dans l’interface', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="grid min-h-dvh place-items-center bg-paper p-6 text-ink">
        <div role="alert" className="max-w-sm text-center">
          <AppMark className="mx-auto size-14" />
          <h1 className="mt-5 font-display text-2xl font-semibold">Oups, un souci d’affichage</h1>
          <p className="mt-2 leading-relaxed text-ink-soft">
            Quelque chose s’est mal passé sur cet écran. Pas d’inquiétude&nbsp;: tes données sont en sécurité sur ton appareil.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/'
                window.location.reload()
              }}
              className="h-12 rounded-2xl bg-primary px-5 font-semibold text-on-primary shadow-soft"
            >
              Revenir à l’accueil
            </button>
            <button type="button" onClick={() => window.location.reload()} className="h-12 rounded-2xl px-5 font-semibold text-ink-soft">
              Recharger la page
            </button>
          </div>
          <details className="mt-6 text-left text-xs text-ink-soft">
            <summary className="cursor-pointer text-center">Détails techniques</summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-xl bg-card p-3">{error.message}</pre>
          </details>
        </div>
      </div>
    )
  }
}
