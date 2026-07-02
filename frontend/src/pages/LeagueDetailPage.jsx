import { useState } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { leaguesApi } from '../api/leagues'
import { formatDateTime } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

export default function LeagueDetailPage() {
  const { id } = useParams()
  const { data: league, error: leagueError } = useSWR(`/leagues/${id}`, () => leaguesApi.show(id))
  const { data: standings, error: standingsError } = useSWR(`/leagues/${id}/standings`, () => leaguesApi.standings(id))
  const { data: schedule, error: scheduleError } = useSWR(`/leagues/${id}/schedule`, () => leaguesApi.schedule(id))
  const [activeTab, setActiveTab] = useState('standings')

  if (leagueError) return <ErrorState error="Failed to load league details" />
  if (!league) return <PageLoading label="Loading League..." />

  const scheduleDays = schedule?.schedule || []

  return (
    <div className="container main-content animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start mb-6">
        <div>
          <h1 className="mb-2">{league.name}</h1>
          <p className="text-muted">
            Season {league.season_number} | Status: <span className="capitalize">{league.status}</span> | Game Day: {league.current_game_day}
          </p>
        </div>

        <div className="flex gap-2">
          <button type="button" className={`btn ${activeTab === 'standings' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('standings')}>
            Standings
          </button>
          <button type="button" className={`btn ${activeTab === 'schedule' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('schedule')}>
            Schedule
          </button>
        </div>
      </div>

      {activeTab === 'standings' ? (
        <div className="glass-panel">
          <h2 className="text-xl font-semibold mb-4 text-primary">Standings</h2>
          {standingsError ? (
            <ErrorState error="Failed to load standings" />
          ) : !standings ? (
            <div>Loading standings...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 px-4">Pos</th>
                    <th className="py-2 px-4">Team</th>
                    <th className="py-2 px-4">P</th>
                    <th className="py-2 px-4">W</th>
                    <th className="py-2 px-4">D</th>
                    <th className="py-2 px-4">L</th>
                    <th className="py-2 px-4">GF</th>
                    <th className="py-2 px-4">GA</th>
                    <th className="py-2 px-4">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, idx) => (
                    <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2 px-4">{idx + 1}</td>
                      <td className="py-2 px-4 font-medium">{row.team?.name}</td>
                      <td className="py-2 px-4">{row.played}</td>
                      <td className="py-2 px-4 text-success">{row.won}</td>
                      <td className="py-2 px-4 text-warning">{row.drawn}</td>
                      <td className="py-2 px-4 text-danger">{row.lost}</td>
                      <td className="py-2 px-4">{row.goals_for}</td>
                      <td className="py-2 px-4">{row.goals_against}</td>
                      <td className="py-2 px-4 font-bold text-primary">{row.points}</td>
                    </tr>
                  ))}
                  {standings.length === 0 && (
                    <tr>
                      <td colSpan="9" className="py-4 text-center text-muted">No standings available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {scheduleError ? (
            <ErrorState error="Failed to load schedule" />
          ) : !scheduleDays ? (
            <div className="glass-panel">Loading schedule...</div>
          ) : scheduleDays.length === 0 ? (
            <EmptyState title="No schedule available" desc="This league does not have fixtures yet." />
          ) : (
            scheduleDays.map((dayBlock) => (
              <div key={dayBlock.game_day} className="glass-panel">
                <h2 className="text-xl font-semibold mb-4 text-primary">Game Day {dayBlock.game_day}</h2>
                <div className="space-y-3">
                  {dayBlock.matches.map((match) => (
                    <div key={match.id} className="p-4 bg-slate-800/50 rounded border border-white/5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-semibold">
                          {match.home_team?.name} vs {match.away_team?.name}
                        </div>
                        <div className="text-xs text-muted">Kickoff: {formatDateTime(match.scheduled_at)}</div>
                      </div>
                      <div className="text-sm text-muted capitalize">
                        Status: <span className="text-primary">{match.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
