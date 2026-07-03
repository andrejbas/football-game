import { useState } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { CalendarDays, ListOrdered, Trophy } from 'lucide-react'
import { leaguesApi } from '../api/leagues'
import { formatDateTime } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

/* Build a short 2-3 letter crest label from a team name */
function crest(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
}

function statusPill(status = '') {
  const s = status.toLowerCase()
  if (s === 'live' || s === 'in_progress' || s === 'playing') return 'status-live'
  if (s === 'active' || s === 'ongoing' || s === 'started') return 'status-active'
  if (s === 'finished' || s === 'completed' || s === 'ended') return 'status-done'
  return 'status-idle'
}

function StandingsTab({ id }) {
  const { data, error } = useSWR(`/leagues/${id}/standings`, () => leaguesApi.standings(id))

  if (error) return <ErrorState error="Failed to load standings" />
  if (!data) return <PageLoading label="Loading standings..." />

  // API returns { league, standings: [...] }
  const rows = data.standings || []

  return (
    <div className="glass-panel">
      <div className="flex items-center gap-2 mb-4">
        <ListOrdered size={18} className="text-accent" />
        <h2 className="text-xl font-semibold">League Table</h2>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No standings yet" desc="Standings appear once matches have been played." />
      ) : (
        <div className="table-wrapper">
          <table className="standings-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th className="team-cell">Club</th>
                <th title="Played">P</th>
                <th title="Won">W</th>
                <th title="Drawn">D</th>
                <th title="Lost">L</th>
                <th title="Goals for">GF</th>
                <th title="Goals against">GA</th>
                <th title="Goal difference">GD</th>
                <th title="Points">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const pos = idx + 1
                const gd = (row.goals_for ?? 0) - (row.goals_against ?? 0)
                const posClass =
                  pos === 1 ? 'pos-champion' : pos <= 3 ? 'pos-top' : pos >= rows.length ? 'pos-drop' : ''
                return (
                  <tr key={row.id ?? idx} className={posClass}>
                    <td>
                      <span className={`pos-badge rank-${pos}`}>{pos}</span>
                    </td>
                    <td className="team-cell">
                      <div className="flex items-center gap-3">
                        <span className="team-crest">{crest(row.team?.name)}</span>
                        <span className="font-medium">{row.team?.name ?? 'Unknown'}</span>
                      </div>
                    </td>
                    <td>{row.played}</td>
                    <td className="text-green">{row.won}</td>
                    <td className="text-amber">{row.drawn}</td>
                    <td className="text-red">{row.lost}</td>
                    <td>{row.goals_for}</td>
                    <td>{row.goals_against}</td>
                    <td>{gd > 0 ? `+${gd}` : gd}</td>
                    <td className="pts-cell">{row.points}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ScheduleTab({ id }) {
  const { data, error } = useSWR(`/leagues/${id}/schedule`, () => leaguesApi.schedule(id))

  if (error) return <ErrorState error="Failed to load schedule" />
  if (!data) return <PageLoading label="Loading schedule..." />

  // API returns { league, schedule: [{ game_day, matches: [...] }] }
  const days = data.schedule || []

  if (days.length === 0) {
    return <EmptyState title="No fixtures scheduled" desc="This league does not have fixtures yet." />
  }

  const hasScore = (m) => m?.home_score != null && m?.away_score != null

  return (
    <div className="flex flex-col gap-6">
      {days.map((block) => (
        <div key={block.game_day} className="glass-panel">
          <div className="gameday-header">
            <span className="gameday-badge">Matchday {block.game_day}</span>
            <span className="gameday-line" />
          </div>
          <div className="flex flex-col gap-3">
            {block.matches.map((match) => (
              <div key={match.id} className="fixture">
                <div className="side home">
                  <span className="team-name">{match.home_team?.name ?? 'TBD'}</span>
                  <span className="team-crest">{crest(match.home_team?.name)}</span>
                </div>
                <div className="center">
                  {hasScore(match) ? (
                    <span className="score">
                      {match.home_score} <span className="text-muted">:</span> {match.away_score}
                    </span>
                  ) : (
                    <span className="vs">VS</span>
                  )}
                  <span className={`status-pill ${statusPill(match.status)}`}>{match.status}</span>
                  {match.scheduled_at ? (
                    <span className="kickoff">{formatDateTime(match.scheduled_at)}</span>
                  ) : null}
                </div>
                <div className="side away">
                  <span className="team-crest">{crest(match.away_team?.name)}</span>
                  <span className="team-name">{match.away_team?.name ?? 'TBD'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LeagueDetailPage() {
  const { id } = useParams()
  const { data: league, error: leagueError } = useSWR(`/leagues/${id}`, () => leaguesApi.show(id))
  const [activeTab, setActiveTab] = useState('standings')

  if (leagueError) return <ErrorState error="Failed to load league details" />
  if (!league) return <PageLoading label="Loading League..." />

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="pitch-hero">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="eyebrow flex items-center gap-2">
              <Trophy size={14} />
              Season {league.season_number}
            </div>
            <h1 className="text-balance">{league.name}</h1>
            <div className="flex items-center gap-3">
              <span className={`status-pill ${statusPill(league.status)}`}>{league.status}</span>
              <span className="text-secondary text-base">Matchday {league.current_game_day}</span>
            </div>
          </div>

          <div className="seg-tabs" role="tablist" aria-label="League views">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'standings'}
              className={`seg-tab ${activeTab === 'standings' ? 'active' : ''}`}
              onClick={() => setActiveTab('standings')}
            >
              <ListOrdered size={15} style={{ marginRight: 6, verticalAlign: '-2px' }} />
              Table
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'schedule'}
              className={`seg-tab ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              <CalendarDays size={15} style={{ marginRight: 6, verticalAlign: '-2px' }} />
              Fixtures
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'standings' ? <StandingsTab id={id} /> : <ScheduleTab id={id} />}
    </div>
  )
}
