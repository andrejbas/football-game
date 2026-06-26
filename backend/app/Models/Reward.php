<?php

namespace App\Models;

use App\Enums\RewardType;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reward extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'player_id',
        'match_id',
        'game_play_id',
        'type',
        'xp_amount',
        'equipment_id',
        'energy_amount',
    ];

    protected function casts(): array
    {
        return [
            'type'          => RewardType::class,
            'xp_amount'     => 'integer',
            'energy_amount' => 'integer',
        ];
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function match(): BelongsTo
    {
        return $this->belongsTo(FootballMatch::class, 'match_id');
    }

    public function gamePlay(): BelongsTo
    {
        return $this->belongsTo(GamePlay::class);
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }
}