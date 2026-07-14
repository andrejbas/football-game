import { useState } from 'react'
import useSWR from 'swr'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Plus, ArrowRight } from 'lucide-react'
import { teamsApi } from '../api/teams'
import { apiErrorMessage, crest } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

export default function TeamsPage() {
  const navigate = useNavigate()
  const { data: teamsPage, error, mutate } = useSWR('/teams', () => teamsApi.list())
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  if (error) return <ErrorState error="Failed to load teams" />
  if (!teamsPage) return <PageLoading label="Loading Teams..." />

  const teams = teamsPage.data || teamsPage

  const submitCreateTeam = async (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    setCreateError('')
    setCreating(true)
    try {
      const team = await teamsApi.create({ name: trimmedName })
      setName('')
      setIsCreating(false)
      await mutate()
      navigate(`/teams/${team.id}`)
    } catch (err) {
      setCreateError(apiErrorMessage(err, 'Unable to create team.'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="pitch-hero">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="eyebrow flex items-center gap-2">
              <Users size={14} />
              Clubs
            </div>
            <h1 className="text-balance">Teams</h1>
            <p className="text-secondary text-base" style={{ maxWidth: 520 }}>
              Create a club or join an existing one to start building your roster.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setIsCreating((open) => !open)}>
            <Plus size={16} />
            {isCreating ? 'Cancel' : 'Create Team'}
          </button>
        </div>
      </div>

      {isCreating ? (
        <div className="glass-panel">
          <div className="section-head">
            <span className="section-icon"><Plus size={18} /></span>
            <h2>Create a new club</h2>
          </div>
          {createError ? <div className="alert alert-error mb-4" role="alert">{createError}</div> : null}
          <form onSubmit={submitCreateTeam} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="form-group flex-1 mb-0">
              <label className="form-label" htmlFor="team-name">Team name</label>
              <input
                id="team-name"
                type="text"
                className="form-input"
                placeholder="My Football Club"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create club'}
            </button>
          </form>
        </div>
      ) : null}

      {teams.length === 0 ? (
        <EmptyState title="No Teams Found" desc="There are no teams available yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const roster = team.roster_count ?? team.players?.length ?? 0
            return (
              <div key={team.id} className="card flex flex-col justify-between">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-4" style={{ minWidth: 0 }}>
                    <span className="team-crest" style={{ width: 44, height: 44, borderRadius: 12, fontSize: 16 }}>
                      {crest(team.name)}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="text-lg font-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {team.name}
                      </h3>
                      <div className="text-sm text-muted">Roster {roster} / 22</div>
                    </div>
                  </div>
                  <Link to={`/teams/${team.id}`} className="btn btn-secondary btn-block">
                    View Details
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
