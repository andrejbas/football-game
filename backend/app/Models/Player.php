<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'user_id',
        'team_id',
        'name',
        'level',
        'xp',
        'xp_to_next_level',
        'attack',
        'defense',
        'stamina',
        'speed',
        'technique',
        'energy_current',
        'energy_max',
        'energy_regen_rate',
    ];

    protected function casts(): array
    {
        return [
            'level'            => 'integer',
            'xp'               => 'integer',
            'xp_to_next_level' => 'integer',
            'attack'           => 'integer',
            'defense'          => 'integer',
            'stamina'          => 'integer',
            'speed'            => 'integer',
            'technique'        => 'integer',
            'energy_current'   => 'integer',
            'energy_max'       => 'integer',
            'energy_regen_rate'=> 'integer',
        ];
    }

    // ─── Relationships ───────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function ownedEquipment(): HasMany
    {
        return $this->hasMany(Equipment::class, 'owner_player_id');
    }

    public function equippedItems(): HasMany
    {
        return $this->hasMany(Equipment::class, 'player_id')->where('is_equipped', true);
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(GamePlayContribution::class);
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(Reward::class);
    }

    // ─── Computed Stat Accessors ─────────────────────────────────────────────

    public function getEffectiveAttackAttribute(): int
    {
        return $this->attack + $this->equippedItems->sum('attack_bonus');
    }

    public function getEffectiveDefenseAttribute(): int
    {
        return $this->defense + $this->equippedItems->sum('defense_bonus');
    }

    public function getEffectiveStaminaAttribute(): int
    {
        return $this->stamina + $this->equippedItems->sum('stamina_bonus');
    }

    public function getEffectiveSpeedAttribute(): int
    {
        return $this->speed + $this->equippedItems->sum('speed_bonus');
    }

    public function getEffectiveTechniqueAttribute(): int
    {
        return $this->technique + $this->equippedItems->sum('technique_bonus');
    }

    /**
     * Composite score used in GamePlay point calculations.
     * Formula: (attack + technique + speed) / 3
     */
    public function getComputedPointPowerAttribute(): float
    {
        return ($this->effective_attack + $this->effective_technique + $this->effective_speed) / 3;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function hasEnoughEnergy(int $amount): bool
    {
        return $this->energy_current >= $amount;
    }

    public function needsLevelUp(): bool
    {
        return $this->xp >= $this->xp_to_next_level;
    }

    public function deductEnergy(int $amount): void
    {
        $this->decrement('energy_current', $amount);
    }

    public function refillEnergy(): void
    {
        $this->update(['energy_current' => $this->energy_max]);
    }
}