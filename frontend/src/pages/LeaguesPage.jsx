import { useState } from 'react'
import useSWR from 'swr'
import { Link } from 'react-router-dom'
import { Trophy, ArrowRight, Plus, Shield } from 'lucide-react'
import { leaguesApi } from '../api/leagues'
import { useAuthStore } from '../store/authStore'
import { apiErrorMessage } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

function statusPill(status = '') {
  const s = status.toLowerCase()
  if (s === 'live' || s === 'in_progress' || s === 'playing') return 'status-live'
  if (s === 'active' || s === 'ongoing' || s === 'started') return 'status-active'
  if (s === 'finished' || s === 'completed' || s === 'ended') return 'status-done'
  return 'status-idle'
}

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
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="pitch-hero">
        <div className="eyebrow flex items-center gap-2">
          <Trophy size={14} />
          Competitions
        </div>
        <h1 className="text-balance">Leagues</h1>
        <p className="text-secondary text-base" style={{ maxWidth: 560 }}>
          Follow every table and fixture across the season. Admins can create competitions and drive the matchday
          lifecycle.
        </p>
      </div>

      {isAdmin ? (
        <div className="glass-panel">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-accent" />
            <h2 className="text-lg font-semibold">Admin Controls</h2>
          </div>
          <p className="text-sm text-muted mb-4">Create leagues here, then use the per-league controls to manage seasons.</p>
          <div className="flex flex-col gap-4">
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
                <Plus size={16} />
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
            <div key={league.id} className="card flex flex-col justify-between">
              <div className="card-body">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                    <span className="team-crest" style={{ width: 40, height: 40, borderRadius: 12, fontSize: 15 }}>
                      <Trophy size={18} color="#04150c" />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="text-lg font-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {league.name}
                      </h3>
                      <div className="text-sm text-muted">Matchday {league.current_game_day}</div>
                    </div>
                  </div>
                  <span className={`status-pill ${statusPill(league.status)}`}>{league.status}</span>
                </div>

                <Link to={`/leagues/${league.id}`} className="btn btn-secondary btn-block">
                  View Table &amp; Fixtures
                  <ArrowRight size={16} />
                </Link>
              </div>

              {isAdmin ? (
                <div className="card-header" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none' }}>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-secondary btn-sm" disabled={activeLeagueId === league.id} onClick={() => runAdminAction(league.id, leaguesApi.adminStart)}>
                      {activeLeagueId === league.id ? 'Updating…' : 'Start'}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" disabled={activeLeagueId === league.id} onClick={() => runAdminAction(league.id, leaguesApi.adminAdvanceGameDay)}>
                      {activeLeagueId === league.id ? 'Updating…' : 'Advance Day'}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" disabled={activeLeagueId === league.id} onClick={() => runAdminAction(league.id, leaguesApi.adminEndSeason)}>
                      {activeLeagueId === league.id ? 'Updating…' : 'End Season'}
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" disabled={activeLeagueId === league.id} onClick={() => runAdminAction(league.id, leaguesApi.adminReset)}>
                      {activeLeagueId === league.id ? 'Updating…' : 'Reset'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
