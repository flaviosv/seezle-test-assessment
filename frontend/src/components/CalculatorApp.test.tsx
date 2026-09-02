import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CalculatorApp } from './CalculatorApp'
import { calculate } from '../api/calculate'

vi.mock('../api/calculate', () => ({
  calculate: vi.fn(),
}))

const mockedCalculate = vi.mocked(calculate)

function renderApp() {
  const onHelpClick = vi.fn()
  render(<CalculatorApp onHelpClick={onHelpClick} />)
  return { onHelpClick }
}

function clickButton(name: string) {
  fireEvent.click(screen.getByRole('button', { name }))
}

describe('CalculatorApp', () => {
  beforeEach(() => {
    mockedCalculate.mockReset()
  })

  it('clicking digit/operator buttons accumulates the display without calculating (FE-01)', () => {
    renderApp()
    clickButton('2')
    clickButton('+')
    clickButton('2')
    expect(screen.getByText('2+2')).toBeInTheDocument()
    expect(mockedCalculate).not.toHaveBeenCalled()
  })

  it('typing on the keyboard accumulates the same display without calculating (FE-02)', () => {
    renderApp()
    act(() => {
      fireEvent.keyDown(window, { key: '2' })
      fireEvent.keyDown(window, { key: '+' })
      fireEvent.keyDown(window, { key: '2' })
    })
    expect(screen.getByText('2+2')).toBeInTheDocument()
    expect(mockedCalculate).not.toHaveBeenCalled()
  })

  it('clicking "=" fires exactly one POST call with the accumulated expression (FE-05)', async () => {
    mockedCalculate.mockResolvedValue({ operation: '2+2', result: 4 })
    renderApp()
    clickButton('2')
    clickButton('+')
    clickButton('2')
    await act(async () => {
      clickButton('=')
      await Promise.resolve()
    })
    expect(mockedCalculate).toHaveBeenCalledTimes(1)
    expect(mockedCalculate).toHaveBeenCalledWith('2+2')
  })

  it('pressing Enter fires exactly one POST call, same as clicking "=" (FE-05)', async () => {
    mockedCalculate.mockResolvedValue({ operation: '2+2', result: 4 })
    renderApp()
    clickButton('2')
    clickButton('+')
    clickButton('2')
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Enter' })
      await Promise.resolve()
    })
    expect(mockedCalculate).toHaveBeenCalledTimes(1)
  })

  it('renders the returned result large with the echoed operation small above it on success (FE-08)', async () => {
    mockedCalculate.mockResolvedValue({ operation: '2+2', result: 4 })
    renderApp()
    clickButton('2')
    clickButton('+')
    clickButton('2')
    await act(async () => {
      clickButton('=')
      await Promise.resolve()
    })
    expect(screen.getByText('4', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('2+2')).toBeInTheDocument()
  })

  it('renders "Error" and locks digit/operator input until AC on a 400 response (FE-09)', async () => {
    mockedCalculate.mockRejectedValue(new Error('operations: division by zero'))
    renderApp()
    clickButton('1')
    clickButton('/')
    clickButton('0')
    await act(async () => {
      clickButton('=')
      await Promise.resolve()
    })
    expect(screen.getByText('Error')).toBeInTheDocument()

    clickButton('5')
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('styles the AC button with the danger token (FE-07)', () => {
    renderApp()
    expect(screen.getByRole('button', { name: 'AC' })).toHaveClass('bg-[var(--color-danger)]')
  })

  it('styles the "=" button with the danger token (FE-07)', () => {
    renderApp()
    expect(screen.getByRole('button', { name: '=' })).toHaveClass('bg-[var(--color-danger)]')
  })

  it('styles operator buttons with the accent token, distinct from digit buttons (FE-15)', () => {
    renderApp()
    expect(screen.getByRole('button', { name: '+' })).toHaveClass('bg-[var(--color-accent)]')
    expect(screen.getByRole('button', { name: '2' })).toHaveClass('bg-[var(--color-surface-raised)]')
  })

  it('clicking "?" invokes the help-open callback (FE-14)', () => {
    const { onHelpClick } = renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Keyboard shortcuts help' }))
    expect(onHelpClick).toHaveBeenCalledTimes(1)
  })

  it('clicking AC clears the display back to empty, including after a shown result (FE-06)', async () => {
    mockedCalculate.mockResolvedValue({ operation: '2+2', result: 4 })
    renderApp()
    clickButton('2')
    clickButton('+')
    clickButton('2')
    await act(async () => {
      clickButton('=')
      await Promise.resolve()
    })
    clickButton('AC')
    expect(screen.getByText('0', { selector: 'span' })).toBeInTheDocument()
    expect(screen.queryByText('2+2')).not.toBeInTheDocument()
  })

  it('backspace deletes the last character of the composed expression (FE-12)', () => {
    renderApp()
    clickButton('1')
    clickButton('2')
    clickButton('3')
    clickButton('Backspace')
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('decimal input auto-prefixes 0 and continues the operand (FE-13)', () => {
    renderApp()
    clickButton('.')
    expect(screen.getByText('0.')).toBeInTheDocument()
    clickButton('5')
    expect(screen.getByText('0.5')).toBeInTheDocument()
  })

  it('sign toggle flips and restores the leading minus (FE-11)', () => {
    renderApp()
    clickButton('5')
    clickButton('Toggle sign')
    expect(screen.getByText('-5')).toBeInTheDocument()
    clickButton('Toggle sign')
    expect(screen.getByText('5', { selector: 'span' })).toBeInTheDocument()
  })

  it('renders inside a responsive, width-constrained card with no fixed pixel width (FE-16, FE-17)', () => {
    renderApp()
    const card = screen.getByRole('main').firstElementChild as HTMLElement
    expect(card).toHaveClass('w-full')
    expect(card).toHaveClass('max-w-sm')
  })
})
