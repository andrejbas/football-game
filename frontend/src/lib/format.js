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

export function apiErrorMessage(err, fallback = 'Something went wrong.') {
  const res = err?.response?.data
  if (res?.errors) {
    const first = Object.values(res.errors)[0]
    if (Array.isArray(first)) return first[0]
  }
  return res?.message || err?.message || fallback
}
