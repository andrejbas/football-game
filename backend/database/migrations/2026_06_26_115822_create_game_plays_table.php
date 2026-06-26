<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_plays', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('match_id')->constrained('matches')->cascadeOnDelete();
            $table->unsignedSmallInteger('phase_number');   // 1–11
            $table->unsignedInteger('home_team_points')->default(0);
            $table->unsignedInteger('away_team_points')->default(0);
            $table->enum('winner_side', ['home', 'away', 'draw'])->nullable();
            $table->enum('status', ['pending', 'active', 'completed'])->default('pending');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index('match_id');
            $table->index(['match_id', 'phase_number']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_plays');
    }
};