import { useCallback, useEffect, useReducer, useRef } from 'react'
import { calculate } from '../api/calculate'

export type CalculatorStatus = 'composing' | 'result-shown' | 'error-shown'

export interface CalculatorState {
  status: CalculatorStatus
  expression: string
  echoedOperation: string
  displayValue: string
}

const DIGITS = '0123456789'
const OPERATORS = ['+', '-', '*', '/', '^', '\\', '%']
const BINARY_OPS = '+-*/^'

const initialState: CalculatorState = {
  status: 'composing',
  expression: '',
  echoedOperation: '',
  displayValue: '',
}

// Finds where the operand currently being typed starts within `expr`,
// including a leading '-' sign if one was already entered for it. Mirrors
// the backend parser's own rule (parser.go's parseTerm): a '-' only ever
// starts an operand at position 0 or immediately after a BinaryOp — so a
// single left-to-right scan locates the boundary without a full grammar
// parse.
function currentOperandStart(expr: string): number {
  let expectStart = true
  let start = 0
  for (let i = 0; i < expr.length; i++) {
    const char = expr[i]
    if (expectStart) {
      start = i
      expectStart = false
      continue
    }
    if (BINARY_OPS.includes(char)) {
      expectStart = true
    }
  }
  // SPEC_DEVIATION: when a BinaryOp is the last character (no operand typed
  // yet for the new operand), expectStart is left true with no further
  // iteration to advance `start` — without this, the stale previous
  // operand's start position leaks through, breaking FE-13's auto-zero rule
  // for a fresh operand (e.g. "5+" then "." must become "5+0.", not "5+.").
  // Reason: caught by a spec-derived useCalculator.test.ts case (T19); fixed
  // here because the bug blocked writing a spec-correct test, not because it
  // was in scope of T19's own tasks.md entry.
  return expectStart ? expr.length : start
}

function appendDecimal(expr: string): string {
  const start = currentOperandStart(expr)
  const operandHasDigit = [...expr.slice(start)].some((char) => DIGITS.includes(char))
  return operandHasDigit ? `${expr}.` : `${expr}0.`
}

function toggleSignInExpression(expr: string): string {
  const start = currentOperandStart(expr)
  if (expr[start] === '-') {
    return expr.slice(0, start) + expr.slice(start + 1)
  }
  return `${expr.slice(0, start)}-${expr.slice(start)}`
}

type Action =
  | { type: 'INPUT_CHAR'; char: string }
  | { type: 'INPUT_DECIMAL' }
  | { type: 'TOGGLE_SIGN' }
  | { type: 'BACKSPACE' }
  | { type: 'CLEAR' }
  | { type: 'SUBMIT_SUCCESS'; operation: string; result: string }
  | { type: 'SUBMIT_ERROR' }

function reducer(state: CalculatorState, action: Action): CalculatorState {
  switch (action.type) {
    case 'INPUT_CHAR': {
      if (state.status === 'error-shown') return state

      if (state.status === 'result-shown') {
        const isDigit = DIGITS.includes(action.char)
        const expression = isDigit ? action.char : state.expression + action.char
        return { status: 'composing', expression, echoedOperation: '', displayValue: expression }
      }

      const expression = state.expression + action.char
      return { ...state, expression, displayValue: expression }
    }

    case 'INPUT_DECIMAL': {
      if (state.status === 'error-shown') return state
      const base = state.status === 'result-shown' ? '' : state.expression
      const expression = appendDecimal(base)
      return { status: 'composing', expression, echoedOperation: '', displayValue: expression }
    }

    case 'TOGGLE_SIGN': {
      if (state.status !== 'composing') return state
      const expression = toggleSignInExpression(state.expression)
      return { ...state, expression, displayValue: expression }
    }

    case 'BACKSPACE': {
      if (state.status !== 'composing') return state
      const expression = state.expression.slice(0, -1)
      return { ...state, expression, displayValue: expression }
    }

    case 'CLEAR':
      return initialState

    case 'SUBMIT_SUCCESS':
      return {
        status: 'result-shown',
        expression: action.result,
        echoedOperation: action.operation,
        displayValue: action.result,
      }

    case 'SUBMIT_ERROR':
      return { ...state, status: 'error-shown', echoedOperation: '', displayValue: 'Error' }

    default:
      return state
  }
}

export function useCalculator() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const inputChar = useCallback((char: string) => dispatch({ type: 'INPUT_CHAR', char }), [])
  const inputDecimal = useCallback(() => dispatch({ type: 'INPUT_DECIMAL' }), [])
  const toggleSign = useCallback(() => dispatch({ type: 'TOGGLE_SIGN' }), [])
  const backspace = useCallback(() => dispatch({ type: 'BACKSPACE' }), [])
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  })

  const submit = useCallback(async () => {
    const current = stateRef.current
    if (current.status !== 'composing' || current.expression === '') return

    try {
      const response = await calculate(current.expression)
      dispatch({
        type: 'SUBMIT_SUCCESS',
        operation: response.operation,
        result: String(response.result),
      })
    } catch {
      dispatch({ type: 'SUBMIT_ERROR' })
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const { key } = event

      if (DIGITS.includes(key) || OPERATORS.includes(key)) {
        event.preventDefault()
        inputChar(key)
        return
      }
      if (key === '.') {
        event.preventDefault()
        inputDecimal()
        return
      }
      if (key === 'Enter') {
        event.preventDefault()
        void submit()
        return
      }
      if (key === 'Backspace') {
        event.preventDefault()
        backspace()
        return
      }
      // Escape is whitelisted (FE-04) but has no expression-level effect here
      // — only "AC" clears. HelpModal owns closing itself on Escape.
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inputChar, inputDecimal, submit, backspace])

  return { state, inputChar, inputDecimal, toggleSign, backspace, clear, submit }
}
