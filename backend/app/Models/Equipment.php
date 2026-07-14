<?php

namespace App\Models;

use App\Enums\EquipmentSlot;
use App\Enums\Rarity;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Equipment extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'owner_player_id',
        'player_id',
        'slot',
        'rarity',
        'name',
        'attack_bonus',
        'defense_bonus',
        'stamina_bonus',
        'speed_bonus',
        'technique_bonus',
        'is_equipped',
    ];

    protected function casts(): array
    {
        return [
            'slot'            => EquipmentSlot::class,
            'rarity'          => Rarity::class,
            'attack_bonus'    => 'integer',
            'defense_bonus'   => 'integer',
            'stamina_bonus'   => 'integer',
            'speed_bonus'     => 'integer',
            'technique_bonus' => 'integer',
            'is_equipped'     => 'boolean',
        ];
    }

    // ─── Relationships ───────────────────────────────────────────────────────

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'owner_player_id');
    }

    public function equippedBy(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'player_id');
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeBySlot($query, EquipmentSlot|string $slot)
    {
        return $query->where('slot', $slot);
    }

    public function scopeByRarity($query, Rarity|string $rarity)
    {
        return $query->where('rarity', $rarity);
    }

    public function scopeEquipped($query)
    {
        return $query->where('is_equipped', true);
    }

    public function scopeUnequipped($query)
    {
        return $query->where('is_equipped', false);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function getTotalBonusAttribute(): int
    {
        return $this->attack_bonus
            + $this->defense_bonus
            + $this->stamina_bonus
            + $this->speed_bonus
            + $this->technique_bonus;
    }
}