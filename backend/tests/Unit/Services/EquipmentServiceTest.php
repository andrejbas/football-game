<?php

namespace Tests\Unit\Services;

use App\Enums\EquipmentSlot;
use App\Enums\Rarity;
use App\Exceptions\Game\InvalidMergeException;
use App\Exceptions\Game\MaxRarityReachedException;
use App\Models\Equipment;
use App\Models\Player;
use App\Services\EquipmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EquipmentServiceTest extends TestCase
{
    use RefreshDatabase;

    private EquipmentService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new EquipmentService();
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public function test_create_equipment_persists_record(): void
    {
        $player    = Player::factory()->create();
        $equipment = $this->service->createEquipment($player, EquipmentSlot::Boots, Rarity::Q1);

        $this->assertDatabaseHas('equipment', [
            'id'              => $equipment->id,
            'owner_player_id' => $player->id,
            'slot'            => 'boots',
            'rarity'          => 'Q1',
        ]);
    }

    public function test_created_equipment_has_positive_primary_stat_bonuses(): void
    {
        $player    = Player::factory()->create();
        $equipment = $this->service->createEquipment($player, EquipmentSlot::Boots, Rarity::Q3);

        // Boots primary stats: speed + technique
        $this->assertGreaterThan(0, $equipment->speed_bonus);
        $this->assertGreaterThan(0, $equipment->technique_bonus);
    }

    // ── Equip / Unequip ───────────────────────────────────────────────────────

    public function test_equip_marks_item_as_equipped(): void
    {
        $player    = Player::factory()->create();
        $equipment = Equipment::factory()->for($player, 'owner')->create([
            'slot'        => 'boots',
            'is_equipped' => false,
        ]);

        $this->service->equipItem($player, $equipment);

        $this->assertDatabaseHas('equipment', [
            'id'          => $equipment->id,
            'is_equipped' => true,
            'player_id'   => $player->id,
        ]);
    }

    public function test_equipping_replaces_existing_item_in_same_slot(): void
    {
        $player = Player::factory()->create();

        $old = Equipment::factory()->for($player, 'owner')->create([
            'slot'        => 'boots',
            'is_equipped' => true,
            'player_id'   => $player->id,
        ]);

        $new = Equipment::factory()->for($player, 'owner')->create([
            'slot'        => 'boots',
            'is_equipped' => false,
        ]);

        $this->service->equipItem($player, $new);

        $this->assertDatabaseHas('equipment', ['id' => $old->id, 'is_equipped' => false]);
        $this->assertDatabaseHas('equipment', ['id' => $new->id, 'is_equipped' => true]);
    }

    public function test_unequip_removes_player_association(): void
    {
        $player    = Player::factory()->create();
        $equipment = Equipment::factory()->for($player, 'owner')->create([
            'slot'        => 'boots',
            'is_equipped' => true,
            'player_id'   => $player->id,
        ]);

        $this->service->unequipItem($player, $equipment);

        $this->assertDatabaseHas('equipment', [
            'id'          => $equipment->id,
            'is_equipped' => false,
            'player_id'   => null,
        ]);
    }

    // ── Merge ─────────────────────────────────────────────────────────────────

    public function test_merge_three_same_slot_same_rarity_produces_higher_tier(): void
    {
        $player = Player::factory()->create();

        $items = Equipment::factory()->count(3)->for($player, 'owner')->create([
            'slot'   => 'boots',
            'rarity' => 'Q1',
        ]);

        $merged = $this->service->mergeEquipment($player, $items->pluck('id')->toArray());

        $this->assertEquals('Q2', $merged->rarity->value);
        $this->assertEquals('boots', $merged->slot->value);

        // Originals must be deleted
        foreach ($items as $item) {
            $this->assertDatabaseMissing('equipment', ['id' => $item->id]);
        }
    }

    public function test_merge_throws_when_less_than_three_items(): void
    {
        $this->expectException(InvalidMergeException::class);

        $player = Player::factory()->create();
        $items  = Equipment::factory()->count(2)->for($player, 'owner')->create([
            'slot' => 'boots', 'rarity' => 'Q1',
        ]);

        $this->service->mergeEquipment($player, $items->pluck('id')->toArray());
    }

    public function test_merge_throws_when_slots_differ(): void
    {
        $this->expectException(InvalidMergeException::class);

        $player = Player::factory()->create();

        $items = collect([
            Equipment::factory()->for($player, 'owner')->create(['slot' => 'boots',  'rarity' => 'Q1']),
            Equipment::factory()->for($player, 'owner')->create(['slot' => 'shorts', 'rarity' => 'Q1']),
            Equipment::factory()->for($player, 'owner')->create(['slot' => 'boots',  'rarity' => 'Q1']),
        ]);

        $this->service->mergeEquipment($player, $items->pluck('id')->toArray());
    }

    public function test_merge_throws_when_rarities_differ(): void
    {
        $this->expectException(InvalidMergeException::class);

        $player = Player::factory()->create();

        $items = collect([
            Equipment::factory()->for($player, 'owner')->create(['slot' => 'boots', 'rarity' => 'Q1']),
            Equipment::factory()->for($player, 'owner')->create(['slot' => 'boots', 'rarity' => 'Q2']),
            Equipment::factory()->for($player, 'owner')->create(['slot' => 'boots', 'rarity' => 'Q1']),
        ]);

        $this->service->mergeEquipment($player, $items->pluck('id')->toArray());
    }

    public function test_merge_throws_when_already_at_max_rarity(): void
    {
        $this->expectException(MaxRarityReachedException::class);

        $player = Player::factory()->create();

        $items = Equipment::factory()->count(3)->for($player, 'owner')->create([
            'slot' => 'boots', 'rarity' => 'Q5',
        ]);

        $this->service->mergeEquipment($player, $items->pluck('id')->toArray());
    }
}