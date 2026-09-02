import { useEffect } from 'react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS: Array<[string, string]> = [
  ['0-9', 'Digits'],
  ['+ - * / ^ \\ %', 'Operators'],
  ['.', 'Decimal point'],
  ['Enter or =', 'Calculate'],
  ['Backspace', 'Delete last character'],
  ['AC', 'Clear'],
  ['+/- or ±', 'Toggle sign'],
  ['?', 'Open this help'],
]

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="help-modal-title" className="text-lg font-semibold">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            ✕
          </button>
        </div>
        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map(([keys, description]) => (
            <li key={keys} className="flex justify-between gap-4">
              <span className="font-mono text-[var(--color-text-secondary)]">{keys}</span>
              <span>{description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
