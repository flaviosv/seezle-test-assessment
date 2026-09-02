import { useState } from 'react'
import { CalculatorApp } from './components/CalculatorApp'
import { HelpModal } from './components/HelpModal'

function App() {
  const [isHelpOpen, setHelpOpen] = useState(false)

  return (
    <>
      <CalculatorApp onHelpClick={() => setHelpOpen(true)} isHelpOpen={isHelpOpen} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setHelpOpen(false)} />
    </>
  )
}

export default App
