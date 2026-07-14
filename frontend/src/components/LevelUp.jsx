import { useEffect } from 'react'
import { Star } from 'lucide-react'

export default function LevelUpOverlay({ level, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className="levelup-overlay"
      onClick={onClose}
      role="dialog"
      aria-label="Level Up!"
      aria-modal="true"
    >
      <div className="levelup-card" onClick={(e) => e.stopPropagation()}>
        <div className="levelup-badge" aria-hidden="true">
          <Star size={36} color="#04150c" fill="#04150c" />
        </div>
        <div className="levelup-title">Level Up!</div>
        <div className="levelup-sub">Your player has grown stronger</div>
        <div className="levelup-new-level">{level}</div>
        <div className="levelup-sub" style={{ marginBottom: 0 }}>
          New level reached — stats have improved
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 24, minWidth: 160 }}
          onClick={onClose}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
