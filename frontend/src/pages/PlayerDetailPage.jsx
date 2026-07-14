import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import {
  UserCircle2,
  Shield,
  Zap,
  Trophy,
  Target,
  Package,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { playerApi } from '../api/player'
import { crest } from '../lib/format'
import { PageLoading, ErrorState } from '../components/States'
import { RadarChart } from '../components/Widgets'

// ─── Constants ──────────────────────────────────────────────────────────────

const SLOT_ICONS = {
  boots: '👟',
  shorts: '🩳',
  jersey: '👕',
  socks: '🧦',
  charm: '🏅',
}

const SLOT_LAYOUT_EQUIP = [
  [{ slot: 'jersey' }],
  [{ slot: 'charm' }, { slot: 'shorts' }],
  [{ slot: 'socks' }, { slot: 'boots' }],
]

// Matches EquipmentPage's rarityKey / slotKey helpers exactly
function rarityKey(item) {
  const r = typeof item.rarity === 'object' ? item.rarity.value || item.rarity : item.rarity
  return String(r)
}

function slotFromItem(item) {
  const s = typeof item.slot === 'object' ? item.slot.value || item.slot : item.slot
  return String(s).toLowerCase()
}

function totalBonus(item) {
  return item.bonuses?.total ?? 0
}

// ─── Stat bar row matching EquipmentPage style ──────────────────────────────

function StatBarRow({ label, base, effective }) {
  const b = base ?? 0
  const bonus = Math.max(0, (effective ?? b) - b)
  return (
    <div className="equip-stats-row" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="stat-name">{label}</span>
      <div style={{ flex: 1, margin: '0 12px' }}>
        <div className="relative h-1.5 rounded-full bg-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 100, height: 6, position: 'relative', overflow: 'hidden' }}>
          <div
            style={{ position: 'absolute', inset: '0 auto 0 0', background: '#4ade80', borderRadius: 100, width: `${Math.min(100, b)}%`, transition: 'width 0.4s' }}
          />
          {bonus > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${Math.min(100, b)}%`,
                width: `${Math.min(100 - b, bonus)}%`,
                background: '#fbbf24',
                borderRadius: '0 100px 100px 0',
                transition: 'width 0.4s',
              }}
            />
          )}
        </div>
      </div>
      <span className="stat-bonus">
        {effective ?? b}
        {bonus > 0 ? <span style={{ color: '#fbbf24', fontSize: 10 }}> +{bonus}</span> : null}
      </span>
    </div>
  )
}

// ─── Gear slot in Equipment-page style ──────────────────────────────────────

function GearSlot({ slot, item }) {
  const rk = item ? rarityKey(item) : null
  const rkLower = rk ? rk.toLowerCase() : null

  return (
    <div
      className={[
        'equip-slot',
        item ? 'filled' : '',
        rkLower ? `rarity-glow-${rkLower}` : '',
      ].filter(Boolean).join(' ')}
      style={{ cursor: 'default', maxWidth: 130 }}
      title={item ? item.name : `No ${slot} equipped`}
    >
      {item ? (
        <div className="equip-slot-item">
          <span className={`equip-slot-item-rarity rarity-badge-${rk}`}>{rk}</span>
          <span className="equip-slot-item-name">{item.name}</span>
          <span className="equip-slot-item-stats">+{totalBonus(item)}</span>
        </div>
      ) : (
        <>
          <span className="equip-slot-icon">{SLOT_ICONS[slot] || '?'}</span>
          <span className="equip-slot-label">{slot}</span>
        </>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PlayerDetailPage() {
  const { id } = useParams()
  const { data: player, error } = useSWR(`/players/${id}`, () => playerApi.showById(id))

  const equippedBySlot = useMemo(() => {
    const map = {}
    ;(player?.equipped_items || []).forEach((it) => {
      map[slotFromItem(it)] = it
    })
    return map
  }, [player])

  // Gear bonus totals (matching EquipmentPage stats summary)
  const totalGearStats = useMemo(() => {
    const stats = { attack: 0, defense: 0, stamina: 0, speed: 0, technique: 0 }
    ;(player?.equipped_items || []).forEach((item) => {
      const b = item.bonuses || {}
      for (const stat of Object.keys(stats)) {
        stats[stat] += Number(b[stat]) || 0
      }
    })
    return stats
  }, [player])

  if (error) return <ErrorState error="Failed to load this player" />
  if (!player) return <PageLoading label="Loading Player..." />

  const base = player.base_stats || {}
  const effective = player.effective_stats || {}
  const xp = player.xp || {}
  const seasonHistory = player.season_history || []
  const currentSeason = seasonHistory[0]
  const previousSeasons = seasonHistory.slice(1)
  const equippedCount = Object.keys(equippedBySlot).length

  return (
    <div className="animate-fade-in flex flex-col gap-6">

      {/* ─── Hero Banner — same style as EquipmentPage ─────────────────────── */}
      <div className="pitch-hero">
        <div className="eyebrow flex items-center gap-2">
          <UserCircle2 size={14} />
          Player Profile
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4" style={{ minWidth: 0 }}>
            <span className="team-crest" style={{ width: 56, height: 56, borderRadius: 16, fontSize: 20 }}>
              {crest(player.name)}
            </span>
            <div style={{ minWidth: 0 }}>
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
                <span className="chip">
                  <Package size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
                  {equippedCount} / 5 gear equipped
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="equip-layout">

        {/* Left: Gear panel — matches equip-slots-panel style exactly */}
        <div className="equip-slots-panel">
          <div className="equip-slots-title">
            <Package size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
            Equipped Gear
          </div>

          {/* Gear slots in the same SLOT_LAYOUT rows as EquipmentPage */}
          <div className="equip-figure">
            {SLOT_LAYOUT_EQUIP.map((row, ri) => (
              <div className="equip-figure-row" key={ri}>
                {row.map(({ slot }) => (
                  <GearSlot key={slot} slot={slot} item={equippedBySlot[slot]} />
                ))}
              </div>
            ))}
          </div>

          {/* Total gear bonuses — matches equip-stats-summary exactly */}
          <div className="equip-stats-summary">
            <div className="equip-stats-summary-title">
              <Shield size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
              Total Gear Bonuses
            </div>
            {Object.entries(totalGearStats).map(([stat, val]) => (
              <div className="equip-stats-row" key={stat}>
                <span className="stat-name">{stat}</span>
                <span className="stat-bonus">+{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stats, XP, Performance */}
        <div className="flex flex-col gap-6">

          {/* Stats panel with radar + bars */}
          <div className="inventory-panel" style={{ minHeight: 'auto' }}>
            <div className="inventory-header" style={{ marginBottom: 0 }}>
              <div>
                <span className="inventory-title">
                  <Zap size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
                  Stats
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-0" style={{ marginTop: 16 }}>
              <StatBarRow label="Attack" base={base.attack} effective={effective.attack} />
              <StatBarRow label="Defense" base={base.defense} effective={effective.defense} />
              <StatBarRow label="Stamina" base={base.stamina} effective={effective.stamina} />
              <StatBarRow label="Speed" base={base.speed} effective={effective.speed} />
              <StatBarRow label="Technique" base={base.technique} effective={effective.technique} />
            </div>

            {/* Radar chart */}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
              <div className="equip-slots-title" style={{ marginBottom: 0, textAlign: 'left', fontSize: 11 }}>
                <Activity size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: '-1px' }} />
                Stat Overview
              </div>
              <RadarChart base={base} effective={effective} />
            </div>
          </div>

          {/* XP Progress panel — matches inventory-panel style */}
          <div className="inventory-panel" style={{ minHeight: 'auto' }}>
            <div className="inventory-header">
              <span className="inventory-title">
                <TrendingUp size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
                Progress
              </span>
              <span className="inventory-count">Level {player.level}</span>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div className="energy-bar-label">
                <span>XP to next level</span>
                <span>{xp.current ?? 0} / {xp.to_next_level ?? 0}</span>
              </div>
              <div className="progress-bar-container" style={{ height: 8 }}>
                <div
                  className="progress-bar xp"
                  style={{ width: `${Math.min(100, xp.progress_pct ?? 0)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Season Performance — matches inventory-panel style */}
          <div className="inventory-panel" style={{ minHeight: 'auto' }}>
            <div className="inventory-header">
              <span className="inventory-title">
                <Trophy size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
                Season Performance
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Current season highlight */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                }}
              >
                <div className="equip-stats-panel-mini" style={{ background: 'rgba(6,22,14,0.5)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 12px', textAlign: 'center' }}>
                  <div className="equip-slots-title" style={{ marginBottom: 4, fontSize: 10 }}>Goals</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#4ade80', lineHeight: 1 }}>{currentSeason?.goals ?? 0}</div>
                </div>
                <div className="equip-stats-panel-mini" style={{ background: 'rgba(6,22,14,0.5)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 12px', textAlign: 'center' }}>
                  <div className="equip-slots-title" style={{ marginBottom: 4, fontSize: 10 }}>Apps</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{currentSeason?.appearances ?? 0}</div>
                </div>
                <div className="equip-stats-panel-mini" style={{ background: 'rgba(6,22,14,0.5)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 12px', textAlign: 'center' }}>
                  <div className="equip-slots-title" style={{ marginBottom: 4, fontSize: 10 }}>Season</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1, paddingTop: 4 }}>{currentSeason?.season ?? '—'}</div>
                </div>
              </div>

              {/* Previous seasons as inventory-style rows */}
              {previousSeasons.length > 0 ? (
                <div>
                  <div className="inventory-filters" style={{ marginBottom: 10 }}>
                    <span className="inventory-count">Previous Seasons</span>
                  </div>
                  <div className="inventory-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', maxHeight: 200 }}>
                    {previousSeasons.map((s) => (
                      <div
                        key={s.season}
                        className="inv-card rarity-q1"
                        style={{ cursor: 'default' }}
                      >
                        <div className="inv-card-meta">
                          <span className="inv-card-slot">
                            <Target size={10} /> {s.season}
                          </span>
                        </div>
                        <div className="inv-card-name">{s.goals ?? 0} goals</div>
                        <div className="inv-card-stats">{s.appearances ?? 0} appearances</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  No previous season data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
