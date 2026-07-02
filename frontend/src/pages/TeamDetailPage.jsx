import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { playerApi } from '../api/player'
import { teamsApi } from '../api/teams'
import { apiErrorMessage } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

export default function TeamDetailPage() {
  const { id } = useParams()
  const { data: team, error, mutate: mutateTeam } = useSWR(`/teams/${id}`, () => teamsApi.show(id))
  const { data: members, error: membersError, mutate: mutateMembers } = useSWR(`/teams/${id}/members`, () =>
    teamsApi.members(id)
  )
  const { data: player, mutate: mutatePlayer } = useSWR('/player', playerApi.show)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  if (error) return <ErrorState error="Failed to load team details" />
  if (!team) return <PageLoading label="Loading Team..." />

  const currentTeamId = player?.team?.id
  const isCurrentTeam = String(currentTeamId) === String(id)
  const memberCount = members?.length ?? team.roster_count ?? team.players?.length ?? 0

  const handleJoinLeave = async () => {
    setActionError('')
    setActionLoading(true)

    try {
      if (isCurrentTeam) {
        await teamsApi.leave(id)
      } else {
        await teamsApi.join(id)
      }

      await Promise.all([mutateTeam(), mutateMembers(), mutatePlayer()])
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Unable to update team membership.'))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="container main-content animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-6">
        <div>
          <h1 className="mb-2">{team.name}</h1>
          <p className="text-muted mb-2">Roster: {memberCount} / 22</p>
          {team.owner?.name ? <p className="text-muted text-sm">Captain: {team.owner.name}</p> : null}
        </div>

        {player ? (
          <div className="flex flex-col gap-3 sm:items-end">
            {actionError ? (
              <div className="alert alert-error" role="alert">
                {actionError}
              </div>
            ) : null}

            {!currentTeamId ? (
              <button type="button" className="btn btn-primary" onClick={handleJoinLeave} disabled={actionLoading}>
                {actionLoading ? 'Updating…' : 'Join Team'}
              </button>
            ) : isCurrentTeam ? (
              <button type="button" className="btn btn-secondary" onClick={handleJoinLeave} disabled={actionLoading}>
                {actionLoading ? 'Updating…' : 'Leave Team'}
              </button>
            ) : (
              <div className="text-right text-sm text-muted max-w-xs">
                <p>You are already registered with another team.</p>
                <p>Leave your current club first, then join this one.</p>
                {player.team?.id ? (
                  <Link className="text-primary hover:underline" to={`/teams/${player.team.id}`}>
                    Go to current team →
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="glass-panel mb-6">
        <h2 className="text-xl font-semibold mb-4 text-primary">Team Members</h2>
        {membersError ? (
          <ErrorState error="Failed to load members" />
        ) : !members ? (
          <div>Loading members...</div>
        ) : (
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={member.id} className="p-3 bg-slate-800/50 rounded border border-white/5 flex justify-between">
                <span>{member.user?.name || 'Player'}</span>
                <span className="text-muted text-sm">Level: {member.level}</span>
              </li>
            ))}
            {members.length === 0 ? <EmptyState title="No members in this team." /> : null}
          </ul>
        )}
      </div>
    </div>
  )
}
