import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { User, Dumbbell, Pencil, Zap } from 'lucide-react'
import { playerApi } from '../api/player'
import { apiErrorMessage, crest } from '../lib/format'
import { PageLoading, ErrorState } from '../components/States'
import { StatCard, ProgressBar } from '../components/Widgets'

export default function PlayerPage() {
  const { data: player, error, mutate } = useSWR('/player', playerApi.show)
  const [name, setName] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [trainingEnergy, setTrainingEnergy] = useState(10)
  const [trainingError, setTrainingError] = useState('')
  const [trainingLoading, setTrainingLoading] = useState(false)

  useEffect(() => {
    if (player) {
      setName(player.name || '')
    }
  }, [player])

  if (error) return <ErrorState error="Failed to load player data" />
  if (!player) return <PageLoading label="Loading Player Profile..." />

  const submitRename = async (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    setSaveError('')
    setSaving(true)
    try {
      await playerApi.update({ name: trimmedName })
      await mutate()
      setEditOpen(false)
    } catch (err) {
      setSaveError(apiErrorMessage(err, 'Unable to update player.'))
    } finally {
      setSaving(false)
    }
  }

  const submitTraining = async (event) => {
    event.preventDefault()
    const invested = Number(trainingEnergy)
    if (!Number.isFinite(invested) || invested < 1) return

    setTrainingError('')
    setTrainingLoading(true)
    try {
      await playerApi.train({ energy_invested: invested })
      await mutate()
    } catch (err) {
      setTrainingError(apiErrorMessage(err, 'Unable to train right now.'))
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
    <div className="animate-fade-in flex flex-col gap-6">
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
              <span className="chip chip-accent">Level {player.level}</span>
            </div>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setEditOpen((open) => !open)}>
            <Pencil size={15} />
            {editOpen ? 'Close' : 'Edit Name'}
          </button>
        </div>
      </div>

      {editOpen ? (
        <div className="glass-panel">
          <div className="section-head">
            <span className="section-icon"><Pencil size={18} /></span>
            <h2>Rename Player</h2>
          </div>
          {saveError ? <div className="alert alert-error mb-4" role="alert">{saveError}</div> : null}
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

      <div className="glass-panel">
        <div className="section-head">
          <span className="section-icon"><Zap size={18} /></span>
          <h2>Attributes</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Level" value={player.level} />
          <StatCard label="Attack" value={effectiveStats.attack ?? baseStats.attack ?? 0} />
          <StatCard label="Defense" value={effectiveStats.defense ?? baseStats.defense ?? 0} />
          <StatCard label="Stamina" value={effectiveStats.stamina ?? baseStats.stamina ?? 0} />
        </div>

        <div className="flex flex-col gap-4">
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
      </div>

      <div className="glass-panel">
        <div className="section-head">
          <span className="section-icon"><Dumbbell size={18} /></span>
          <h2>Training Ground</h2>
        </div>
        {trainingError ? <div className="alert alert-error mb-4" role="alert">{trainingError}</div> : null}
        <form onSubmit={submitTraining} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="form-group flex-1 mb-0">
            <label className="form-label" htmlFor="training-energy">Energy to spend</label>
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
          <button type="submit" className="btn btn-primary" disabled={trainingLoading}>
            <Dumbbell size={16} />
            {trainingLoading ? 'Training…' : 'Train'}
          </button>
        </form>
        <p className="text-muted text-sm mt-3">
          Training converts energy into XP and can trigger level-ups that improve your base stats.
        </p>
      </div>
    </div>
  )
}
