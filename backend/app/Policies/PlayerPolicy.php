<?php

namespace App\Policies;

use App\Models\Player;
use App\Models\User;

class PlayerPolicy
{
    public function view(User $user, Player $player): bool
    {
        return $user->player?->id === $player->id || $user->isAdmin();
    }

    public function update(User $user, Player $player): bool
    {
        return $user->player?->id === $player->id;
    }
}