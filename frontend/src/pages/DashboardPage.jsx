import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { playerApi } from '../api/player'
import { useAuthStore } from '../store/authStore'
import { PageLoading, ErrorState, EmptyState } from '../components/States'
import { StatCard, ProgressBar } from '../components/Widgets'

export default function DashboardPage() {
  const { data: player, error: playerError } = useSWR('/player', playerApi.show)
  const isAdmin = useAuthStore((s) => s.isAdmin())
  
  // We can also fetch the team if player is on a team
  const teamId = player?.team?.id
  const teamName = player?.team?.name
  const energy = player?.energy?.current ?? 0
  const maxEnergy = player?.energy?.max ?? 0
  const xpCurrent = player?.xp?.current ?? 0
  const xpToNextLevel = player?.xp?.to_next_level ?? 0

  if (playerError) return <ErrorState error="Failed to load player data" />
  if (!player) return <PageLoading label="Loading Dashboard..." />

  return (
    <div className="container main-content animate-fade-in">
      <h1 className="mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Player Overview Card */}
        <div className="glass-panel">
          <h2 className="text-xl font-semibold mb-4 text-primary">Player Status</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <StatCard label="Level" value={player.level} />
            <StatCard label="Attack" value={player.base_stats?.attack ?? 0} />
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted">Energy</span>
              <span>{energy} / {maxEnergy}</span>
            </div>
            <ProgressBar pct={player.energy?.pct ?? 0} variant="energy" />
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted">XP</span>
              <span>{xpCurrent} / {xpToNextLevel}</span>
            </div>
            <ProgressBar pct={player.xp?.progress_pct ?? 0} variant="xp" />
          </div>
          <Link to="/player" className="text-primary text-sm font-medium hover:underline">
            View Full Profile &rarr;
          </Link>
        </div>

        <div className="glass-panel flex flex-col justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-primary">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5">
                <div className="text-xs uppercase tracking-wide text-muted">Training</div>
                <div className="mt-1 font-medium">Spend energy to gain XP</div>
                <div className="text-sm text-muted mt-1">Energy available: {energy}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5">
                <div className="text-xs uppercase tracking-wide text-muted">Club</div>
                <div className="mt-1 font-medium">{teamId ? `Playing for ${teamName || 'a club'}` : 'No club yet'}</div>
                <div className="text-sm text-muted mt-1">Roster, captaincy, and league access live in Teams.</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/player" className="btn btn-primary">Train</Link>
              <Link to="/equipment" className="btn btn-secondary">Equipment</Link>
              <Link to="/teams" className="btn btn-secondary">Teams</Link>
              <Link to="/leagues" className="btn btn-secondary">Leagues</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-wide text-muted mb-2">Current Team</h3>
            {teamId ? (
              <>
                <p className="mb-2">You are currently playing for {teamName || 'your team'}.</p>
                <Link to={`/teams/${teamId}`} className="text-primary hover:underline">
                  Go to Team Management &rarr;
                </Link>
              </>
            ) : (
              <EmptyState
                title="No Team"
                desc="You are currently a free agent. Join a team to participate in leagues!"
              />
            )}
          </div>

          {!teamId ? (
            <div className="mt-4">
              <Link
                to="/teams"
                className="form-input text-center bg-primary text-white hover:bg-primary-hover inline-block w-full"
                style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
              >
                Browse Teams
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
