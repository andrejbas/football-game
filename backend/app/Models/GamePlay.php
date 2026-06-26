<?php

namespace App\Models;

use App\Enums\GamePlayStatus;
use App\Enums\WinnerSide;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GamePlay extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'match_id',
        'phase_number',
        'home_team_points',
        'away_team_points',
        'winner_side',
        'status',
        'started_at',
        'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'status'           => GamePlayStatus::class,
            'winner_side'      => WinnerSide::class,
            'phase_number'     => 'integer',
            'home_team_points' => 'integer',
            'away_team_points' => 'integer',
            'started_at'       => 'datetime',
            'finished_at'      => 'datetime',
        ];
    }

    // ─── Relationships ───────────────────────────────────────────────────────

    public function match(): BelongsTo
    {
        return $this->belongsTo(FootballMatch::class, 'match_id');
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(GamePlayContribution::class);
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(Reward::class);
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', GamePlayStatus::Active);
    }

    public function scopePending($query)
    {
        return $query->where('status', GamePlayStatus::Pending);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function isActive(): bool
    {
        return $this->status === GamePlayStatus::Active;
    }

    public function isCompleted(): bool
    {
        return $this->status === GamePlayStatus::Completed;
    }

    public function isLastPhase(): bool
    {
        return $this->phase_number === 11;
    }
}