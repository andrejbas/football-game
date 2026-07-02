import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { playerApi } from '../api/player'
import { apiErrorMessage } from '../lib/format'
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
    <div className="container main-content animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="mb-0">Player Profile</h1>
          <p className="text-muted text-sm mt-1">Track your footballer, train, and grow into a stronger club asset.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditOpen((open) => !open)}>
          {editOpen ? 'Close' : 'Edit Name'}
        </button>
      </div>
      
      <div className="glass-panel mb-6">
        <h2 className="text-xl font-semibold mb-4 text-primary">{player.name || 'Player'}</h2>

        {editOpen ? (
          <form onSubmit={submitRename} className="mb-6 space-y-4">
            {saveError ? (
              <div className="alert alert-error" role="alert">
                {saveError}
              </div>
            ) : null}
            <div className="form-group mb-0">
              <label className="form-label" htmlFor="player-name">
                Player name
              </label>
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
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Level" value={player.level} />
          <StatCard label="Attack" value={effectiveStats.attack ?? baseStats.attack ?? 0} />
          <StatCard label="Defense" value={effectiveStats.defense ?? baseStats.defense ?? 0} />
          <StatCard label="Stamina" value={effectiveStats.stamina ?? baseStats.stamina ?? 0} />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted">Energy</span>
              <span>{energy} / {maxEnergy}</span>
            </div>
            <ProgressBar pct={player.energy?.pct ?? 0} variant="energy" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted">Experience</span>
              <span>{xpCurrent} / {xpToNextLevel} XP</span>
            </div>
            <ProgressBar pct={xpPct} variant="xp" />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5">
          <h3 className="text-lg font-semibold mb-3 text-primary">Training</h3>
          {trainingError ? (
            <div className="alert alert-error mb-4" role="alert">
              {trainingError}
            </div>
          ) : null}
          <form onSubmit={submitTraining} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="form-group flex-1 mb-0">
              <label className="form-label" htmlFor="training-energy">
                Energy to spend
              </label>
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
              {trainingLoading ? 'Training…' : 'Train'}
            </button>
          </form>
          <p className="text-muted text-sm mt-3">Training converts energy into XP and can trigger level-ups that improve your base stats.</p>
        </div>
      </div>
    </div>
  )
}
