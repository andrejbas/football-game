import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { LayoutDashboard, Dumbbell, Shield, Users, Trophy, ArrowRight, Zap } from 'lucide-react'
import { playerApi } from '../api/player'
import { useAuthStore } from '../store/authStore'
import { crest } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'
import { StatCard, ProgressBar } from '../components/Widgets'

export default function DashboardPage() {
  const { data: player, error: playerError } = useSWR('/player', playerApi.show)
  const isAdmin = useAuthStore((s) => s.isAdmin())

  const teamId = player?.team?.id
  const teamName = player?.team?.name
  const energy = player?.energy?.current ?? 0
  const maxEnergy = player?.energy?.max ?? 0
  const xpCurrent = player?.xp?.current ?? 0
  const xpToNextLevel = player?.xp?.to_next_level ?? 0

  if (playerError) return <ErrorState error="Failed to load player data" />
  if (!player) return <PageLoading label="Loading Dashboard..." />

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="pitch-hero">
        <div className="eyebrow flex items-center gap-2">
          <LayoutDashboard size={14} />
          Clubhouse
        </div>
        <h1 className="text-balance">Welcome back, {player.name || 'Manager'}</h1>
        <p className="text-secondary text-base" style={{ maxWidth: 560 }}>
          Track your footballer, train to level up, and step onto the pitch with your club.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel">
          <div className="section-head">
            <span className="section-icon"><Zap size={18} /></span>
            <h2>Player Status</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <StatCard label="Level" value={player.level} />
            <StatCard label="Attack" value={player.base_stats?.attack ?? 0} />
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Energy</span>
              <span className="font-medium">{energy} / {maxEnergy}</span>
            </div>
            <ProgressBar pct={player.energy?.pct ?? 0} variant="energy" />
          </div>
          <div className="mb-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">XP</span>
              <span className="font-medium">{xpCurrent} / {xpToNextLevel}</span>
            </div>
            <ProgressBar pct={player.xp?.progress_pct ?? 0} variant="xp" />
          </div>

          <Link to="/player" className="btn btn-secondary btn-block">
            View Full Profile
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="glass-panel flex flex-col gap-5">
          <div>
            <div className="section-head">
              <span className="section-icon"><Trophy size={18} /></span>
              <h2>Your Club</h2>
            </div>

            {teamId ? (
              <div className="data-row">
                <div className="data-main">
                  <span className="team-crest">{crest(teamName)}</span>
                  <div>
                    <div className="data-name">{teamName || 'Your club'}</div>
                    <div className="text-sm text-muted">Active roster member</div>
                  </div>
                </div>
                <Link to={`/teams/${teamId}`} className="btn btn-secondary btn-sm">
                  Manage
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <EmptyState
                title="No Club Yet"
                desc="You are currently a free agent. Join a team to compete in leagues!"
              />
            )}
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-wide text-muted mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/player" className="btn btn-primary btn-block">
                <Dumbbell size={16} />
                Train
              </Link>
              <Link to="/equipment" className="btn btn-secondary btn-block">
                <Shield size={16} />
                Equipment
              </Link>
              <Link to="/teams" className="btn btn-secondary btn-block">
                <Users size={16} />
                Teams
              </Link>
              <Link to="/leagues" className="btn btn-secondary btn-block">
                <Trophy size={16} />
                Leagues
              </Link>
            </div>
          </div>

          {isAdmin ? (
            <div className="chip chip-accent" style={{ alignSelf: 'flex-start' }}>
              <Shield size={13} />
              Admin access enabled
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
