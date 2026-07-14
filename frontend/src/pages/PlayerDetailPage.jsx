import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { UserCircle2, Shield, Zap, Trophy, Target } from 'lucide-react'
import { playerApi } from '../api/player'
import { crest } from '../lib/format'
import { PageLoading, ErrorState } from '../components/States'

const RARITY_STYLE = {
  common: { color: '#9aa5b1', glow: 'rgba(154,165,177,0.35)', label: 'Common' },
  uncommon: { color: '#4ade80', glow: 'rgba(74,222,128,0.45)', label: 'Uncommon' },
  rare: { color: '#38bdf8', glow: 'rgba(56,189,248,0.5)', label: 'Rare' },
  epic: { color: '#a78bfa', glow: 'rgba(167,139,250,0.55)', label: 'Epic' },
  legendary: { color: '#fbbf24', glow: 'rgba(251,191,36,0.65)', label: 'Legendary' },
}

function titleCase(v) {
  if (!v) return 'Unknown'
  return String(v)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function rarityStyle(rarity) {
  return (
    RARITY_STYLE[String(rarity).toLowerCase()] || {
      color: '#7cff6b',
      glow: 'rgba(124,255,107,0.4)',
      label: titleCase(rarity),
    }
  )
}

const SLOT_LAYOUT = [
  { match: ['helmet', 'headgear', 'head', 'cap'], top: '4%', left: '50%', label: 'Head' },
  { match: ['jersey', 'shirt', 'chest', 'top'], top: '28%', left: '50%', label: 'Jersey' },
  { match: ['glove'], top: '37%', left: '12%', label: 'Gloves' },
  { match: ['charm', 'lucky'], top: '30%', left: '88%', label: 'Lucky Charm' },
  { match: ['short'], top: '54%', left: '50%', label: 'Shorts' },
  { match: ['sock', 'shin'], top: '76%', left: '50%', label: 'Socks' },
  { match: ['boot', 'shoe', 'feet'], top: '93%', left: '50%', label: 'Boots' },
]

function findLayout(slotKey) {
  const key = String(slotKey).toLowerCase()
  return SLOT_LAYOUT.find((s) => s.match.some((m) => key.includes(m)))
}

function SlotIcon({ slotKey, size = 24 }) {
  const key = String(slotKey).toLowerCase()
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  if (key.includes('boot') || key.includes('shoe') || key.includes('feet')) {
    return (
      <svg {...common}>
        <path d="M5 3v8.5c0 1 .4 1.6 1.2 2.2L10 16.5V19h9c.6 0 1-.6.7-1.2l-1.4-2.6c-.4-.7-1.1-1.2-1.9-1.4L11 12.8V3H5Z" />
      </svg>
    )
  }
  if (key.includes('glove')) {
    return (
      <svg {...common}>
        <path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5a1.5 1.5 0 0 1 3 0v7M16 9.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-3a1.5 1.5 0 0 1 3 0" />
      </svg>
    )
  }
  if (key.includes('jersey') || key.includes('shirt') || key.includes('chest') || key.includes('top')) {
    return (
      <svg {...common}>
        <path d="M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3-2 2-2-2Z" />
      </svg>
    )
  }
  if (key.includes('short')) {
    return (
      <svg {...common}>
        <path d="M5 5h14l1 6h-4l-.7 8h-2.6L12 12l-.7 7H8.7L8 11H4l1-6Z" />
      </svg>
    )
  }
  if (key.includes('sock') || key.includes('shin')) {
    return (
      <svg {...common}>
        <path d="M9 3h6v9l3 6a2 2 0 0 1-1.8 2.9h-3a2 2 0 0 1-2-1.7L10.5 14H9V3Z" />
      </svg>
    )
  }
  if (key.includes('helmet') || key.includes('head') || key.includes('cap')) {
    return (
      <svg {...common}>
        <path d="M4 14a8 8 0 0 1 16 0v1H4v-1Z" />
        <path d="M4 15h16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2Z" />
      </svg>
    )
  }
  if (key.includes('charm')) {
    // Matches the 🏅 icon used for the "charm" slot on the Equipment page
    return (
      <span style={{ fontSize: size * 0.85, lineHeight: 1 }} role="img" aria-label="Lucky Charm">
        🏅
      </span>
    )
  }
  return (
    <svg {...common}>
      <path d="m12 2 4 6-4 14-4-14 4-6Z" />
      <path d="M8 8h8" />
    </svg>
  )
}

function StatRow({ label, base, effective }) {
  const b = base ?? 0
  const bonus = Math.max(0, (effective ?? b) - b)
  return (
    <div className="grid grid-cols-[80px_1fr_56px] items-center gap-2.5">
      <span className="text-xs text-white/50">{label}</span>
      <div className="relative h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-400 transition-all duration-300"
          style={{ width: `${Math.min(100, b)}%` }}
        />
        {bonus > 0 ? (
          <div
            className="absolute inset-y-0 rounded-r-full bg-amber-400 transition-all duration-300"
            style={{ left: `${Math.min(100, b)}%`, width: `${Math.min(100 - b, bonus)}%` }}
          />
        ) : null}
      </div>
      <span className="text-xs text-right whitespace-nowrap text-white/80">
        {effective ?? b}
        {bonus > 0 ? <span className="text-amber-400"> (+{bonus})</span> : null}
      </span>
    </div>
  )
}

export default function PlayerDetailPage() {
  const { id } = useParams()
  const { data: player, error } = useSWR(`/players/${id}`, () => playerApi.showById(id))

  const equippedBySlot = useMemo(() => {
    const map = {}
    ;(player?.equipped_items || []).forEach((it) => {
      map[String(it.slot)] = it
    })
    return map
  }, [player])

  const { positioned, overflow } = useMemo(() => {
    const keys = [...new Set((player?.equipped_items || []).map((it) => String(it.slot)))]
    const withLayout = keys.map((key) => ({ key, layout: findLayout(key) }))
    return {
      positioned: withLayout.filter((s) => s.layout),
      overflow: withLayout.filter((s) => !s.layout),
    }
  }, [player])

  if (error) return <ErrorState error="Failed to load this player" />
  if (!player) return <PageLoading label="Loading Player..." />

  const base = player.base_stats || {}
  const effective = player.effective_stats || {}
  const xp = player.xp || {}
  // NOTE: assumes the API exposes `season_history` as an array of
  // { season: string, goals: number, appearances?: number }, most recent season first.
  const seasonHistory = player.season_history || []
  const currentSeason = seasonHistory[0]
  const previousSeasons = seasonHistory.slice(1)

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="pitch-hero">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4" style={{ minWidth: 0 }}>
            <span className="team-crest" style={{ width: 56, height: 56, borderRadius: 16, fontSize: 20 }}>
              {crest(player.name)}
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="eyebrow flex items-center gap-2">
                <UserCircle2 size={14} />
                Player Profile
              </div>
              <h1 className="text-balance" style={{ marginBottom: 6 }}>
                {player.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip chip-accent">Level {player.level}</span>
                {player.team?.name ? (
                  <Link to={`/teams/${player.team.id}`} className="chip">
                    <Shield size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
                    {player.team.name}
                  </Link>
                ) : (
                  <span className="chip">Free agent</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Figure + equipped gear (read-only) */}
        <div className="glass-panel flex flex-col gap-5">
          <div className="relative w-full max-w-[320px] mx-auto aspect-[1/1.55]">
            <svg viewBox="0 0 100 200" className="w-full h-full fill-white/10" aria-hidden="true">
              <ellipse cx="50" cy="20" rx="14" ry="16" />
              <path d="M28 40 Q50 30 72 40 L78 95 Q50 108 22 95 Z" />
              <path d="M22 95 L18 140 L30 140 L36 100 Z" />
              <path d="M78 95 L82 140 L70 140 L64 100 Z" />
              <path d="M18 140 L15 175 L31 175 L30 140 Z" />
              <path d="M82 140 L85 175 L69 175 L70 140 Z" />
            </svg>

            {positioned.map(({ key, layout }) => {
              const equipped = equippedBySlot[key]
              const style = equipped ? rarityStyle(equipped.rarity) : null
              return (
                <div
                  key={key}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                  style={{ top: layout.top, left: layout.left }}
                  title={equipped ? equipped.name : `Empty ${layout.label} slot`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center border-2 bg-black/70 text-white/30 ${
                      equipped ? 'border-solid' : 'border-dashed border-white/15'
                    }`}
                    style={
                      style
                        ? { color: style.color, borderColor: style.color, boxShadow: `0 0 16px ${style.glow}` }
                        : undefined
                    }
                  >
                    <SlotIcon slotKey={key} size={18} />
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-white/50 bg-black/40 px-1.5 py-0.5 rounded whitespace-nowrap">
                    {layout.label}
                  </span>
                </div>
              )
            })}
          </div>

          {overflow.length > 0 ? (
            <div className="border-t border-white/10 pt-3">
              <div className="text-sm text-muted mb-2">Other Gear</div>
              <div className="flex flex-wrap gap-2">
                {overflow.map(({ key }) => {
                  const equipped = equippedBySlot[key]
                  const style = equipped ? rarityStyle(equipped.rarity) : null
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/15 text-xs text-white/60"
                      style={style ? { color: style.color, borderColor: style.color } : undefined}
                    >
                      <SlotIcon slotKey={key} size={14} />
                      <span>{equipped.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Stats + progress */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel">
            <div className="section-head">
              <span className="section-icon">
                <Zap size={18} />
              </span>
              <h2>Stats</h2>
            </div>
            <div className="flex flex-col gap-2.5">
              <StatRow label="Attack" base={base.attack} effective={effective.attack} />
              <StatRow label="Defense" base={base.defense} effective={effective.defense} />
              <StatRow label="Stamina" base={base.stamina} effective={effective.stamina} />
              <StatRow label="Speed" base={base.speed} effective={effective.speed} />
              <StatRow label="Technique" base={base.technique} effective={effective.technique} />
            </div>
          </div>

          <div className="glass-panel">
            <div className="section-head">
              <span className="section-icon">
                <Trophy size={18} />
              </span>
              <h2>Progress</h2>
            </div>
            <div>
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>XP</span>
                <span>
                  {xp.current ?? 0} / {xp.to_next_level ?? 0}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, xp.progress_pct ?? 0)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <div className="section-head">
              <span className="section-icon">
                <Target size={18} />
              </span>
              <h2>Season Performance</h2>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Goals This Season</span>
                <span className="text-2xl font-semibold text-emerald-400">
                  {currentSeason?.goals ?? 0}
                </span>
              </div>

              {previousSeasons.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-muted">Previous Seasons</div>
                  <div className="flex flex-col gap-1.5">
                    {previousSeasons.map((s) => (
                      <div
                        key={s.season}
                        className="flex items-center justify-between text-xs px-2.5 py-2 rounded-lg bg-white/5"
                      >
                        <span className="text-white/70">{s.season}</span>
                        <span className="text-white/50">{s.appearances ?? 0} apps</span>
                        <span className="text-amber-400 font-medium">{s.goals ?? 0} goals</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-white/40">No previous season history available.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}