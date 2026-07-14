import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { Users, Shield, ArrowRight } from 'lucide-react'
import { playerApi } from '../api/player'
import { teamsApi } from '../api/teams'
import { apiErrorMessage, crest } from '../lib/format'
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
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="pitch-hero">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4" style={{ minWidth: 0 }}>
            <span className="team-crest" style={{ width: 56, height: 56, borderRadius: 16, fontSize: 20 }}>
              {crest(team.name)}
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="eyebrow flex items-center gap-2">
                <Shield size={14} />
                Club
              </div>
              <h1 className="text-balance" style={{ marginBottom: 6 }}>{team.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip chip-accent">{memberCount} / 22 players</span>
                {team.owner?.name ? <span className="chip">Captain: {team.owner.name}</span> : null}
              </div>
            </div>
          </div>

          {player ? (
            <div className="flex flex-col gap-3 sm:items-end">
              {!currentTeamId ? (
                <button type="button" className="btn btn-primary" onClick={handleJoinLeave} disabled={actionLoading}>
                  {actionLoading ? 'Updating…' : 'Join Team'}
                </button>
              ) : isCurrentTeam ? (
                <button type="button" className="btn btn-secondary" onClick={handleJoinLeave} disabled={actionLoading}>
                  {actionLoading ? 'Updating…' : 'Leave Team'}
                </button>
              ) : (
                <div className="text-right text-sm text-muted" style={{ maxWidth: 260 }}>
                  <p>You are already registered with another club. Leave it first, then join this one.</p>
                  {player.team?.id ? (
                    <Link className="auth-link" to={`/teams/${player.team.id}`}>
                      Go to current team
                      <ArrowRight size={13} style={{ display: 'inline', verticalAlign: '-2px', marginLeft: 4 }} />
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {actionError ? <div className="alert alert-error" role="alert">{actionError}</div> : null}

      <div className="glass-panel">
        <div className="section-head">
          <span className="section-icon"><Users size={18} /></span>
          <h2>Team Members</h2>
        </div>

        {membersError ? (
          <ErrorState error="Failed to load members" />
        ) : !members ? (
          <EmptyState title="Loading members…" desc="Fetching the current roster." />
        ) : members.length === 0 ? (
          <EmptyState title="No members yet" desc="This club has no players on the roster." />
        ) : (
          <div className="data-list">
            {members.map((member) => (
              <Link
                key={member.id}
                to={`/players/${member.id}`}
                className="data-row hover:bg-white/5 transition"
              >
                <div className="data-main">
                  <span 
                    className="team-crest" 
                    style={{ width: 34, height: 34, fontSize: 13 }}
                  >
                    {crest(member.name || 'P')}
                  </span>

                  <span className="data-name">
                    {member.name || 'Player'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="chip chip-accent">
                    ⚽ {member.goals_scored ?? 0}
                  </span>

                  <span className="chip">
                    Level {member.level}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}