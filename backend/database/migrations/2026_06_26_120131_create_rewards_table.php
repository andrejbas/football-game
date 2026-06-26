<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rewards', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('player_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('match_id')->constrained('matches')->cascadeOnDelete();
            $table->foreignUlid('game_play_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['xp', 'equipment', 'energy']);
            $table->unsignedInteger('xp_amount')->nullable();
            $table->foreignUlid('equipment_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('energy_amount')->nullable();
            $table->timestamps();

            $table->index('player_id');
            $table->index('match_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rewards');
    }
};