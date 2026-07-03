import useSWR from 'swr'
import { Link } from 'react-router-dom'
import { Swords, ArrowRight } from 'lucide-react'
import { matchesApi } from '../api/matches'
import { formatDateTime, crest, statusPillClass } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

export default function MatchesPage() {
  const { data: matchesPage, error } = useSWR('/matches', () => matchesApi.list())

  if (error) return <ErrorState error="Failed to load matches" />
  if (!matchesPage) return <PageLoading label="Loading Matches..." />

  const matches = matchesPage.data || matchesPage
  const isDone = (m) => m.status === 'completed'

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="pitch-hero">
        <div className="eyebrow flex items-center gap-2">
          <Swords size={14} />
          Fixtures
        </div>
        <h1 className="text-balance">Matches</h1>
        <p className="text-secondary text-base" style={{ maxWidth: 520 }}>
          Every fixture across the league. Jump into the match center to contribute energy to live plays.
        </p>
      </div>

      {matches.length === 0 ? (
        <EmptyState title="No Matches" desc="There are no matches scheduled or played." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {matches.map((match) => (
            <Link key={match.id} to={`/matches/${match.id}`} className="glass-panel" style={{ display: 'block' }}>
              <div className="gameday-header">
                <span className="gameday-badge">Game Day {match.game_day}</span>
                <span className="gameday-line" />
                <span className={`status-pill ${statusPillClass(match.status)}`}>{match.status}</span>
              </div>

              <div className="fixture" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                <div className="side home">
                  <span className="team-name">{match.home_team?.name ?? 'TBD'}</span>
                  <span className="team-crest">{crest(match.home_team?.name)}</span>
                </div>
                <div className="center">
                  {isDone(match) ? (
                    <span className="score">
                      {match.score?.home ?? 0} <span className="text-muted">:</span> {match.score?.away ?? 0}
                    </span>
                  ) : (
                    <span className="vs">VS</span>
                  )}
                </div>
                <div className="side away">
                  <span className="team-crest">{crest(match.away_team?.name)}</span>
                  <span className="team-name">{match.away_team?.name ?? 'TBD'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-sm text-muted">{formatDateTime(match.scheduled_at)}</span>
                <span className="auth-link text-sm font-medium">
                  Match Center
                  <ArrowRight size={14} style={{ display: 'inline', verticalAlign: '-2px', marginLeft: 4 }} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
