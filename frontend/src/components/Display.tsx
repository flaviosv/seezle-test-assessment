import type { CalculatorStatus } from '../hooks/useCalculator'

interface DisplayProps {
  echoedOperation: string
  displayValue: string
  status: CalculatorStatus
}

// SPEC_DEVIATION: placeholder only, to satisfy CalculatorApp.tsx (T15)'s
// build gate ahead of schedule. Real implementation lands in T16.
export function Display({ displayValue }: DisplayProps) {
  return <div>{displayValue}</div>
}
