<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('players', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignUlid('team_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('level')->default(1);
            $table->unsignedInteger('xp')->default(0);
            $table->unsignedInteger('xp_to_next_level')->default(100);

            // Base stats
            $table->unsignedSmallInteger('attack')->default(10);
            $table->unsignedSmallInteger('defense')->default(10);
            $table->unsignedSmallInteger('stamina')->default(10);
            $table->unsignedSmallInteger('speed')->default(10);
            $table->unsignedSmallInteger('technique')->default(10);

            // Energy
            $table->unsignedSmallInteger('energy_current')->default(100);
            $table->unsignedSmallInteger('energy_max')->default(100);
            $table->unsignedSmallInteger('energy_regen_rate')->default(10);

            $table->timestamps();

            $table->index('user_id');
            $table->index('team_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};