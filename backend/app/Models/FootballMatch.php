<?php

namespace App\Models;

use App\Enums\MatchStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;


class FootballMatch extends Model
{
    use HasFactory, HasUlids;

    protected $table = 'matches';

    protected $fillable = [
        'league_id',
        'home_team_id',
        'away_team_id',
        'game_day',
        'home_score',
        'away_score',
        'status',
        'scheduled_at',
        'started_at',
        'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'status'       => MatchStatus::class,
            'game_day'     => 'integer',
            'home_score'   => 'integer',
            'away_score'   => 'integer',
            'scheduled_at' => 'datetime',
            'started_at'   => 'datetime',
            'finished_at'  => 'datetime',
        ];
    }

    // ─── Relationships ───────────────────────────────────────────────────────

    public function league(): BelongsTo
    {
        return $this->belongsTo(League::class);
    }

    public function homeTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'home_team_id');
    }

    public function awayTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'away_team_id');
    }

    public function gamePlays(): HasMany
    {
        return $this->hasMany(GamePlay::class, 'match_id')->orderBy('phase_number');
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(Reward::class, 'match_id');
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeScheduled($query)
    {
        return $query->where('status', MatchStatus::Scheduled);
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', MatchStatus::InProgress);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', MatchStatus::Completed);
    }

    public function scopeByGameDay($query, int $day)
    {
        return $query->where('game_day', $day);
    }

    // ─── Accessors ───────────────────────────────────────────────────────────

    public function getWinnerAttribute(): ?Team
    {
        if ($this->home_score > $this->away_score) {
            return $this->homeTeam;
        }
        if ($this->away_score > $this->home_score) {
            return $this->awayTeam;
        }

        return null; // draw
    }

    public function getIsDrawAttribute(): bool
    {
        return $this->home_score === $this->away_score;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function isScheduled(): bool
    {
        return $this->status === MatchStatus::Scheduled;
    }

    public function isInProgress(): bool
    {
        return $this->status === MatchStatus::InProgress;
    }

    public function isCompleted(): bool
    {
        return $this->status === MatchStatus::Completed;
    }

    public function involvesTeam(Team $team): bool
    {
        return $this->home_team_id === $team->id || $this->away_team_id === $team->id;
    }

    public function sideForTeam(Team $team): ?string
    {
        if ($this->home_team_id === $team->id) {
            return 'home';
        }
        if ($this->away_team_id === $team->id) {
            return 'away';
        }

        return null;
    }
}