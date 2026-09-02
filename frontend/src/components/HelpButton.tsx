interface HelpButtonProps {
  onClick: () => void
}

export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Keyboard shortcuts help"
      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] transition-colors hover:brightness-110"
    >
      ?
    </button>
  )
}
