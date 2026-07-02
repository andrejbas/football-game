import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { gamePlaysApi } from '../api/matches'
import { playerApi } from '../api/player'
import { matchesApi } from '../api/matches'
import { formatDateTime } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

export default function MatchDetailPage() {
  const { id } = useParams()
  const { data: match, error: matchError, mutate: mutateMatch } = useSWR(`/matches/${id}`, () => matchesApi.show(id))
  const { data: plays, error: playsError, mutate: mutatePlays } = useSWR(`/matches/${id}/game-plays`, () => matchesApi.gamePlays(id))
  const { data: player, mutate: mutatePlayer } = useSWR('/player', playerApi.show)
  const [activePlayId, setActivePlayId] = useState(null)
  const [energyByPlay, setEnergyByPlay] = useState({})
  const [submitError, setSubmitError] = useState('')

  const activePlay = useMemo(() => plays?.find((play) => play.status === 'active') ?? null, [plays])
  const myContributions = useMemo(() => {
    if (!plays || !player) return []

    return plays.flatMap((play) =>
      (play.contributions ?? [])
        .filter((contribution) => contribution.player?.id === player.id)
        .map((contribution) => ({
          ...contribution,
          phase_number: play.phase_number,
          winner_side: play.winner_side,
        }))
    )
  }, [plays, player])

  if (matchError) return <ErrorState error="Failed to load match details" />
  if (!match) return <PageLoading label="Loading Match..." />

  const handleEnergyChange = (playId) => (event) => {
    const value = event.target.value
    setEnergyByPlay((current) => ({
      ...current,
      [playId]: value,
    }))
  }

  const handleContribute = async (playId) => {
    const invested = Number(energyByPlay[playId] ?? 0)

    if (!Number.isFinite(invested) || invested < 1) return

    setSubmitError('')
    setActivePlayId(playId)

    try {
      await gamePlaysApi.contribute(playId, invested)
      await Promise.all([mutateMatch(), mutatePlays(), mutatePlayer()])
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.message || 'Unable to contribute to this play.')
    } finally {
      setActivePlayId(null)
    }
  }

  const energyRemaining = player?.energy?.current ?? 0

  return (
    <div className="container main-content animate-fade-in">
      <h1 className="mb-6 text-center">Match Center</h1>

      <div className="glass-panel mb-8 text-center">
        <div className="flex justify-between items-center text-xl md:text-3xl font-bold">
          <div className="flex-1">{match.home_team?.name}</div>
          <div className="px-6 text-primary">
            {match.status === 'completed' ? `${match.score?.home ?? 0} - ${match.score?.away ?? 0}` : 'VS'}
          </div>
          <div className="flex-1">{match.away_team?.name}</div>
        </div>
        <div className="text-muted mt-4 capitalize">Status: {match.status}</div>
        <div className="text-muted text-sm mt-1">Scheduled: {formatDateTime(match.scheduled_at)}</div>
      </div>

      {submitError ? <div className="alert alert-error mb-6" role="alert">{submitError}</div> : null}

      <div className="glass-panel mb-8">
        <h2 className="text-xl font-semibold mb-4 text-primary">Contribute to Active Play</h2>
        {activePlay ? (
          <div className="contribute-form space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold">Phase {activePlay.phase_number}</div>
                <div className="text-sm text-muted capitalize">Status: {activePlay.status}</div>
              </div>
              <div className="text-sm text-muted">
                Points: {activePlay.points?.home ?? 0} - {activePlay.points?.away ?? 0}
              </div>
            </div>

            <form
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
              onSubmit={(event) => {
                event.preventDefault()
                handleContribute(activePlay.id)
              }}
            >
              <div className="form-group flex-1 mb-0">
                <label className="form-label" htmlFor={`energy-${activePlay.id}`}>
                  Energy to invest
                </label>
                <input
                  id={`energy-${activePlay.id}`}
                  type="number"
                  className="form-input"
                  min="1"
                  max={energyRemaining}
                  value={energyByPlay[activePlay.id] ?? 5}
                  onChange={handleEnergyChange(activePlay.id)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={activePlayId === activePlay.id}>
                {activePlayId === activePlay.id ? 'Submitting…' : 'Contribute Energy'}
              </button>
            </form>

            <p className="text-sm text-muted">
              Available energy: {energyRemaining}. Your team must be part of this match to contribute.
            </p>
          </div>
        ) : (
          <EmptyState
            title="No active game play"
            desc="Wait for the current phase to become active before contributing energy."
          />
        )}
      </div>

      <div className="glass-panel">
        <h2 className="text-xl font-semibold mb-4 text-primary">Game Plays</h2>
        {playsError ? (
          <ErrorState error="Failed to load game plays" />
        ) : !plays ? (
          <div>Loading plays...</div>
        ) : (
          <ul className="space-y-3">
            {plays.map((play) => (
              <li key={play.id} className="p-4 bg-slate-800/50 rounded border border-white/5 flex flex-col gap-3">
                <div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="font-semibold text-primary">Phase {play.phase_number}</span>
                      <span className="text-muted ml-2 text-sm capitalize">Status: {play.status}</span>
                    </div>
                    <div className="text-sm text-muted">
                      Winner: {play.winner_side || 'pending'}
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  Team points: Home {play.points?.home ?? 0} | Away {play.points?.away ?? 0}
                </div>
                <div className="text-sm text-muted">
                  Contributions: {play.contributions?.length ?? 0}
                </div>
                {play.contributions?.length ? (
                  <ul className="space-y-2 text-sm">
                    {play.contributions.map((contribution) => (
                      <li key={contribution.id} className="p-3 rounded bg-black/20 border border-white/5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                          {contribution.player?.name || contribution.player?.user?.name || 'Unknown'} invested {contribution.energy_invested} energy
                        </span>
                        <span className="text-muted">+{contribution.points_contributed} points</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted">No contributions recorded yet.</div>
                )}
                <div className="text-xs text-muted">
                  Started: {formatDateTime(play.started_at)} | Finished: {formatDateTime(play.finished_at)}
                </div>
              </li>
            ))}
            {plays.length === 0 && <div className="text-muted">No game plays recorded yet.</div>}
          </ul>
        )}
      </div>

      <div className="glass-panel mt-8">
        <h2 className="text-xl font-semibold mb-4 text-primary">My Contributions</h2>
        {myContributions.length ? (
          <ul className="space-y-3">
            {myContributions.map((contribution) => (
              <li key={contribution.id} className="p-4 bg-slate-800/50 rounded border border-white/5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold">Phase {contribution.phase_number}</div>
                  <div className="text-sm text-muted capitalize">Winner: {contribution.winner_side || 'pending'}</div>
                </div>
                <div className="text-sm text-muted">
                  Invested {contribution.energy_invested} energy for +{contribution.points_contributed} points
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No contributions yet"
            desc="Use the active play panel above to invest energy into this match."
          />
        )}
      </div>
    </div>
  )
}
