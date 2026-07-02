<?php

namespace App\Services;

use App\Enums\GamePlayStatus;
use App\Enums\MatchStatus;
use App\Enums\WinnerSide;
use App\Events\GamePlayFinished;
use App\Events\MatchFinished;
use App\Events\MatchStarted;
use App\Exceptions\Game\GamePlayNotActiveException;
use App\Exceptions\Game\InsufficientEnergyException;
use App\Exceptions\Game\MatchNotScheduledException;
use App\Jobs\DistributeRewardsJob;
use App\Jobs\ProcessGamePlayJob;
use App\Models\FootballMatch;
use App\Models\GamePlay;
use App\Models\GamePlayContribution;
use App\Models\Player;
use Illuminate\Support\Facades\DB;

class MatchSimulationService
{
    public function __construct(
        private readonly PlayerService $playerService,
        private readonly LeagueService $leagueService,
    ) {}

    /**
     * @throws MatchNotScheduledException
     */
    public function startMatch(FootballMatch $match): void
    {
        if (! $match->isScheduled()) {
            throw new MatchNotScheduledException();
        }

        DB::transaction(function () use ($match) {
            $match->update([
                'status'     => MatchStatus::InProgress,
                'started_at' => now(),
            ]);

            // Create all 11 GamePlay phases upfront
            for ($phase = 1; $phase <= 11; $phase++) {
                GamePlay::create([
                    'match_id'     => $match->id,
                    'phase_number' => $phase,
                    'status'       => GamePlayStatus::Pending,
                ]);
            }

            // Activate phase 1
            $firstPhase = GamePlay::where('match_id', $match->id)
                ->where('phase_number', 1)
                ->firstOrFail();

            $firstPhase->update([
                'status'     => GamePlayStatus::Active,
                'started_at' => now(),
            ]);
        });

        event(new MatchStarted($match));

        // Dispatch phase 1 resolution job after 3 minutes
        $firstPhase = GamePlay::where('match_id', $match->id)
            ->where('phase_number', 1)
            ->firstOrFail();

        ProcessGamePlayJob::dispatch($firstPhase->id)
            ->delay(now()->addMinutes(3))
            ->onQueue('simulation');
    }

    public function simulateGamePlay(GamePlay $gamePlay): void
    {
        $gamePlay->loadMissing('match');
        $match = $gamePlay->match;

        DB::transaction(function () use ($gamePlay, $match) {
            // Aggregate points per team from contributions
            $homePoints = GamePlayContribution::where('game_play_id', $gamePlay->id)
                ->where('team_id', $match->home_team_id)
                ->sum('points_contributed');

            $awayPoints = GamePlayContribution::where('game_play_id', $gamePlay->id)
                ->where('team_id', $match->away_team_id)
                ->sum('points_contributed');

            $winnerSide = $this->determineWinner((int) $homePoints, (int) $awayPoints);

            $gamePlay->update([
                'home_team_points' => $homePoints,
                'away_team_points' => $awayPoints,
                'winner_side'      => $winnerSide,
                'status'           => GamePlayStatus::Completed,
                'finished_at'      => now(),
            ]);

            // Score a goal for the winning side
            if ($winnerSide === WinnerSide::Home) {
                $match->increment('home_score');
            } elseif ($winnerSide === WinnerSide::Away) {
                $match->increment('away_score');
            }
        });

        $gamePlay->refresh();
        event(new GamePlayFinished($gamePlay));

        // Chain next phase or finalize match
        if ($gamePlay->isLastPhase()) {
            $match->refresh();
            $this->finalizeMatch($match);
        } else {
            $this->activateNextPhase($gamePlay, $match);
        }
    }

    public function finalizeMatch(FootballMatch $match): void
    {
        $match->update([
            'status'      => MatchStatus::Completed,
            'finished_at' => now(),
        ]);

        $this->leagueService->updateStandings($match);

        event(new MatchFinished($match));

        DistributeRewardsJob::dispatch($match->id)->onQueue('rewards');
    }

    /**
     * @throws GamePlayNotActiveException
     * @throws InsufficientEnergyException
     * @throws \DomainException
     */
    public function contributeToGamePlay(
        Player $player,
        GamePlay $gamePlay,
        int $energyInvested
    ): GamePlayContribution {
        if (! $gamePlay->isActive()) {
            throw new GamePlayNotActiveException();
        }

        if (! $player->hasEnoughEnergy($energyInvested)) {
            throw new InsufficientEnergyException($energyInvested, $player->energy_current);
        }

        $gamePlay->loadMissing('match');
        $match = $gamePlay->match;

        $team = $player->team;
        if (! $team || ! $match->involvesTeam($team)) {
            throw new \DomainException('Your team is not participating in this match.');
        }

        return DB::transaction(function () use ($player, $gamePlay, $match, $energyInvested) {
            $player->deductEnergy($energyInvested);

            $points = $this->playerService->computeGamePlayPoints($player, $energyInvested);

            return GamePlayContribution::create([
                'game_play_id'       => $gamePlay->id,
                'player_id'          => $player->id,
                'team_id'            => $player->team_id,
                'energy_invested'    => $energyInvested,
                'points_contributed' => $points,
            ]);
        });
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    private function determineWinner(int $homePoints, int $awayPoints): WinnerSide
    {
        if ($homePoints > $awayPoints) {
            return WinnerSide::Home;
        }
        if ($awayPoints > $homePoints) {
            return WinnerSide::Away;
        }

        return WinnerSide::Draw;
    }

    private function activateNextPhase(GamePlay $current, FootballMatch $match): void
    {
        $nextPhase = GamePlay::where('match_id', $match->id)
            ->where('phase_number', $current->phase_number + 1)
            ->firstOrFail();

        $nextPhase->update([
            'status'     => GamePlayStatus::Active,
            'started_at' => now(),
        ]);

        ProcessGamePlayJob::dispatch($nextPhase->id)
            ->delay(now()->addMinutes(3))
            ->onQueue('simulation');
    }
}