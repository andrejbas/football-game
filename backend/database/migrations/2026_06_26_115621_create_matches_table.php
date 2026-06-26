<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matches', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('league_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('home_team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignUlid('away_team_id')->constrained('teams')->cascadeOnDelete();
            $table->unsignedSmallInteger('game_day');
            $table->unsignedSmallInteger('home_score')->default(0);
            $table->unsignedSmallInteger('away_score')->default(0);
            $table->enum('status', ['scheduled', 'in_progress', 'completed'])->default('scheduled');
            $table->timestamp('scheduled_at');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index('league_id');
            $table->index('home_team_id');
            $table->index('away_team_id');
            $table->index('game_day');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};