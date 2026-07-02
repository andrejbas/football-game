import useSWR from 'swr'
import { seasonsApi } from '../api/seasons'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

export default function SeasonsPage() {
  const { data: currentSeason, error: currentError } = useSWR('/seasons/current', () => seasonsApi.current())
  const { data: history, error: historyError } = useSWR('/seasons/history', () => seasonsApi.history())

  if (currentError || historyError) return <ErrorState error="Failed to load seasons" />
  if (!currentSeason && !history) return <PageLoading label="Loading Seasons..." />

  return (
    <div className="container main-content animate-fade-in">
      <h1 className="mb-6">Seasons Overview</h1>

      <div className="glass-panel mb-8 border border-primary/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
          CURRENT
        </div>
        <h2 className="text-xl font-semibold mb-4 text-primary">Current Season</h2>
        {currentSeason ? (
          <div>
            <p className="mb-2"><span className="text-muted">Name:</span> {currentSeason.name}</p>
            <p className="mb-2"><span className="text-muted">Start Date:</span> {new Date(currentSeason.start_date).toLocaleDateString()}</p>
            <p><span className="text-muted">Status:</span> <span className="text-success font-medium capitalize">{currentSeason.status}</span></p>
          </div>
        ) : (
          <p className="text-muted">No active season right now.</p>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4">Past Seasons</h2>
      {history && history.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map(season => (
            <div key={season.id} className="glass-panel text-sm text-muted">
              <h3 className="text-base font-bold text-main mb-2">{season.name}</h3>
              <p>Start: {new Date(season.start_date).toLocaleDateString()}</p>
              <p>End: {season.end_date ? new Date(season.end_date).toLocaleDateString() : 'N/A'}</p>
              <p className="mt-2 text-primary capitalize">{season.status}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No History" desc="There are no past seasons recorded." />
      )}
    </div>
  )
}
