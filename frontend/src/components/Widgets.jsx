import { statusBadgeClass, statusLabel } from '../lib/format'

export function ProgressBar({ pct, variant = 'xp' }) {
  const width = Math.max(0, Math.min(100, Number(pct) || 0))
  return (
    <div className="progress-bar-container">
      <div className={`progress-bar ${variant}`} style={{ width: `${width}%` }} />
    </div>
  )
}

export function StatusBadge({ status }) {
  return <span className={`badge ${statusBadgeClass(status)}`}>{statusLabel(status)}</span>
}

export function RarityBadge({ rarity }) {
  return <span className={`badge rarity-badge-${rarity}`}>{rarity}</span>
}

export function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub ? <div className="stat-card-sub">{sub}</div> : null}
    </div>
  )
}
