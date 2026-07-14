<?php

namespace App\Models;

use App\Enums\LeagueStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class League extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'name',
        'season_number',
        'status',
        'current_game_day',
        'started_at',
        'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'status'           => LeagueStatus::class,
            'season_number'    => 'integer',
            'current_game_day' => 'integer',
            'started_at'       => 'datetime',
            'ended_at'         => 'datetime',
        ];
    }

    // ─── Relationships ───────────────────────────────────────────────────────

    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(FootballMatch::class);
    }

    public function seasonHistory(): HasMany
    {
        return $this->hasMany(SeasonHistory::class);
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', LeagueStatus::Active);
    }

    public function scopePending($query)
    {
        return $query->where('status', LeagueStatus::Pending);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function isActive(): bool
    {
        return $this->status === LeagueStatus::Active;
    }

    public function isCompleted(): bool
    {
        return $this->status === LeagueStatus::Completed;
    }

    public function hasSeasonEnded(): bool
    {
        return $this->current_game_day >= 18;
    }
}