<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('owner_player_id')->constrained('players')->cascadeOnDelete();
            $table->foreignUlid('player_id')->nullable()->constrained('players')->nullOnDelete();
            $table->enum('slot', ['boots', 'shorts', 'jersey', 'socks', 'charm']);
            $table->enum('rarity', ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']);
            $table->string('name');
            $table->smallInteger('attack_bonus')->default(0);
            $table->smallInteger('defense_bonus')->default(0);
            $table->smallInteger('stamina_bonus')->default(0);
            $table->smallInteger('speed_bonus')->default(0);
            $table->smallInteger('technique_bonus')->default(0);
            $table->boolean('is_equipped')->default(false);
            $table->timestamps();

            $table->index('owner_player_id');
            $table->index('player_id');
            $table->index('slot');
            $table->index('rarity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment');
    }
};