<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_play_contributions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('game_play_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('player_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('team_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('energy_invested');
            $table->unsignedInteger('points_contributed');
            $table->timestamps();

            $table->index('game_play_id');
            $table->index('player_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_play_contributions');
    }
};