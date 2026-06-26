<?php

namespace App\Jobs;

use App\Models\FootballMatch;
use App\Models\League;
use App\Services\LeagueService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class EndSeasonJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function handle(LeagueService $service): void
    {
        $leagues = League::active()
            ->where('current_game_day', '>=', 18)
            ->get();

        foreach ($leagues as $league) {
            // Only end if all matches are completed
            $pendingMatches = FootballMatch::where('league_id', $league->id)
                ->whereIn('status', ['scheduled', 'in_progress'])
                ->count();

            if ($pendingMatches > 0) {
                Log::info('EndSeasonJob: league still has pending matches.', [
                    'league_id'       => $league->id,
                    'pending_matches' => $pendingMatches,
                ]);
                continue;
            }

            try {
                $service->endSeason($league);

                Log::info('EndSeasonJob: season ended.', [
                    'league_id'     => $league->id,
                    'season_number' => $league->season_number,
                ]);
            } catch (\Throwable $e) {
                Log::error('EndSeasonJob failed for league', [
                    'league_id' => $league->id,
                    'error'     => $e->getMessage(),
                ]);
            }
        }
    }
}