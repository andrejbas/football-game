import { useEffect, useState, useRef } from 'react'
import useSWR from 'swr'
import { User, Dumbbell, Pencil, Zap } from 'lucide-react'
import { playerApi } from '../api/player'
import { apiErrorMessage, crest } from '../lib/format'
import { PageLoading, ErrorState } from '../components/States'
import { StatCard, ProgressBar, RadarChart } from '../components/Widgets'
import LevelUpOverlay from '../components/LevelUp'
import { toast } from '../store/toastStore'

export default function PlayerPage() {
  const { data: player, error, mutate } = useSWR('/player', playerApi.show)
  const [name, setName] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [trainingEnergy, setTrainingEnergy] = useState(10)
  const [trainingLoading, setTrainingLoading] = useState(false)
  const [levelUpLevel, setLevelUpLevel] = useState(null)
  const prevLevelRef = useRef(null)

  useEffect(() => {
    if (player) {
      setName(player.name || '')
      // Detect level-up by comparing to previous level
      if (prevLevelRef.current !== null && player.level > prevLevelRef.current) {
        setLevelUpLevel(player.level)
      }
      prevLevelRef.current = player.level
    }
  }, [player])

  if (error) return <ErrorState error="Failed to load player data" />
  if (!player) return <PageLoading label="Loading Player Profile..." />

  const submitRename = async (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    setSaving(true)
    try {
      await playerApi.update({ name: trimmedName })
      await mutate()
      setEditOpen(false)
      toast.success('Name updated', `Your player is now known as ${trimmedName}.`)
    } catch (err) {
      toast.error('Could not rename', apiErrorMessage(err, 'Unable to update player.'))
    } finally {
      setSaving(false)
    }
  }

  const submitTraining = async (event) => {
    event.preventDefault()
    const invested = Number(trainingEnergy)
    if (!Number.isFinite(invested) || invested < 1) return
    setTrainingLoading(true)
    try {
      await playerApi.train({ energy_invested: invested })
      await mutate()
      toast.success('Training complete', `${invested} energy spent — XP gained!`)
    } catch (err) {
      toast.error('Training failed', apiErrorMessage(err, 'Unable to train right now.'))
    } finally {
      setTrainingLoading(false)
    }
  }

  const energy = player.energy?.current ?? 0
  const maxEnergy = player.energy?.max ?? 0
  const xpCurrent = player.xp?.current ?? 0
  const xpToNextLevel = player.xp?.to_next_level ?? 1
  const xpPct = player.xp?.progress_pct ?? 0
  const baseStats = player.base_stats ?? {}
  const effectiveStats = player.effective_stats ?? baseStats

  return (
    <>
      {levelUpLevel !== null && (
        <LevelUpOverlay level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />
      )}

      <div className="animate-fade-in flex flex-col gap-6">
        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        <div className="pitch-hero">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4" style={{ minWidth: 0 }}>
              <span className="team-crest" style={{ width: 56, height: 56, borderRadius: 16, fontSize: 20 }}>
                {crest(player.name)}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="eyebrow flex items-center gap-2">
                  <User size={14} />
                  Player Profile
                </div>
                <h1 className="text-balance" style={{ marginBottom: 4 }}>{player.name || 'Player'}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip chip-accent">Level {player.level}</span>
                  {player.team?.name ? (
                    <span className="chip">{player.team.name}</span>
                  ) : (
                    <span className="chip">Free agent</span>
                  )}
                </div>
              </div>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => setEditOpen((open) => !open)}>
              <Pencil size={15} />
              {editOpen ? 'Close' : 'Edit Name'}
            </button>
          </div>
        </div>

        {/* ─── Rename ───────────────────────────────────────────────────────── */}
        {editOpen ? (
          <div className="glass-panel">
            <div className="section-head">
              <span className="section-icon"><Pencil size={18} /></span>
              <h2>Rename Player</h2>
            </div>
            <form onSubmit={submitRename} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="form-group flex-1 mb-0">
                <label className="form-label" htmlFor="player-name">Player name</label>
                <input
                  id="player-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>
        ) : null}

        {/* ─── Stats grid + Radar ───────────────────────────────────────────── */}
        <div className="glass-panel">
          <div className="section-head">
            <span className="section-icon"><Zap size={18} /></span>
            <h2>Attributes</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Level" value={player.level} />
            <StatCard label="Attack" value={effectiveStats.attack ?? 0} sub={baseStats.attack !== effectiveStats.attack ? `base ${baseStats.attack}` : null} />
            <StatCard label="Defense" value={effectiveStats.defense ?? 0} sub={baseStats.defense !== effectiveStats.defense ? `base ${baseStats.defense}` : null} />
            <StatCard label="Stamina" value={effectiveStats.stamina ?? 0} sub={baseStats.stamina !== effectiveStats.stamina ? `base ${baseStats.stamina}` : null} />
          </div>

          {/* Progress bars */}
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Energy</span>
                <span className="font-medium">{energy} / {maxEnergy}</span>
              </div>
              <ProgressBar pct={player.energy?.pct ?? 0} variant="energy" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Experience</span>
                <span className="font-medium">{xpCurrent} / {xpToNextLevel} XP</span>
              </div>
              <ProgressBar pct={xpPct} variant="xp" />
            </div>
          </div>

          {/* Radar chart — full stat overview */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <div className="text-sm font-semibold text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11 }}>
              Stat Overview
            </div>
            <RadarChart base={baseStats} effective={effectiveStats} />
          </div>
        </div>

        {/* ─── Training Ground ──────────────────────────────────────────────── */}
        <div className="glass-panel">
          <div className="section-head">
            <span className="section-icon"><Dumbbell size={18} /></span>
            <h2>Training Ground</h2>
          </div>
          <form onSubmit={submitTraining} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="form-group flex-1 mb-0">
              <label className="form-label" htmlFor="training-energy">Energy to invest</label>
              <input
                id="training-energy"
                type="number"
                className="form-input"
                min="1"
                max={maxEnergy}
                value={trainingEnergy}
                onChange={(e) => setTrainingEnergy(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={trainingLoading || energy < 1}>
              <Dumbbell size={16} />
              {trainingLoading ? 'Training…' : 'Train'}
            </button>
          </form>
          <p className="text-muted text-sm mt-3">
            Training converts energy into XP and can trigger level-ups that improve your base stats.
            {energy < 10 ? ' You are low on energy — rest to recover.' : null}
          </p>
        </div>
      </div>
    </>
  )
}
