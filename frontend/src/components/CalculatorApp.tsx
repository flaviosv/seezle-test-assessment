import { useCalculator } from '../hooks/useCalculator'
import { Display } from './Display'
import { ButtonGrid } from './ButtonGrid'
import { HelpButton } from './HelpButton'

interface CalculatorAppProps {
  onHelpClick: () => void
  isHelpOpen?: boolean
}

export function CalculatorApp({ onHelpClick, isHelpOpen = false }: CalculatorAppProps) {
  const { state, inputChar, inputDecimal, toggleSign, backspace, clear, submit } =
    useCalculator(isHelpOpen)

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-4 shadow-xl sm:p-6">
        <HelpButton onClick={onHelpClick} />
        <Display
          echoedOperation={state.echoedOperation}
          displayValue={state.displayValue}
          status={state.status}
        />
        <ButtonGrid
          state={state}
          onInputChar={inputChar}
          onSubmit={submit}
          onClear={clear}
          onBackspace={backspace}
          onToggleSign={toggleSign}
          onInputDecimal={inputDecimal}
        />
      </div>
    </main>
  )
}
