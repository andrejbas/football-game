<?php

namespace App\Listeners;

use App\Events\SeasonEnded;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class ArchiveSeasonData implements ShouldQueue
{
    public string $queue = 'default';

    public function handle(SeasonEnded $event): void
    {
        $league = $event->league;

        Log::channel('game')->info('Season ended and archived', [
            'league_id'     => $league->id,
            'season_number' => $league->season_number,
            'ended_at'      => $league->ended_at,
        ]);
    }
}