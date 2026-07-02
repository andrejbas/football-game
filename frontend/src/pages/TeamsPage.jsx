import { useState } from 'react'
import useSWR from 'swr'
import { Link, useNavigate } from 'react-router-dom'
import { teamsApi } from '../api/teams'
import { apiErrorMessage } from '../lib/format'
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
    <div className="container main-content animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="mb-0">Teams</h1>
          <p className="text-muted text-sm mt-1">Create a club or join one to start building a roster.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setIsCreating((open) => !open)}>
          {isCreating ? 'Cancel' : 'Create Team'}
        </button>
      </div>

      {isCreating ? (
        <div className="glass-panel mb-6">
          <h2 className="text-xl font-semibold mb-4 text-primary">Create a new club</h2>
          {createError ? (
            <div className="alert alert-error mb-4" role="alert">
              {createError}
            </div>
          ) : null}
          <form onSubmit={submitCreateTeam} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="form-group flex-1 mb-0">
              <label className="form-label" htmlFor="team-name">
                Team name
              </label>
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
          {teams.map((team) => (
            <div key={team.id} className="glass-panel flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">{team.name}</h3>
                <p className="text-muted text-sm mb-4">Roster: {team.roster_count ?? team.players?.length ?? 0} / 22</p>
              </div>
              <Link to={`/teams/${team.id}`} className="text-primary hover:underline text-sm font-medium">
                View Details &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
