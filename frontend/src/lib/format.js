// Shared formatting + display helpers

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_BADGE = {
  pending: 'badge-gray',
  scheduled: 'badge-gray',
  active: 'badge-green',
  in_progress: 'badge-cyan',
  completed: 'badge-blue',
}

export function statusBadgeClass(status) {
  return STATUS_BADGE[status] ?? 'badge-gray'
}

export function statusLabel(status) {
  if (!status) return '—'
  return String(status)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/* Build a short 2-3 letter crest label from a team/club name */
export function crest(name = '') {
  const words = String(name).trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
}

/* Map a free-form status string to a .status-pill modifier class */
export function statusPillClass(status = '') {
  const s = String(status).toLowerCase()
  if (['live', 'in_progress', 'playing'].includes(s)) return 'status-live'
  if (['active', 'ongoing', 'started', 'open'].includes(s)) return 'status-active'
  if (['finished', 'completed', 'ended', 'closed'].includes(s)) return 'status-done'
  return 'status-idle'
}

export function apiErrorMessage(err, fallback = 'Something went wrong.') {
  const res = err?.response?.data
  if (res?.errors) {
    const first = Object.values(res.errors)[0]
    if (Array.isArray(first)) return first[0]
  }
  return res?.message || err?.message || fallback
}
