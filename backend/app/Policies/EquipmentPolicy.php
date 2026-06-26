<?php

namespace App\Policies;

use App\Models\Equipment;
use App\Models\User;

class EquipmentPolicy
{
    public function view(User $user, Equipment $equipment): bool
    {
        return $user->player?->id === $equipment->owner_player_id
            || $user->isAdmin();
    }

    public function manage(User $user, Equipment $equipment): bool
    {
        return $user->player?->id === $equipment->owner_player_id;
    }
}