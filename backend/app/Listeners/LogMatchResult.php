<?php

namespace App\Listeners;

use App\Events\MatchFinished;
use Illuminate\Support\Facades\Log;

class LogMatchResult
{
    public function handle(MatchFinished $event): void
    {
        $match = $event->match;

        Log::channel('game')->info('Match finished', [
            'match_id'    => $match->id,
            'home_team'   => $match->home_team_id,
            'away_team'   => $match->away_team_id,
            'home_score'  => $match->home_score,
            'away_score'  => $match->away_score,
            'finished_at' => $match->finished_at,
        ]);
    }
}