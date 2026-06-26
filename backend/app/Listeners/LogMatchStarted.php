<?php

namespace App\Listeners;

use App\Events\MatchStarted;
use Illuminate\Support\Facades\Log;

class LogMatchStarted
{
    public function handle(MatchStarted $event): void
    {
        Log::channel('game')->info('Match started', [
            'match_id'     => $event->match->id,
            'home_team'    => $event->match->home_team_id,
            'away_team'    => $event->match->away_team_id,
            'league_id'    => $event->match->league_id,
            'game_day'     => $event->match->game_day,
            'started_at'   => $event->match->started_at,
        ]);
    }
}