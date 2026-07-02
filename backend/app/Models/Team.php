<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'name',
        'owner_id',
        'league_id',
        'wins',
        'losses',
        'draws',
        'goals_for',
        'goals_against',
        'points',
    ];

    protected function casts(): array
    {
        return [
            'wins'           => 'integer',
            'losses'         => 'integer',
            'draws'          => 'integer',
            'goals_for'      => 'integer',
            'goals_against'  => 'integer',
            'points'         => 'integer',
        ];
    }

    // ─── Relationships ───────────────────────────────────────────────────────

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function league(): BelongsTo
    {
        return $this->belongsTo(League::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
                    ->withPivot('joined_at');
    }

    public function players(): HasMany
    {
        return $this->hasMany(Player::class);
    }

    public function homeMatches(): HasMany
    {
        return $this->hasMany(FootballMatch::class, 'home_team_id');
    }

    public function awayMatches(): HasMany
    {
        return $this->hasMany(FootballMatch::class, 'away_team_id');
    }

    public function seasonHistory(): HasMany
    {
        return $this->hasMany(SeasonHistory::class);
    }

    // ─── Accessors ───────────────────────────────────────────────────────────

    public function getGoalDifferenceAttribute(): int
    {
        return $this->goals_for - $this->goals_against;
    }

    public function getRosterCountAttribute(): int
    {
        return $this->players()->count();
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeInLeague($query, string $leagueId)
    {
        return $query->where('league_id', $leagueId);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function isFull(): bool
    {
        return $this->players()->count() >= 23;
    }

    public function hasMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    public function resetStandings(): void
    {
        $this->update([
            'wins'          => 0,
            'losses'        => 0,
            'draws'         => 0,
            'goals_for'     => 0,
            'goals_against' => 0,
            'points'        => 0,
        ]);
    }
}