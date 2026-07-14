<?php

namespace Tests\Unit\Services;

use App\Events\PlayerLevelUp;
use App\Models\Player;
use App\Services\PlayerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class PlayerServiceTest extends TestCase
{
    use RefreshDatabase;

    private PlayerService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PlayerService();
    }

    // ── XP & Level-up ────────────────────────────────────────────────────────

    public function test_adding_xp_increments_xp_field(): void
    {
        $player = Player::factory()->create(['xp' => 0, 'xp_to_next_level' => 100]);

        $this->service->addXP($player, 50);

        $this->assertDatabaseHas('players', ['id' => $player->id, 'xp' => 50]);
    }

    public function test_player_levels_up_when_xp_threshold_reached(): void
    {
        Event::fake([PlayerLevelUp::class]);

        $player = Player::factory()->create([
            'level'            => 1,
            'xp'               => 90,
            'xp_to_next_level' => 100,
        ]);

        $this->service->addXP($player, 20);   // 90 + 20 = 110 → level up

        $player->refresh();

        $this->assertEquals(2, $player->level);
        $this->assertEquals(10, $player->xp);          // 110 - 100 carry-over
        $this->assertEquals(200, $player->xp_to_next_level);   // level 2 * 100

        Event::assertDispatched(PlayerLevelUp::class, function ($event) use ($player) {
            return $event->player->id === $player->id && $event->newLevel === 2;
        });
    }

    public function test_player_stats_increase_on_level_up(): void
    {
        Event::fake();

        $player = Player::factory()->create([
            'level'            => 1,
            'xp'               => 0,
            'xp_to_next_level' => 100,
            'attack'           => 10,
        ]);

        $this->service->addXP($player, 100);

        $player->refresh();

        $this->assertEquals(12, $player->attack);   // +2 per level
    }

    public function test_multiple_level_ups_chain_correctly(): void
    {
        Event::fake([PlayerLevelUp::class]);

        $player = Player::factory()->create([
            'level'            => 1,
            'xp'               => 0,
            'xp_to_next_level' => 100,
        ]);

        // 350 XP: level 1→2 (100), 2→3 (200), leftover 50
        $this->service->addXP($player, 350);

        $player->refresh();

        $this->assertEquals(3, $player->level);
        $this->assertEquals(50, $player->xp);

        Event::assertDispatchedTimes(PlayerLevelUp::class, 2);
    }

    // ── Energy ───────────────────────────────────────────────────────────────

    public function test_reset_daily_energy_refills_all_players(): void
    {
        Player::factory()->count(3)->create([
            'energy_current' => 10,
            'energy_max'     => 100,
        ]);

        $this->service->resetDailyEnergy();

        $this->assertDatabaseMissing('players', ['energy_current' => 10]);
    }

    public function test_regenerate_energy_does_not_exceed_max(): void
    {
        $player = Player::factory()->create([
            'energy_current'    => 95,
            'energy_max'        => 100,
            'energy_regen_rate' => 10,
        ]);

        $this->service->regenerateEnergy($player);

        $player->refresh();
        $this->assertEquals(100, $player->energy_current);
    }

    // ── Point Calculation ────────────────────────────────────────────────────

    public function test_compute_game_play_points_returns_positive_value(): void
    {
        $player = Player::factory()->create([
            'attack'    => 10,
            'speed'     => 10,
            'technique' => 10,
            'stamina'   => 10,
        ]);

        // Load empty equipment collection so accessors work
        $player->setRelation('equippedItems', collect());

        $points = $this->service->computeGamePlayPoints($player, 20);

        $this->assertGreaterThan(0, $points);
    }

    public function test_higher_energy_investment_yields_more_points(): void
    {
        $player = Player::factory()->create([
            'attack'    => 15,
            'speed'     => 15,
            'technique' => 15,
            'stamina'   => 15,
        ]);
        $player->setRelation('equippedItems', collect());

        $low  = $this->service->computeGamePlayPoints($player, 10);
        $high = $this->service->computeGamePlayPoints($player, 50);

        $this->assertGreaterThan($low, $high);
    }
}