import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { Swords, Flame, ListChecks, UserCheck } from 'lucide-react'
import { gamePlaysApi, matchesApi } from '../api/matches'
import { playerApi } from '../api/player'
import { formatDateTime, crest, statusPillClass } from '../lib/format'
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
    setEnergyByPlay((current) => ({ ...current, [playId]: value }))
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
  const isDone = match.status === 'completed'

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="pitch-hero">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="eyebrow flex items-center gap-2">
            <Swords size={14} />
            Match Center
          </span>
        </div>

        <div className="scoreboard">
          <div className="side">
            <span className="team-crest">{crest(match.home_team?.name)}</span>
            <span className="club">{match.home_team?.name ?? 'TBD'}</span>
          </div>
          <div className="center">
            {isDone ? (
              <span className="board-score">
                {match.score?.home ?? 0}<span className="text-muted"> : </span>{match.score?.away ?? 0}
              </span>
            ) : (
              <span className="board-vs">VS</span>
            )}
            <span className={`status-pill ${statusPillClass(match.status)}`}>{match.status}</span>
          </div>
          <div className="side">
            <span className="team-crest">{crest(match.away_team?.name)}</span>
            <span className="club">{match.away_team?.name ?? 'TBD'}</span>
          </div>
        </div>

        <div className="text-center text-sm text-muted mt-4">Kickoff: {formatDateTime(match.scheduled_at)}</div>
      </div>

      {submitError ? <div className="alert alert-error" role="alert">{submitError}</div> : null}

      <div className="glass-panel">
        <div className="section-head">
          <span className="section-icon"><Flame size={18} /></span>
          <h2>Active Play</h2>
        </div>
        {activePlay ? (
          <div className="flex flex-col gap-4">
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Phase</div>
                <div className="info-value">{activePlay.phase_number}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Status</div>
                <div className="info-value capitalize">{activePlay.status}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Points (H / A)</div>
                <div className="info-value">{activePlay.points?.home ?? 0} - {activePlay.points?.away ?? 0}</div>
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
                <label className="form-label" htmlFor={`energy-${activePlay.id}`}>Energy to invest</label>
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
                <Flame size={16} />
                {activePlayId === activePlay.id ? 'Submitting…' : 'Contribute'}
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
        <div className="section-head">
          <span className="section-icon"><ListChecks size={18} /></span>
          <h2>Game Plays</h2>
        </div>
        {playsError ? (
          <ErrorState error="Failed to load game plays" />
        ) : !plays ? (
          <EmptyState title="Loading plays…" desc="Fetching the match timeline." />
        ) : plays.length === 0 ? (
          <EmptyState title="No game plays yet" desc="No game plays have been recorded for this match." />
        ) : (
          <div className="data-list">
            {plays.map((play) => (
              <div key={play.id} className="data-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="chip chip-accent">Phase {play.phase_number}</span>
                    <span className="chip capitalize">{play.status}</span>
                  </div>
                  <span className="text-sm text-muted">Winner: {play.winner_side || 'pending'}</span>
                </div>
                <div className="text-sm">
                  Team points — Home <strong>{play.points?.home ?? 0}</strong> · Away <strong>{play.points?.away ?? 0}</strong>
                </div>
                {play.contributions?.length ? (
                  <div className="data-list">
                    {play.contributions.map((contribution) => (
                      <div key={contribution.id} className="flex items-center justify-between gap-2 text-sm" style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                        <span>
                          {contribution.player?.name || contribution.player?.user?.name || 'Unknown'} · {contribution.energy_invested} energy
                        </span>
                        <span className="text-success">+{contribution.points_contributed} pts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted">No contributions recorded yet.</div>
                )}
                <div className="text-xs text-muted">
                  Started {formatDateTime(play.started_at)} · Finished {formatDateTime(play.finished_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel">
        <div className="section-head">
          <span className="section-icon"><UserCheck size={18} /></span>
          <h2>My Contributions</h2>
        </div>
        {myContributions.length ? (
          <div className="data-list">
            {myContributions.map((contribution) => (
              <div key={contribution.id} className="data-row">
                <div className="data-main">
                  <span className="chip chip-accent">Phase {contribution.phase_number}</span>
                  <span className="text-sm text-muted">Winner: {contribution.winner_side || 'pending'}</span>
                </div>
                <span className="text-sm">
                  {contribution.energy_invested} energy · <span className="text-success">+{contribution.points_contributed} pts</span>
                </span>
              </div>
            ))}
          </div>
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
