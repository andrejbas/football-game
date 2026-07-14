<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlayerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'    => $this->id,
            'name'  => $this->name,
            'level' => $this->level,
            'xp'    => [
                'current'       => $this->xp,
                'to_next_level' => $this->xp_to_next_level,
                'progress_pct'  => $this->xp_to_next_level > 0
                    ? round(($this->xp / $this->xp_to_next_level) * 100, 1)
                    : 100,
            ],
            'base_stats' => [
                'attack'    => $this->attack,
                'defense'   => $this->defense,
                'stamina'   => $this->stamina,
                'speed'     => $this->speed,
                'technique' => $this->technique,
            ],
            'effective_stats' => $this->when(
                $this->relationLoaded('equippedItems'),
                fn () => [
                    'attack'    => $this->effective_attack,
                    'defense'   => $this->effective_defense,
                    'stamina'   => $this->effective_stamina,
                    'speed'     => $this->effective_speed,
                    'technique' => $this->effective_technique,
                ]
            ),
            'energy' => [
                'current'    => $this->energy_current,
                'max'        => $this->energy_max,
                'regen_rate' => $this->energy_regen_rate,
                'pct'        => $this->energy_max > 0
                    ? round(($this->energy_current / $this->energy_max) * 100, 1)
                    : 0,
            ],
            'team'          => TeamResource::make($this->whenLoaded('team')),
            'equipped_items'=> EquipmentResource::collection($this->whenLoaded('equippedItems')),
            'created_at'    => $this->created_at,
            'goals_scored'    => $this->goals_scored
        ];
    }
}