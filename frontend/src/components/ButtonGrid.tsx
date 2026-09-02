import type { CalculatorState } from '../hooks/useCalculator'

interface ButtonGridProps {
  state: CalculatorState
  onInputChar: (char: string) => void
  onSubmit: () => void
  onClear: () => void
  onBackspace: () => void
  onToggleSign: () => void
  onInputDecimal: () => void
}

// SPEC_DEVIATION: placeholder only, to satisfy CalculatorApp.tsx (T15)'s
// build gate ahead of schedule. Real implementation lands in T17.
export function ButtonGrid({ onSubmit }: ButtonGridProps) {
  return (
    <button type="button" onClick={onSubmit}>
      =
    </button>
  )
}
