<?php

namespace App\Policies;

use App\Models\GamePlay;
use App\Models\User;

class GamePlayPolicy
{
    public function contribute(User $user, GamePlay $gamePlay): bool
    {
        $player = $user->player;

        if (! $player || ! $player->team_id) {
            return false;
        }

        $gamePlay->loadMissing('match');
        $match = $gamePlay->match;

        return $match->home_team_id === $player->team_id
            || $match->away_team_id === $player->team_id;
    }
}