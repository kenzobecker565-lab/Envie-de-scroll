import { useRef, type ReactNode } from 'react'

interface PhotoButtonProps {
  onFile: (file: File) => void
  className?: string
  children: ReactNode
  label?: string
  disabled?: boolean
}

/**
 * Bouton qui ouvre le sélecteur de photos (ou l'appareil photo sur mobile).
 * Le vrai champ fichier est caché ; le bouton reste utilisable au clavier.
 */
export function PhotoButton({ onFile, className, children, label, disabled }: PhotoButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = ''
        }}
      />
      <button type="button" aria-label={label} disabled={disabled} className={className} onClick={() => inputRef.current?.click()}>
        {children}
      </button>
    </>
  )
}
