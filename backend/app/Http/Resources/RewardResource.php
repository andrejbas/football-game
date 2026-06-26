<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RewardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'type'         => $this->type,
            'match_id'     => $this->match_id,
            'game_play_id' => $this->game_play_id,
            'xp_amount'    => $this->xp_amount,
            'energy_amount'=> $this->energy_amount,
            'equipment'    => EquipmentResource::make($this->whenLoaded('equipment')),
            'created_at'   => $this->created_at,
        ];
    }
}