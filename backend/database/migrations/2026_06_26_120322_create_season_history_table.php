<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('season_history', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('league_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('team_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('season_number');
            $table->unsignedSmallInteger('final_position');
            $table->unsignedSmallInteger('points');
            $table->unsignedSmallInteger('wins');
            $table->unsignedSmallInteger('losses');
            $table->unsignedSmallInteger('draws');
            $table->unsignedSmallInteger('goals_for');
            $table->unsignedSmallInteger('goals_against');
            $table->timestamps();

            $table->index(['league_id', 'season_number']);
            $table->index('team_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('season_history');
    }
};