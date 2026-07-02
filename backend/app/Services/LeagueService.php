<?php

namespace App\Services;

use App\Enums\LeagueStatus;
use App\Enums\MatchStatus;
use App\Events\SeasonEnded;
use App\Exceptions\Game\SeasonAlreadyActiveException;
use App\Models\FootballMatch;
use App\Models\League;
use App\Models\SeasonHistory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LeagueService
{
    public function createLeague(array $data): League
    {
        return League::create([
            'name' => $data['name'],
        ]);
    }

    /**
     * @throws SeasonAlreadyActiveException
     * @throws \DomainException
     */
    public function startSeason(League $league): void
    {
        if ($league->isActive()) {
            throw new SeasonAlreadyActiveException();
        }

        $teams = $league->teams;

        if ($teams->count() < 2) {
            throw new \DomainException('At least 2 teams are required to start a season.');
        }

        DB::transaction(function () use ($league, $teams) {
            $league->update([
                'status'           => LeagueStatus::Active,
                'current_game_day' => 0,
                'started_at'       => now(),
                'ended_at'         => null,
            ]);

            $this->generateSchedule($league, $teams);
        });
    }

    /**
     * Round-robin: each pair plays twice (home + away) across 18 game days.
     */
    public function generateSchedule(League $league, Collection $teams): void
    {
        $teamList = $teams->values()->all();
        $n        = count($teamList);

        // Add a bye team if odd number of teams
        if ($n % 2 !== 0) {
            $teamList[] = null;
            $n++;
        }

        $rounds     = ($n - 1);
        $matchesRec = [];
        $gameDay    = 1;

        // First-half schedule
        for ($round = 0; $round < $rounds; $round++) {
            for ($match = 0; $match < $n / 2; $match++) {
                $home = $teamList[$match];
                $away = $teamList[$n - 1 - $match];

                if ($home !== null && $away !== null) {
                    $matchesRec[] = ['home' => $home, 'away' => $away, 'day' => $gameDay];
                }
            }

            $gameDay++;

            // Rotate array keeping first element fixed
            $last      = array_pop($teamList);
            array_splice($teamList, 1, 0, [$last]);
        }

        // Second-half schedule — reverse home/away
        foreach ($matchesRec as $fixture) {
            $matchesRec[] = [
                'home' => $fixture['away'],
                'away' => $fixture['home'],
                'day'  => $fixture['day'] + $rounds,
            ];
        }

        // Persist
        $baseScheduledAt = now()->startOfDay();
        foreach ($matchesRec as $fixture) {
            FootballMatch::create([
                'league_id'    => $league->id,
                'home_team_id' => $fixture['home']->id,
                'away_team_id' => $fixture['away']->id,
                'game_day'     => $fixture['day'],
                'status'       => MatchStatus::Scheduled,
                'scheduled_at' => $baseScheduledAt->copy()->addDays($fixture['day'] - 1),
            ]);
        }
    }

    public function updateStandings(FootballMatch $match): void
    {
        DB::transaction(function () use ($match) {
            $homeGoals = $match->home_score;
            $awayGoals = $match->away_score;

            $homeTeam = $match->homeTeam;
            $awayTeam = $match->awayTeam;

            if ($homeGoals > $awayGoals) {
                // Home win
                $homeTeam->increment('wins');
                $homeTeam->increment('points', 3);
                $awayTeam->increment('losses');
            } elseif ($awayGoals > $homeGoals) {
                // Away win
                $awayTeam->increment('wins');
                $awayTeam->increment('points', 3);
                $homeTeam->increment('losses');
            } else {
                // Draw
                $homeTeam->increment('draws');
                $homeTeam->increment('points');
                $awayTeam->increment('draws');
                $awayTeam->increment('points');
            }

            $homeTeam->increment('goals_for', $homeGoals);
            $homeTeam->increment('goals_against', $awayGoals);
            $awayTeam->increment('goals_for', $awayGoals);
            $awayTeam->increment('goals_against', $homeGoals);
        });
    }

    public function getStandings(League $league): Collection
    {
        return $league->teams()
            ->orderByDesc('points')
            ->orderByDesc(DB::raw('goals_for - goals_against'))
            ->orderByDesc('goals_for')
            ->get();
    }

    public function endSeason(League $league): void
    {
        DB::transaction(function () use ($league) {
            $standings = $this->getStandings($league);

            foreach ($standings as $position => $team) {
                SeasonHistory::create([
                    'league_id'      => $league->id,
                    'team_id'        => $team->id,
                    'season_number'  => $league->season_number,
                    'final_position' => $position + 1,
                    'points'         => $team->points,
                    'wins'           => $team->wins,
                    'losses'         => $team->losses,
                    'draws'          => $team->draws,
                    'goals_for'      => $team->goals_for,
                    'goals_against'  => $team->goals_against,
                ]);

                $team->resetStandings();
            }

            $league->update([
                'status'        => LeagueStatus::Completed,
                'ended_at'      => now(),
            ]);

            event(new SeasonEnded($league));
        });
    }

    public function resetLeague(League $league): void
    {
        DB::transaction(function () use ($league) {
            // Wipe match data for this league
            $league->matches()->each(function (FootballMatch $match) {
                $match->gamePlays()->get()->each(function ($gamePlay) {
                    $gamePlay->delete();
                });
                $match->delete();
            });

            $league->update([
                'status'           => LeagueStatus::Pending,
                'current_game_day' => 0,
                'season_number'    => $league->season_number + 1,
                'started_at'       => null,
                'ended_at'         => null,
            ]);
        });
    }

    public function advanceGameDay(League $league): void
    {
        if (! $league->isActive()) {
            return;
        }

        if ($league->hasSeasonEnded()) {
            $this->endSeason($league);
            return;
        }

        $league->increment('current_game_day');
        $league->refresh();

        // Schedule matches for the new game day
        FootballMatch::where('league_id', $league->id)
            ->where('game_day', $league->current_game_day)
            ->update(['scheduled_at' => now()]);
    }
}