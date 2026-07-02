import { Inbox } from 'lucide-react'

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  )
}

export function PageLoading({ label = 'Loading…' }) {
  return (
    <div className="loading-page">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({ icon, title, desc }) {
  return (
    <div className="empty-state">
      <div className="empty-icon flex justify-center" aria-hidden="true">
        {icon ?? <Inbox size={48} />}
      </div>
      <div className="empty-title">{title}</div>
      {desc ? <div className="empty-desc">{desc}</div> : null}
    </div>
  )
}

export function ErrorState({ error }) {
  return (
    <div className="alert alert-error" role="alert">
      {error}
    </div>
  )
}
