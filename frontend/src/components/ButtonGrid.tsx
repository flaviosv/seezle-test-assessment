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

interface ButtonSpec {
  key: string
  label: string
  ariaLabel?: string
  onClick: () => void
  className: string
}

const DIGIT_CLASS = 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:brightness-110'
const OPERATOR_CLASS = 'bg-[var(--color-accent)] text-white hover:brightness-110'
const DANGER_CLASS = 'bg-[var(--color-danger)] text-white hover:brightness-110'
const NEUTRAL_CLASS =
  'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:brightness-110'

export function ButtonGrid({
  state,
  onInputChar,
  onSubmit,
  onClear,
  onBackspace,
  onToggleSign,
  onInputDecimal,
}: ButtonGridProps) {
  const locked = state.status === 'error-shown'

  const buttons: ButtonSpec[] = [
    { key: 'ac', label: 'AC', onClick: onClear, className: DANGER_CLASS },
    { key: 'backspace', label: '⌫', ariaLabel: 'Backspace', onClick: onBackspace, className: NEUTRAL_CLASS },
    { key: 'percent', label: '%', onClick: () => onInputChar('%'), className: OPERATOR_CLASS },
    { key: 'sqrt', label: '√', ariaLabel: 'Square root', onClick: () => onInputChar('\\'), className: OPERATOR_CLASS },

    { key: '7', label: '7', onClick: () => onInputChar('7'), className: DIGIT_CLASS },
    { key: '8', label: '8', onClick: () => onInputChar('8'), className: DIGIT_CLASS },
    { key: '9', label: '9', onClick: () => onInputChar('9'), className: DIGIT_CLASS },
    { key: 'pow', label: '^', onClick: () => onInputChar('^'), className: OPERATOR_CLASS },

    { key: '4', label: '4', onClick: () => onInputChar('4'), className: DIGIT_CLASS },
    { key: '5', label: '5', onClick: () => onInputChar('5'), className: DIGIT_CLASS },
    { key: '6', label: '6', onClick: () => onInputChar('6'), className: DIGIT_CLASS },
    { key: 'div', label: '/', onClick: () => onInputChar('/'), className: OPERATOR_CLASS },

    { key: '1', label: '1', onClick: () => onInputChar('1'), className: DIGIT_CLASS },
    { key: '2', label: '2', onClick: () => onInputChar('2'), className: DIGIT_CLASS },
    { key: '3', label: '3', onClick: () => onInputChar('3'), className: DIGIT_CLASS },
    { key: 'mul', label: '*', onClick: () => onInputChar('*'), className: OPERATOR_CLASS },

    { key: 'sign', label: '±', ariaLabel: 'Toggle sign', onClick: onToggleSign, className: NEUTRAL_CLASS },
    { key: '0', label: '0', onClick: () => onInputChar('0'), className: DIGIT_CLASS },
    { key: 'dot', label: '.', onClick: onInputDecimal, className: DIGIT_CLASS },
    { key: 'sub', label: '-', onClick: () => onInputChar('-'), className: OPERATOR_CLASS },

    { key: 'equals', label: '=', onClick: onSubmit, className: DANGER_CLASS },
    { key: 'spacer', label: '', onClick: () => {}, className: 'invisible' },
    { key: 'add', label: '+', onClick: () => onInputChar('+'), className: OPERATOR_CLASS },
    { key: 'spacer-2', label: '', onClick: () => {}, className: 'invisible' },
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {buttons.map((button) => {
        const isSpacer = button.key.startsWith('spacer')
        return (
          <button
            key={button.key}
            type="button"
            onClick={button.onClick}
            disabled={isSpacer || (locked && button.key !== 'ac')}
            aria-label={button.ariaLabel ?? (isSpacer ? undefined : button.label)}
            aria-hidden={isSpacer || undefined}
            tabIndex={isSpacer ? -1 : undefined}
            className={`h-14 rounded-xl text-lg font-medium transition-colors disabled:opacity-40 ${button.className}`}
          >
            {button.label}
          </button>
        )
      })}
    </div>
  )
}
