<?php

namespace App\Jobs;

use App\Enums\MatchStatus;
use App\Models\FootballMatch;
use App\Models\League;
use App\Services\LeagueService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AdvanceGameDayJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function handle(LeagueService $service): void
    {
        $leagues = League::active()->get();

        foreach ($leagues as $league) {
            // Only advance when all matches on the current game day are done
            $currentDay     = $league->current_game_day;
            $pendingMatches = FootballMatch::where('league_id', $league->id)
                ->where('game_day', $currentDay)
                ->whereIn('status', [MatchStatus::Scheduled->value, MatchStatus::InProgress->value])
                ->count();

            if ($pendingMatches > 0) {
                Log::info('AdvanceGameDayJob: waiting for current game day to finish.', [
                    'league_id'       => $league->id,
                    'game_day'        => $currentDay,
                    'pending_matches' => $pendingMatches,
                ]);
                continue;
            }

            try {
                $service->advanceGameDay($league);
                $league->refresh();

                // Dispatch SimulateMatchJob for every match on the new game day
                $newDay = $league->current_game_day;
                FootballMatch::where('league_id', $league->id)
                    ->where('game_day', $newDay)
                    ->where('status', MatchStatus::Scheduled->value)
                    ->each(function (FootballMatch $match) {
                        SimulateMatchJob::dispatch($match->id)->onQueue('simulation');
                    });

                Log::info('AdvanceGameDayJob: advanced to game day.', [
                    'league_id' => $league->id,
                    'game_day'  => $newDay,
                ]);
            } catch (\Throwable $e) {
                Log::error('AdvanceGameDayJob failed', [
                    'league_id' => $league->id,
                    'error'     => $e->getMessage(),
                ]);
            }
        }
    }
}