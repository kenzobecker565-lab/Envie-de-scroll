import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type ShowToast = (message: string) => void

const ToastContext = createContext<ShowToast>(() => {})

/** Petits messages de confirmation (« Prénom enregistré ») qui disparaissent seuls. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)

  const show = useCallback<ShowToast>((message) => setToast({ id: Date.now(), message }), [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[60] flex justify-center px-4"
      >
        {toast && (
          <div key={toast.id} className="animate-fade-down rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper shadow-lift">
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ShowToast {
  return useContext(ToastContext)
}
