<?php

namespace Database\Seeders;

use App\Models\Player;
use App\Services\EquipmentService;
use Illuminate\Database\Seeder;

class EquipmentSeeder extends Seeder
{
    /**
     * Seed a large equipment inventory for every player so the
     * merge / equip / unequip workflows can be tested properly.
     *
     * Distribution per player (~30 items):
     *   Q1 × 10, Q2 × 8, Q3 × 6, Q4 × 4, Q5 × 2
     */
    public function run(): void
    {
        /** @var EquipmentService $service */
        $service = app(EquipmentService::class);

        $slots = ['boots', 'shorts', 'jersey', 'socks', 'charm'];

        // Rarity => number of items to create per player
        $distribution = [
            'Q1' => 10,
            'Q2' => 8,
            'Q3' => 6,
            'Q4' => 4,
            'Q5' => 2,
        ];

        $players = Player::all();

        if ($players->isEmpty()) {
            $this->command->warn('No players found. Run DemoGameSeeder first.');
            return;
        }

        $total = 0;

        foreach ($players as $player) {
            foreach ($distribution as $rarity => $count) {
                for ($i = 0; $i < $count; $i++) {
                    $slot = $slots[array_rand($slots)];
                    $service->createEquipment($player, $slot, $rarity);
                    $total++;
                }
            }
        }

        $this->command->info("Seeded {$total} equipment items for {$players->count()} players.");
    }
}
