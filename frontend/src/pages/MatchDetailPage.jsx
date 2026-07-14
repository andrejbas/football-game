import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import {
  Swords,
  Flame,
  ListChecks,
  UserCheck,
  Trophy,
  Shield,
  Zap,
  Target
} from 'lucide-react'

import { gamePlaysApi, matchesApi } from '../api/matches'
import { playerApi } from '../api/player'
import { formatDateTime, crest, statusPillClass } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'
import { toast } from '../store/toastStore'


function TeamCard({ team, side }) {
  return (
    <Link
      to={`/teams/${team?.id}`}
      className="flex flex-col items-center gap-2 hover:scale-105 transition"
    >
      <span className="team-crest" style={{
        width: 70,
        height: 70,
        fontSize: 22
      }}>
        {crest(team?.name)}
      </span>

      <span className="font-semibold text-center">
        {team?.name ?? 'TBD'}
      </span>

      <span className="chip">
        {side}
      </span>
    </Link>
  )
}


function PlayerLink({ player }) {
  if (!player) return 'Unknown'

  return (
    <Link
      to={`/players/${player.id}`}
      className="hover:text-accent transition"
    >
      {player.name}
    </Link>
  )
}


export default function MatchDetailPage() {
  const { id } = useParams()

  const {
    data: match,
    error: matchError,
    mutate: mutateMatch
  } = useSWR(
    `/matches/${id}`,
    () => matchesApi.show(id)
  )


  const {
    data: plays,
    error: playsError,
    mutate: mutatePlays
  } = useSWR(
    `/matches/${id}/game-plays`,
    () => matchesApi.gamePlays(id)
  )


  const {
    data: player,
    mutate: mutatePlayer
  } = useSWR(
    '/player',
    playerApi.show
  )


  const [energy, setEnergy] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  const activePlay = useMemo(
    () => plays?.find(p => p.status === 'active'),
    [plays]
  )


  const winner = useMemo(() => {

    if (!match?.score)
      return null

    if (match.score.home > match.score.away)
      return match.home_team

    if (match.score.away > match.score.home)
      return match.away_team

    return null

  }, [match])


  const handleContribution = async () => {

    if (!activePlay)
      return


    setLoading(true)
    setError('')


    try {

      await gamePlaysApi.contribute(
        activePlay.id,
        Number(energy)
      )


      await Promise.all([
        mutateMatch(),
        mutatePlays(),
        mutatePlayer()
      ])


      toast.success(
        'Contribution sent',
        `${energy} energy invested`
      )


    } catch (err) {

      const msg =
        err?.response?.data?.message ||
        'Failed to contribute'

      setError(msg)

      toast.error(
        'Error',
        msg
      )

    }
    finally {
      setLoading(false)
    }
  }



  if (matchError)
    return <ErrorState error="Failed loading match" />


  if (!match)
    return <PageLoading label="Loading match..." />



  return (

    <div className="animate-fade-in flex flex-col gap-6">


      {/* SCOREBOARD */}

      <div className="pitch-hero">


        <div className="flex justify-center mb-4">

          <span className="eyebrow flex gap-2 items-center">
            <Swords size={15}/>
            Match Center
          </span>

        </div>



        <div className="scoreboard">


          <TeamCard
            team={match.home_team}
            side="HOME"
          />



          <div className="center">


            <div className="board-score">

              {match.score.home}

              <span className="text-muted">
                :
              </span>

              {match.score.away}

            </div>



            <span
              className={`status-pill ${statusPillClass(match.status)}`}
            >
              {match.status}
            </span>



            <div className="text-sm text-muted mt-2">
              Matchday {match.game_day}
            </div>


          </div>



          <TeamCard
            team={match.away_team}
            side="AWAY"
          />


        </div>



        <div className="text-center mt-5">

          {winner ? (

            <div className="chip chip-accent">
              <Trophy size={14}/>
              Winner: {winner.name}
            </div>

          ) : (

            <div className="chip">
              Draw / Pending
            </div>

          )}

        </div>


      </div>




      {/* ACTIVE PLAY */}


      <div className="glass-panel">


        <div className="section-head">

          <span className="section-icon">
            <Flame size={18}/>
          </span>

          <h2>
            Active Battle
          </h2>

        </div>



        {activePlay ? (

          <div className="flex flex-col gap-5">


            <div className="info-grid">


              <div className="info-item">

                <div className="info-label">
                  Phase
                </div>

                <div className="info-value">
                  {activePlay.phase_number}
                </div>

              </div>



              <div className="info-item">

                <div className="info-label">
                  Home points
                </div>

                <div className="info-value">
                  {activePlay.points.home}
                </div>

              </div>



              <div className="info-item">

                <div className="info-label">
                  Away points
                </div>

                <div className="info-value">
                  {activePlay.points.away}
                </div>

              </div>


            </div>




            <div>

              <div className="flex justify-between text-sm mb-2">

                <span>
                  {match.home_team.name}
                </span>

                <span>
                  {match.away_team.name}
                </span>

              </div>


              <div className="w-full bg-black/30 rounded h-4 overflow-hidden">

                <div
                  className="bg-green-500 h-full"
                  style={{
                    width:
                      `${
                        (activePlay.points.home /
                        (
                          activePlay.points.home +
                          activePlay.points.away || 1
                        )) * 100
                      }%`
                  }}
                />

              </div>


            </div>




            <div className="flex gap-3 items-end">


              <div className="form-group flex-1">

                <label className="form-label">
                  <Zap size={14}/>
                  Energy
                </label>


                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max={player?.energy?.current ?? 0}
                  value={energy}
                  onChange={
                    e => setEnergy(e.target.value)
                  }
                />

              </div>



              <button
                className="btn btn-primary"
                disabled={loading}
                onClick={handleContribution}
              >

                {loading
                  ? 'Sending...'
                  : 'Contribute'}

              </button>


            </div>


          </div>


        ) : (


          <EmptyState
            title="No active phase"
            desc="Waiting for the next battle phase."
          />


        )}


      </div>





      {/* GAME TIMELINE */}



      <div className="glass-panel">


        <div className="section-head">

          <span className="section-icon">
            <ListChecks size={18}/>
          </span>

          <h2>
            Match Timeline
          </h2>

        </div>



        {playsError ? (

          <ErrorState error="Failed loading plays"/>


        ) : !plays ? (

          <PageLoading/>


        ) : plays.length === 0 ? (

          <EmptyState title="No phases yet"/>


        ) : (


          <div className="flex flex-col gap-4">


          {plays.map(play => (


            <div
              key={play.id}
              className="data-row"
            >


              <div className="flex justify-between">


                <span className="chip chip-accent">

                  Phase {play.phase_number}

                </span>



                <span>

                  Winner:
                  {' '}
                  {play.winner_side ?? 'pending'}

                </span>


              </div>



              <div className="text-sm">

                Points:

                {' '}

                <strong>
                  {play.points.home}
                </strong>

                {' - '}

                <strong>
                  {play.points.away}
                </strong>

              </div>




              {play.contributions?.length > 0 && (

                <div className="flex flex-col gap-2">


                  {play.contributions
                    .sort(
                      (a,b)=>
                      b.points_contributed -
                      a.points_contributed
                    )
                    .map(c => (


                    <div
                      key={c.id}
                      className="flex justify-between text-sm"
                    >

                      <span>

                        <PlayerLink player={c.player}/>

                        {' '}
                        ⚡ {c.energy_invested}

                      </span>



                      <span className="text-success">

                        +{c.points_contributed}

                      </span>


                    </div>


                  ))}


                </div>

              )}


              <div className="text-xs text-muted">

                Started:
                {' '}
                {formatDateTime(play.started_at)}

              </div>


            </div>


          ))}


          </div>


        )}


      </div>



    </div>

  )
}