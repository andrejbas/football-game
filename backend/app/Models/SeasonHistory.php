<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeasonHistory extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'league_id',
        'team_id',
        'season_number',
        'final_position',
        'points',
        'wins',
        'losses',
        'draws',
        'goals_for',
        'goals_against',
    ];

    protected function casts(): array
    {
        return [
            'season_number'  => 'integer',
            'final_position' => 'integer',
            'points'         => 'integer',
            'wins'           => 'integer',
            'losses'         => 'integer',
            'draws'          => 'integer',
            'goals_for'      => 'integer',
            'goals_against'  => 'integer',
        ];
    }

    public function league(): BelongsTo
    {
        return $this->belongsTo(League::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function getGoalDifferenceAttribute(): int
    {
        return $this->goals_for - $this->goals_against;
    }
}