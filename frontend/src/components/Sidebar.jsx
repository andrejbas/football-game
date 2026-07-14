import { NavLink, useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import {
  LayoutDashboard,
  User,
  Users,
  Trophy,
  Swords,
  Shield,
  Gift,
  History,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import { playerApi } from '../api/player'
import { ProgressBar } from './Widgets'
import { EmptyState } from './States'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/player', label: 'My Player', icon: User },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/leagues', label: 'Leagues', icon: Trophy },
  { to: '/matches', label: 'Matches', icon: Swords },
  { to: '/equipment', label: 'Equipment', icon: Shield },
  { to: '/rewards', label: 'Rewards', icon: Gift },
  { to: '/seasons', label: 'Seasons', icon: History },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { data: player } = useSWR('/player', playerApi.show)

  const energy = player?.energy?.current ?? 0
  const maxEnergy = player?.energy?.max ?? 0
  const energyPct = player?.energy?.pct ?? 0
  const xpCurrent = player?.xp?.current ?? 0
  const xpToNextLevel = player?.xp?.to_next_level ?? 0
  const xpPct = player?.xp?.progress_pct ?? 0

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore network errors on logout
    }
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Trophy size={20} color="#fff" />
        </div>
        <span className="logo-text">Football Manager</span>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <div className="nav-section-label">Menu</div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <Icon size={18} />
            </span>
            {label}
          </NavLink>
        ))}

        <div className="sidebar-hud">
          <div className="nav-section-label">Player HUD</div>
          {player ? (
            <div className="sidebar-hud-card">
              <div className="sidebar-hud-title">{player.name}</div>
              <div className="sidebar-hud-meta">Level {player.level}</div>

              <div className="sidebar-hud-stat">
                <div className="energy-bar-label">
                  <span>Energy</span>
                  <span>{energy} / {maxEnergy}</span>
                </div>
                <ProgressBar pct={energyPct} variant="energy" />
              </div>

              <div className="sidebar-hud-stat mt-4">
                <div className="energy-bar-label">
                  <span>XP</span>
                  <span>{xpCurrent} / {xpToNextLevel}</span>
                </div>
                <ProgressBar pct={xpPct} variant="xp" />
              </div>
            </div>
          ) : (
            <div className="sidebar-hud-card">
              <EmptyState title="Loading player..." desc="Your squad data is being loaded." />
            </div>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex-1" style={{ overflow: 'hidden' }}>
            <div className="text-base font-semibold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name ?? 'Player'}
            </div>
            <div className="text-sm text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button type="button" className="btn btn-secondary btn-block btn-sm" onClick={handleLogout}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
