import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HelpModal } from './HelpModal'

describe('HelpModal', () => {
  it('renders nothing when isOpen is false', () => {
    render(<HelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument()
  })

  it('renders the title, shortcut list, and close button when isOpen is true', () => {
    render(<HelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<HelpModal isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<HelpModal isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose on Escape when the modal is closed', () => {
    const onClose = vi.fn()
    render(<HelpModal isOpen={false} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('lists every documented shortcut', () => {
    render(<HelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('0-9')).toBeInTheDocument()
    expect(screen.getByText('Digits')).toBeInTheDocument()
    expect(screen.getByText('+ - * / ^ \\ %')).toBeInTheDocument()
    expect(screen.getByText('Operators')).toBeInTheDocument()
    expect(screen.getByText('.')).toBeInTheDocument()
    expect(screen.getByText('Decimal point')).toBeInTheDocument()
    expect(screen.getByText('Enter or =')).toBeInTheDocument()
    expect(screen.getByText('Calculate')).toBeInTheDocument()
    expect(screen.getByText('Backspace')).toBeInTheDocument()
    expect(screen.getByText('Delete last character')).toBeInTheDocument()
    expect(screen.getByText('AC')).toBeInTheDocument()
    expect(screen.getByText('Clear')).toBeInTheDocument()
    expect(screen.getByText('+/- or ±')).toBeInTheDocument()
    expect(screen.getByText('Toggle sign')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
    expect(screen.getByText('Open this help')).toBeInTheDocument()
  })

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<HelpModal isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when the dialog content itself is clicked', () => {
    const onClose = vi.fn()
    render(<HelpModal isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
