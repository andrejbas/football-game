<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'      => $this->id,
            'name'    => $this->name,
            'slot'    => $this->slot,
            'rarity'  => $this->rarity,
            'bonuses' => [
                'attack'    => $this->attack_bonus,
                'defense'   => $this->defense_bonus,
                'stamina'   => $this->stamina_bonus,
                'speed'     => $this->speed_bonus,
                'technique' => $this->technique_bonus,
                'total'     => $this->total_bonus,
            ],
            'is_equipped' => $this->is_equipped,
            'created_at'  => $this->created_at,
        ];
    }
}