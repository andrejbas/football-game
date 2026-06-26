<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GamePlayContribution extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'game_play_id',
        'player_id',
        'team_id',
        'energy_invested',
        'points_contributed',
    ];

    protected function casts(): array
    {
        return [
            'energy_invested'    => 'integer',
            'points_contributed' => 'integer',
        ];
    }

    public function gamePlay(): BelongsTo
    {
        return $this->belongsTo(GamePlay::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }
}