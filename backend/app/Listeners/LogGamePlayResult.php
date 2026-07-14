<?php

namespace App\Listeners;

use App\Events\GamePlayFinished;
use Illuminate\Support\Facades\Log;

class LogGamePlayResult
{
    public function handle(GamePlayFinished $event): void
    {
        $gp = $event->gamePlay;

        Log::channel('game')->info('GamePlay resolved', [
            'game_play_id'     => $gp->id,
            'match_id'         => $gp->match_id,
            'phase_number'     => $gp->phase_number,
            'home_team_points' => $gp->home_team_points,
            'away_team_points' => $gp->away_team_points,
            'winner_side'      => $gp->winner_side,
        ]);
    }
}