import { useState } from 'react'
import useSWR from 'swr'
import { Link } from 'react-router-dom'
import { leaguesApi } from '../api/leagues'
import { useAuthStore } from '../store/authStore'
import { apiErrorMessage } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

export default function LeaguesPage() {
  const { data: leagues, error, mutate } = useSWR('/leagues', () => leaguesApi.list())
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const [leagueName, setLeagueName] = useState('')
  const [creatingLeague, setCreatingLeague] = useState(false)
  const [activeLeagueId, setActiveLeagueId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [createError, setCreateError] = useState('')

  if (error) return <ErrorState error="Failed to load leagues" />
  if (!leagues) return <PageLoading label="Loading Leagues..." />

  const leaguesList = leagues.data || leagues

  const runAdminAction = async (leagueId, action) => {
    setActionError('')
    setActiveLeagueId(leagueId)

    try {
      await action(leagueId)
      await mutate()
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Unable to update the league.'))
    } finally {
      setActiveLeagueId(null)
    }
  }

  const createLeague = async (event) => {
    event.preventDefault()
    const trimmedName = leagueName.trim()

    if (!trimmedName) return

    setCreateError('')
    setCreatingLeague(true)

    try {
      await leaguesApi.adminCreate({ name: trimmedName })
      setLeagueName('')
      await mutate()
    } catch (err) {
      setCreateError(apiErrorMessage(err, 'Unable to create league.'))
    } finally {
      setCreatingLeague(false)
    }
  }

  return (
    <div className="container main-content animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="mb-2">Leagues</h1>
          <p className="text-muted text-sm">Follow active competitions and, if you are an admin, drive the season lifecycle.</p>
        </div>
      </div>

      {isAdmin ? (
        <div className="glass-panel mb-6">
          <h2 className="text-lg font-semibold mb-2 text-primary">Admin Controls</h2>
          <p className="text-sm text-muted mb-4">Create leagues here, then use the per-league controls to manage seasons.</p>
          <div className="space-y-4">
            <form onSubmit={createLeague} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="form-group flex-1 mb-0">
                <label className="form-label" htmlFor="league-name">
                  League name
                </label>
                <input
                  id="league-name"
                  type="text"
                  className="form-input"
                  placeholder="Premier Division"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={creatingLeague}>
                {creatingLeague ? 'Creating…' : 'Create League'}
              </button>
            </form>
            {createError ? <div className="alert alert-error" role="alert">{createError}</div> : null}
            {actionError ? <div className="alert alert-error" role="alert">{actionError}</div> : null}
          </div>
        </div>
      ) : null}

      {leaguesList.length === 0 ? (
        <EmptyState title="No Leagues" desc="There are no active leagues at the moment." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leaguesList.map((league) => (
            <div key={league.id} className="glass-panel flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">{league.name}</h3>
                <p className="text-sm text-muted mb-4">
                  Status: <span className="capitalize text-primary">{league.status}</span>
                  <br />
                  Current Game Day: {league.current_game_day}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link to={`/leagues/${league.id}`} className="text-primary hover:underline text-sm font-medium">
                  View Standings & Schedule &rarr;
                </Link>
                {isAdmin ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-secondary" disabled={activeLeagueId === league.id} onClick={() => runAdminAction(league.id, leaguesApi.adminStart)}>
                      {activeLeagueId === league.id ? 'Updating…' : 'Start'}
                    </button>
                    <button type="button" className="btn btn-secondary" disabled={activeLeagueId === league.id} onClick={() => runAdminAction(league.id, leaguesApi.adminAdvanceGameDay)}>
                      {activeLeagueId === league.id ? 'Updating…' : 'Advance Day'}
                    </button>
                    <button type="button" className="btn btn-secondary" disabled={activeLeagueId === league.id} onClick={() => runAdminAction(league.id, leaguesApi.adminEndSeason)}>
                      {activeLeagueId === league.id ? 'Updating…' : 'End Season'}
                    </button>
                    <button type="button" className="btn btn-secondary" disabled={activeLeagueId === league.id} onClick={() => runAdminAction(league.id, leaguesApi.adminReset)}>
                      {activeLeagueId === league.id ? 'Updating…' : 'Reset'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
