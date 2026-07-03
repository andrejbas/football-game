import useSWR from 'swr'
import { History, CalendarDays } from 'lucide-react'
import { seasonsApi } from '../api/seasons'
import { formatDate, statusLabel, statusPillClass } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

export default function SeasonsPage() {
  const { data: currentSeason, error: currentError } = useSWR('/seasons/current', () => seasonsApi.current())
  const { data: history, error: historyError } = useSWR('/seasons/history', () => seasonsApi.history())

  if (currentError || historyError) return <ErrorState error="Failed to load seasons" />
  if (!currentSeason && !history) return <PageLoading label="Loading Seasons..." />

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="pitch-hero">
        <div className="eyebrow flex items-center gap-2">
          <History size={14} />
          Campaign
        </div>
        <h1 className="text-balance">Seasons</h1>
        <p className="text-secondary text-base" style={{ maxWidth: 520 }}>
          The current campaign and a record of every season that came before it.
        </p>
      </div>

      <div className="glass-panel" style={{ borderColor: 'var(--border-bright)' }}>
        <div className="section-head" style={{ justifyContent: 'space-between' }}>
          <div className="flex items-center gap-3">
            <span className="section-icon"><CalendarDays size={18} /></span>
            <h2>Current Season</h2>
          </div>
          <span className="chip chip-accent">Live</span>
        </div>

        {currentSeason ? (
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Name</div>
              <div className="info-value">{currentSeason.name}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Start Date</div>
              <div className="info-value">{formatDate(currentSeason.start_date)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Status</div>
              <div className="info-value">
                <span className={`status-pill ${statusPillClass(currentSeason.status)}`}>
                  {statusLabel(currentSeason.status)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted">No active season right now.</p>
        )}
      </div>

      <div>
        <div className="section-head">
          <span className="section-icon"><History size={18} /></span>
          <h2>Past Seasons</h2>
        </div>

        {history && history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((season) => (
              <div key={season.id} className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-base font-bold text-main">{season.name}</h3>
                    <span className={`status-pill ${statusPillClass(season.status)}`}>
                      {statusLabel(season.status)}
                    </span>
                  </div>
                  <div className="text-sm text-muted flex flex-col gap-1">
                    <span>Start: {formatDate(season.start_date)}</span>
                    <span>End: {season.end_date ? formatDate(season.end_date) : '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No History" desc="There are no past seasons recorded." />
        )}
      </div>
    </div>
  )
}
