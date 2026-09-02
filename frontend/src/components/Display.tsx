import type { CalculatorStatus } from '../hooks/useCalculator'

interface DisplayProps {
  echoedOperation: string
  displayValue: string
  status: CalculatorStatus
}

export function Display({ echoedOperation, displayValue, status }: DisplayProps) {
  return (
    <div className="mb-4 flex min-h-24 flex-col items-end justify-end gap-1 overflow-hidden rounded-xl bg-[var(--color-surface-raised)] px-4 py-3 text-right">
      <span className="h-5 w-full truncate text-sm text-[var(--color-text-secondary)]">
        {status === 'result-shown' ? echoedOperation : ''}
      </span>
      <span className="w-full truncate text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">
        {displayValue || '0'}
      </span>
    </div>
  )
}
