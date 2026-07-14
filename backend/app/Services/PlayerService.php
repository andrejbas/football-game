<?php

namespace App\Services;

use App\Events\PlayerLevelUp;
use App\Exceptions\Game\InsufficientEnergyException;
use App\Models\Player;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PlayerService
{
    // XP required scales per level: level * 100
    private const BASE_XP_PER_LEVEL = 100;

    // Stat points granted per level-up
    private const STAT_POINTS_PER_LEVEL = 2;

    public function createPlayerProfile(User $user, array $data): Player
    {
        return Player::create([
            'user_id' => $user->id,
            'name'    => $data['name'] ?? $user->name,
        ]);
    }

    /**
     * Returns all effective stats (base + equipment bonuses).
     */
    public function getEffectiveStats(Player $player): array
    {
        $player->loadMissing('equippedItems');

        return [
            'attack'    => $player->effective_attack,
            'defense'   => $player->effective_defense,
            'stamina'   => $player->effective_stamina,
            'speed'     => $player->effective_speed,
            'technique' => $player->effective_technique,
        ];
    }

    public function addXP(Player $player, int $amount): void
    {
        DB::transaction(function () use ($player, $amount) {
            $player->increment('xp', $amount);
            $player->refresh();

            while ($player->needsLevelUp()) {
                $this->levelUp($player);
                $player->refresh();
            }
        });
    }

    /**
     * Spend energy on training and gain XP.
     *
     * Training follows the same energy-to-XP loop as other gameplay actions,
     * but without involving a match.
     *
     * @throws InsufficientEnergyException
     */
    public function train(Player $player, int $energyInvested): void
    {
        if (! $player->hasEnoughEnergy($energyInvested)) {
            throw new InsufficientEnergyException($energyInvested, $player->energy_current);
        }

        DB::transaction(function () use ($player, $energyInvested) {
            $player->deductEnergy($energyInvested);

            $xpGained = $energyInvested * 3;
            $this->addXP($player, $xpGained);
        });
    }

    private function levelUp(Player $player): void
    {
        $newLevel    = $player->level + 1;
        $xpCarryover = $player->xp - $player->xp_to_next_level;

        $player->update([
            'level'            => $newLevel,
            'xp'               => max(0, $xpCarryover),
            'xp_to_next_level' => $newLevel * self::BASE_XP_PER_LEVEL,

            // Distribute flat stat gains
            'attack'    => $player->attack + self::STAT_POINTS_PER_LEVEL,
            'defense'   => $player->defense + self::STAT_POINTS_PER_LEVEL,
            'stamina'   => $player->stamina + self::STAT_POINTS_PER_LEVEL,
            'speed'     => $player->speed + self::STAT_POINTS_PER_LEVEL,
            'technique' => $player->technique + self::STAT_POINTS_PER_LEVEL,

            // Increase max energy on level up
            'energy_max'     => $player->energy_max + 10,
            'energy_current' => $player->energy_max + 10, // refill on level-up
        ]);

        event(new PlayerLevelUp($player, $newLevel));
    }

    /**
     * Compute points contributed to a GamePlay.
     * Formula: energyInvested × (attack + technique + speed) / 30
     * Capped by stamina factor to prevent unbounded scaling.
     */
    public function computeGamePlayPoints(Player $player, int $energyInvested): int
    {
        $attackPower   = $player->effective_attack + $player->effective_technique + $player->effective_speed;
        $staminaFactor = 1 + ($player->effective_stamina / 100);    // stamina gives up to +100% multiplier
        $raw           = ($energyInvested * $attackPower / 30) * $staminaFactor;

        return (int) round($raw);
    }

    /**
     * Regenerate energy by one tick (used by scheduler / regen events).
     */
    public function regenerateEnergy(Player $player): void
    {
        $newEnergy = min(
            $player->energy_current + $player->energy_regen_rate,
            $player->energy_max
        );

        $player->update(['energy_current' => $newEnergy]);
    }

    /**
     * Bulk-reset all players to full energy (daily reset).
     */
    public function resetDailyEnergy(): void
    {
        DB::statement('UPDATE players SET energy_current = energy_max');
    }
}