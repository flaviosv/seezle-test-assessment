import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCalculator } from './useCalculator'
import { calculate } from '../api/calculate'

vi.mock('../api/calculate', () => ({
  calculate: vi.fn(),
}))

const mockedCalculate = vi.mocked(calculate)

const OPERATORS = ['+', '-', '*', '/', '^', '\\', '%']

describe('useCalculator', () => {
  beforeEach(() => {
    mockedCalculate.mockReset()
  })

  describe('initial state', () => {
    it('starts composing with an empty expression, echoed operation, and display value', () => {
      const { result } = renderHook(() => useCalculator())
      expect(result.current.state).toEqual({
        status: 'composing',
        expression: '',
        echoedOperation: '',
        displayValue: '',
      })
    })
  })

  describe('composing: input accumulation (FE-01, FE-02, FE-03)', () => {
    it('appends a clicked digit to the expression without calculating', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('2'))
      expect(result.current.state).toMatchObject({
        status: 'composing',
        expression: '2',
        displayValue: '2',
      })
      expect(mockedCalculate).not.toHaveBeenCalled()
    })

    it('accumulates a full expression across sequential inputChar calls', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('2'))
      act(() => result.current.inputChar('+'))
      act(() => result.current.inputChar('2'))
      expect(result.current.state.expression).toBe('2+2')
      expect(result.current.state.displayValue).toBe('2+2')
    })

    it.each(OPERATORS)('appends operator %s identically to its button semantics (FE-03)', (op) => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('5'))
      act(() => result.current.inputChar(op))
      expect(result.current.state.expression).toBe(`5${op}`)
    })

    it('appends chained postfix operators in written order (e.g. 16\\%)', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('1'))
      act(() => result.current.inputChar('6'))
      act(() => result.current.inputChar('\\'))
      act(() => result.current.inputChar('%'))
      expect(result.current.state.expression).toBe('16\\%')
    })

    it('is permissive of consecutive operators, deferring grammar validation to the backend', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('5'))
      act(() => result.current.inputChar('+'))
      act(() => result.current.inputChar('+'))
      expect(result.current.state.expression).toBe('5++')
    })
  })

  describe('composing: decimal auto-zero (FE-13)', () => {
    it('auto-prefixes 0 when . is pressed as the first character of a new operand', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputDecimal())
      expect(result.current.state.expression).toBe('0.')
    })

    it('appends . directly when the current operand already has a digit', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('5'))
      act(() => result.current.inputDecimal())
      expect(result.current.state.expression).toBe('5.')
    })

    it('auto-prefixes 0 for a new operand started right after an operator', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('5'))
      act(() => result.current.inputChar('+'))
      act(() => result.current.inputDecimal())
      expect(result.current.state.expression).toBe('5+0.')
    })
  })

  describe('composing: sign toggle (FE-11)', () => {
    it('inserts a leading - on the current operand', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('5'))
      act(() => result.current.toggleSign())
      expect(result.current.state.expression).toBe('-5')
    })

    it('removes the leading - when toggled a second time', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('5'))
      act(() => result.current.toggleSign())
      act(() => result.current.toggleSign())
      expect(result.current.state.expression).toBe('5')
    })

    it('scopes the toggle to the operand being entered, not the whole expression', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('5'))
      act(() => result.current.inputChar('+'))
      act(() => result.current.inputChar('3'))
      act(() => result.current.toggleSign())
      expect(result.current.state.expression).toBe('5+-3')
    })
  })

  describe('composing: backspace (FE-12)', () => {
    it('deletes the last character of the expression', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('1'))
      act(() => result.current.inputChar('2'))
      act(() => result.current.inputChar('3'))
      act(() => result.current.backspace())
      expect(result.current.state.expression).toBe('12')
    })

    it('is a no-op on an empty expression', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.backspace())
      expect(result.current.state.expression).toBe('')
    })
  })

  describe('clear (FE-06)', () => {
    it('resets a composing expression back to the initial empty state', () => {
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('5'))
      act(() => result.current.clear())
      expect(result.current.state).toEqual({
        status: 'composing',
        expression: '',
        echoedOperation: '',
        displayValue: '',
      })
    })
  })

  describe('submit (FE-05, FE-08, FE-09)', () => {
    it('makes exactly one call to api.calculate with the accumulated expression', async () => {
      mockedCalculate.mockResolvedValue({ operation: '2+2', result: 4 })
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('2'))
      act(() => result.current.inputChar('+'))
      act(() => result.current.inputChar('2'))
      await act(async () => {
        await result.current.submit()
      })
      expect(mockedCalculate).toHaveBeenCalledTimes(1)
      expect(mockedCalculate).toHaveBeenCalledWith('2+2')
    })

    it('on 200 success, shows the returned result and echoes the returned operation (FE-08)', async () => {
      mockedCalculate.mockResolvedValue({ operation: '2+2', result: 4 })
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('2'))
      act(() => result.current.inputChar('+'))
      act(() => result.current.inputChar('2'))
      await act(async () => {
        await result.current.submit()
      })
      expect(result.current.state.status).toBe('result-shown')
      expect(result.current.state.echoedOperation).toBe('2+2')
      expect(result.current.state.displayValue).toBe('4')
    })

    it('on 400/error, shows "Error" and enters error-shown (FE-09)', async () => {
      mockedCalculate.mockRejectedValue(new Error('operations: division by zero'))
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('1'))
      act(() => result.current.inputChar('/'))
      act(() => result.current.inputChar('0'))
      await act(async () => {
        await result.current.submit()
      })
      expect(result.current.state.status).toBe('error-shown')
      expect(result.current.state.displayValue).toBe('Error')
    })

    it('does not call the API when the expression is empty', async () => {
      const { result } = renderHook(() => useCalculator())
      await act(async () => {
        await result.current.submit()
      })
      expect(mockedCalculate).not.toHaveBeenCalled()
    })

    it('is a no-op when a result is already shown and nothing new was entered', async () => {
      mockedCalculate.mockResolvedValue({ operation: '2+2', result: 4 })
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('2'))
      act(() => result.current.inputChar('+'))
      act(() => result.current.inputChar('2'))
      await act(async () => {
        await result.current.submit()
      })
      await act(async () => {
        await result.current.submit()
      })
      expect(mockedCalculate).toHaveBeenCalledTimes(1)
      expect(result.current.state.status).toBe('result-shown')
    })
  })

  describe('error-shown: only clear exits (FE-09)', () => {
    async function renderInErrorState() {
      mockedCalculate.mockRejectedValue(new Error('operations: division by zero'))
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('1'))
      act(() => result.current.inputChar('/'))
      act(() => result.current.inputChar('0'))
      await act(async () => {
        await result.current.submit()
      })
      return result
    }

    it('ignores inputChar while error-shown', async () => {
      const result = await renderInErrorState()
      const before = result.current.state
      act(() => result.current.inputChar('5'))
      expect(result.current.state).toEqual(before)
    })

    it('ignores inputDecimal while error-shown', async () => {
      const result = await renderInErrorState()
      const before = result.current.state
      act(() => result.current.inputDecimal())
      expect(result.current.state).toEqual(before)
    })

    it('ignores toggleSign while error-shown', async () => {
      const result = await renderInErrorState()
      const before = result.current.state
      act(() => result.current.toggleSign())
      expect(result.current.state).toEqual(before)
    })

    it('ignores backspace while error-shown', async () => {
      const result = await renderInErrorState()
      const before = result.current.state
      act(() => result.current.backspace())
      expect(result.current.state).toEqual(before)
    })

    it('clear() is the only action that exits error-shown, returning to composing', async () => {
      const result = await renderInErrorState()
      act(() => result.current.clear())
      expect(result.current.state).toEqual({
        status: 'composing',
        expression: '',
        echoedOperation: '',
        displayValue: '',
      })
    })
  })

  describe('result-shown: continuation vs. fresh start (FE-10)', () => {
    async function renderWithResult() {
      mockedCalculate.mockResolvedValue({ operation: '1+1', result: 2 })
      const { result } = renderHook(() => useCalculator())
      act(() => result.current.inputChar('1'))
      act(() => result.current.inputChar('+'))
      act(() => result.current.inputChar('1'))
      await act(async () => {
        await result.current.submit()
      })
      return result
    }

    it('a digit discards the previous result and starts a brand-new expression', async () => {
      const result = await renderWithResult()
      act(() => result.current.inputChar('3'))
      expect(result.current.state.status).toBe('composing')
      expect(result.current.state.expression).toBe('3')
    })

    it('an operator continues a new expression using the previous result as the starting operand', async () => {
      const result = await renderWithResult()
      act(() => result.current.inputChar('+'))
      expect(result.current.state.status).toBe('composing')
      expect(result.current.state.expression).toBe('2+')
    })

    it('a decimal discards the previous result and starts fresh with auto-zero', async () => {
      const result = await renderWithResult()
      act(() => result.current.inputDecimal())
      expect(result.current.state.status).toBe('composing')
      expect(result.current.state.expression).toBe('0.')
    })

    it('backspace has no effect while a result is shown (composing-only scope)', async () => {
      const result = await renderWithResult()
      const before = result.current.state
      act(() => result.current.backspace())
      expect(result.current.state).toEqual(before)
    })

    it('toggleSign has no effect while a result is shown (composing-only scope)', async () => {
      const result = await renderWithResult()
      const before = result.current.state
      act(() => result.current.toggleSign())
      expect(result.current.state).toEqual(before)
    })
  })

  describe('keyboard input (FE-02, FE-03, FE-04)', () => {
    function pressKey(key: string) {
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }))
      })
    }

    it('typing a digit accumulates the same expression as clicking it', () => {
      const { result } = renderHook(() => useCalculator())
      pressKey('2')
      expect(result.current.state.expression).toBe('2')
    })

    it.each(OPERATORS)('typing operator %s maps to the identical semantics as its button (FE-03)', (op) => {
      const { result } = renderHook(() => useCalculator())
      pressKey('5')
      pressKey(op)
      expect(result.current.state.expression).toBe(`5${op}`)
    })

    it('typing . dispatches the same auto-zero decimal behavior as clicking it', () => {
      const { result } = renderHook(() => useCalculator())
      pressKey('.')
      expect(result.current.state.expression).toBe('0.')
    })

    it('pressing Enter triggers exactly one API call (same as clicking =)', async () => {
      mockedCalculate.mockResolvedValue({ operation: '2+2', result: 4 })
      renderHook(() => useCalculator())
      pressKey('2')
      pressKey('+')
      pressKey('2')
      await act(async () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }))
        await Promise.resolve()
      })
      expect(mockedCalculate).toHaveBeenCalledTimes(1)
      expect(mockedCalculate).toHaveBeenCalledWith('2+2')
    })

    it('pressing Backspace deletes the last character', () => {
      const { result } = renderHook(() => useCalculator())
      pressKey('1')
      pressKey('2')
      pressKey('3')
      pressKey('Backspace')
      expect(result.current.state.expression).toBe('12')
    })

    it('ignores a non-whitelisted key without altering state (FE-04)', () => {
      const { result } = renderHook(() => useCalculator())
      pressKey('2')
      const before = result.current.state
      pressKey('a')
      expect(result.current.state).toEqual(before)
    })

    it('Escape is captured but has no expression-level effect (FE-04)', () => {
      const { result } = renderHook(() => useCalculator())
      pressKey('2')
      const before = result.current.state
      pressKey('Escape')
      expect(result.current.state).toEqual(before)
    })
  })
})
