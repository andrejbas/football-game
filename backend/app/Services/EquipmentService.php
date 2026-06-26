<?php

namespace App\Services;

use App\Enums\EquipmentSlot;
use App\Enums\Rarity;
use App\Exceptions\Game\InvalidMergeException;
use App\Exceptions\Game\MaxRarityReachedException;
use App\Models\Equipment;
use App\Models\Player;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EquipmentService
{
    /**
     * Stat bonus ranges per rarity tier.
     * Each stat picks a random value in [min, max].
     */
    private const RARITY_RANGES = [
        'Q1' => ['min' => 1,  'max' => 3],
        'Q2' => ['min' => 3,  'max' => 7],
        'Q3' => ['min' => 6,  'max' => 12],
        'Q4' => ['min' => 10, 'max' => 18],
        'Q5' => ['min' => 15, 'max' => 25],
    ];

    private const SLOT_STAT_MAP = [
        'boots'  => ['speed', 'technique'],
        'shorts' => ['stamina', 'defense'],
        'jersey' => ['attack', 'defense'],
        'socks'  => ['stamina', 'speed'],
        'charm'  => ['attack', 'technique'],
    ];

    public function createEquipment(Player $player, EquipmentSlot|string $slot, Rarity|string $rarity): Equipment
    {
        $slotValue   = $slot instanceof EquipmentSlot ? $slot->value : $slot;
        $rarityValue = $rarity instanceof Rarity ? $rarity->value : $rarity;

        $bonuses = $this->generateBonuses($slotValue, $rarityValue);

        return Equipment::create([
            'owner_player_id' => $player->id,
            'slot'            => $slotValue,
            'rarity'          => $rarityValue,
            'name'            => $this->generateName($slotValue, $rarityValue),
            ...$bonuses,
        ]);
    }

    public function equipItem(Player $player, Equipment $equipment): void
    {
        if ($equipment->owner_player_id !== $player->id) {
            throw new \DomainException('You do not own this equipment.');
        }

        DB::transaction(function () use ($player, $equipment) {
            // Unequip any existing item in the same slot
            Equipment::where('owner_player_id', $player->id)
                ->where('slot', $equipment->slot)
                ->where('is_equipped', true)
                ->update(['is_equipped' => false, 'player_id' => null]);

            $equipment->update([
                'is_equipped' => true,
                'player_id'   => $player->id,
            ]);
        });
    }

    public function unequipItem(Player $player, Equipment $equipment): void
    {
        if ($equipment->owner_player_id !== $player->id) {
            throw new \DomainException('You do not own this equipment.');
        }

        if (! $equipment->is_equipped) {
            throw new \DomainException('Equipment is not currently equipped.');
        }

        $equipment->update([
            'is_equipped' => false,
            'player_id'   => null,
        ]);
    }

    /**
     * Merge 3 same-slot same-rarity items into 1 item of the next rarity tier.
     *
     * @param  string[]  $equipmentIds
     *
     * @throws InvalidMergeException
     * @throws MaxRarityReachedException
     */
    public function mergeEquipment(Player $player, array $equipmentIds): Equipment
    {
        if (count($equipmentIds) !== 3) {
            throw new InvalidMergeException('Exactly 3 items required for a merge.');
        }

        $items = Equipment::whereIn('id', $equipmentIds)
            ->where('owner_player_id', $player->id)
            ->get();

        if ($items->count() !== 3) {
            throw new InvalidMergeException('One or more items not found or not owned by you.');
        }

        $slots    = $items->pluck('slot')->unique();
        $rarities = $items->pluck('rarity')->unique();

        if ($slots->count() > 1) {
            throw new InvalidMergeException('All items must occupy the same equipment slot.');
        }

        if ($rarities->count() > 1) {
            throw new InvalidMergeException('All items must be the same rarity tier.');
        }

        /** @var Rarity $currentRarity */
        $currentRarity = $items->first()->rarity;

        if ($currentRarity->isMax()) {
            throw new MaxRarityReachedException();
        }

        return DB::transaction(function () use ($items, $player, $currentRarity) {
            $slot      = $items->first()->slot;
            $newRarity = $currentRarity->next();

            // Unequip items before deleting
            $items->each(function (Equipment $item) use ($player) {
                if ($item->is_equipped) {
                    $this->unequipItem($player, $item);
                }
            });

            $items->each->delete();

            return $this->createEquipment($player, $slot, $newRarity);
        });
    }

    public function getPlayerInventory(Player $player): Collection
    {
        return $player->ownedEquipment()->orderBy('slot')->orderBy('rarity')->get();
    }

    public function getEquippedItems(Player $player): Collection
    {
        return $player->equippedItems()->get();
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    private function generateBonuses(string $slot, string $rarity): array
    {
        $range       = self::RARITY_RANGES[$rarity];
        $primaryStats = self::SLOT_STAT_MAP[$slot];
        $bonuses     = [
            'attack_bonus'    => 0,
            'defense_bonus'   => 0,
            'stamina_bonus'   => 0,
            'speed_bonus'     => 0,
            'technique_bonus' => 0,
        ];

        foreach ($primaryStats as $stat) {
            $bonuses["{$stat}_bonus"] = random_int($range['min'], $range['max']);
        }

        // Minor random bonus on a secondary stat
        $allStats    = ['attack', 'defense', 'stamina', 'speed', 'technique'];
        $secondaries = array_diff($allStats, $primaryStats);
        $secondary   = $secondaries[array_rand($secondaries)];

        $bonuses["{$secondary}_bonus"] = random_int(0, (int) ($range['max'] / 3));

        return $bonuses;
    }

    private function generateName(string $slot, string $rarity): string
    {
        $adjectives = [
            'Q1' => ['Basic', 'Simple', 'Plain'],
            'Q2' => ['Sturdy', 'Reliable', 'Standard'],
            'Q3' => ['Enhanced', 'Refined', 'Superior'],
            'Q4' => ['Elite', 'Radiant', 'Masterwork'],
            'Q5' => ['Legendary', 'Divine', 'Mythic'],
        ];

        $adj = $adjectives[$rarity][array_rand($adjectives[$rarity])];

        return "{$adj} " . ucfirst($slot);
    }
}