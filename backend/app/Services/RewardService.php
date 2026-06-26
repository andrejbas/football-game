<?php

namespace App\Services;

use App\Enums\Rarity;
use App\Enums\RewardType;
use App\Models\Equipment;
use App\Models\FootballMatch;
use App\Models\GamePlay;
use App\Models\GamePlayContribution;
use App\Models\Player;
use App\Models\Reward;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RewardService
{
    // XP rewarded per energy point invested in a match
    private const XP_PER_ENERGY = 2;

    // Drop chance (out of 100) that a player receives equipment per GamePlay
    private const EQUIPMENT_DROP_CHANCE = 30;

    public function __construct(
        private readonly PlayerService   $playerService,
        private readonly EquipmentService $equipmentService,
    ) {}

    public function distributeMatchRewards(FootballMatch $match): void
    {
        // Load contributions grouped by player
        $contributions = GamePlayContribution::where(function ($q) use ($match) {
            $q->whereHas('gamePlay', fn ($q2) => $q2->where('match_id', $match->id));
        })->with(['player', 'gamePlay'])->get();

        $playerContributions = $contributions->groupBy('player_id');

        foreach ($playerContributions as $playerId => $playerConts) {
            try {
                $player = $playerConts->first()->player;

                $this->distributeXP($player, $match, $playerConts);

                // Roll equipment drop per GamePlay the player contributed to
                $playedGamePlays = $playerConts->pluck('gamePlay')->unique('id');
                foreach ($playedGamePlays as $gamePlay) {
                    $this->rollEquipmentDrop($player, $match, $gamePlay);
                }
            } catch (\Throwable $e) {
                Log::error('Reward distribution failed', [
                    'player_id' => $playerId,
                    'match_id'  => $match->id,
                    'error'     => $e->getMessage(),
                ]);
            }
        }
    }

    public function distributeXP(Player $player, FootballMatch $match, Collection $contributions): void
    {
        $totalEnergy = $contributions->sum('energy_invested');
        $xpAmount    = $totalEnergy * self::XP_PER_ENERGY;

        if ($xpAmount <= 0) {
            return;
        }

        DB::transaction(function () use ($player, $match, $xpAmount) {
            $this->playerService->addXP($player, $xpAmount);

            Reward::create([
                'player_id' => $player->id,
                'match_id'  => $match->id,
                'type'      => RewardType::XP,
                'xp_amount' => $xpAmount,
            ]);
        });
    }

    public function rollEquipmentDrop(Player $player, FootballMatch $match, GamePlay $gamePlay): void
    {
        if (random_int(1, 100) > self::EQUIPMENT_DROP_CHANCE) {
            return; // No drop this GamePlay
        }

        $rarity    = $this->rollRarity();
        $slots     = ['boots', 'shorts', 'jersey', 'socks', 'charm'];
        $slot      = $slots[array_rand($slots)];

        DB::transaction(function () use ($player, $match, $gamePlay, $slot, $rarity) {
            $equipment = $this->equipmentService->createEquipment($player, $slot, $rarity);

            Reward::create([
                'player_id'    => $player->id,
                'match_id'     => $match->id,
                'game_play_id' => $gamePlay->id,
                'type'         => RewardType::Equipment,
                'equipment_id' => $equipment->id,
            ]);
        });
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    /**
     * Weighted random rarity roll.
     * Q1: 60, Q2: 25, Q3: 10, Q4: 4, Q5: 1 (total: 100)
     */
    private function rollRarity(): Rarity
    {
        $roll = random_int(1, 100);

        return match(true) {
            $roll <= 60  => Rarity::Q1,
            $roll <= 85  => Rarity::Q2,
            $roll <= 95  => Rarity::Q3,
            $roll <= 99  => Rarity::Q4,
            default      => Rarity::Q5,
        };
    }
}