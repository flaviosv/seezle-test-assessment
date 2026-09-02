interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

// SPEC_DEVIATION: placeholder only, to satisfy App.tsx (T15)'s build gate
// ahead of schedule. Real implementation lands in T18.
export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null
  return (
    <div>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  )
}
