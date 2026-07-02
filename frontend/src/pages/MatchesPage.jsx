import useSWR from 'swr'
import { Link } from 'react-router-dom'
import { matchesApi } from '../api/matches'
import { formatDateTime } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

export default function MatchesPage() {
  const { data: matchesPage, error } = useSWR('/matches', () => matchesApi.list())

  if (error) return <ErrorState error="Failed to load matches" />
  if (!matchesPage) return <PageLoading label="Loading Matches..." />

  const matches = matchesPage.data || matchesPage

  return (
    <div className="container main-content animate-fade-in">
      <h1 className="mb-6">Matches</h1>

      {matches.length === 0 ? (
        <EmptyState title="No Matches" desc="There are no matches scheduled or played." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map(match => (
            <div key={match.id} className="glass-panel flex flex-col justify-between items-center text-center">
              <div className="w-full flex justify-between items-center mb-4">
                <div className="flex-1 font-bold text-lg">{match.home_team?.name}</div>
                <div className="px-4 text-2xl font-black text-primary">
                  {match.status === 'completed' ? `${match.score?.home ?? 0} - ${match.score?.away ?? 0}` : 'VS'}
                </div>
                <div className="flex-1 font-bold text-lg">{match.away_team?.name}</div>
              </div>
              <p className="text-sm text-muted mb-1">Game Day {match.game_day}</p>
              <p className="text-sm text-muted mb-4">
                Status: <span className="capitalize">{match.status}</span> | {formatDateTime(match.scheduled_at)}
              </p>
              <Link to={`/matches/${match.id}`} className="text-primary hover:underline text-sm font-medium">
                Match Center &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
