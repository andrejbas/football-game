<?php

namespace App\Listeners;

use App\Enums\RewardType;
use App\Events\PlayerLevelUp;
use App\Models\Reward;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class GrantLevelUpReward implements ShouldQueue
{
    public string $queue = 'rewards';

    public function handle(PlayerLevelUp $event): void
    {
        $player   = $event->player;
        $newLevel = $event->newLevel;

        // Every 5 levels → grant a full energy refill reward record
        if ($newLevel % 5 === 0) {
            $energyBonus = 50;

            $player->update([
                'energy_current' => min(
                    $player->energy_current + $energyBonus,
                    $player->energy_max
                ),
            ]);

            Log::channel('game')->info('Level-up energy bonus granted', [
                'player_id'    => $player->id,
                'new_level'    => $newLevel,
                'energy_bonus' => $energyBonus,
            ]);
        }
    }
}