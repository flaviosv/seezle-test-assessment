interface HelpButtonProps {
  onClick: () => void
}

// SPEC_DEVIATION: placeholder only, to satisfy CalculatorApp.tsx (T15)'s
// build gate ahead of schedule. Real implementation lands in T17.
export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <button type="button" onClick={onClick}>
      ?
    </button>
  )
}
