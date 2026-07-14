<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GamePlayContributionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'player'             => PlayerResource::make($this->whenLoaded('player')),
            'team_id'            => $this->team_id,
            'energy_invested'    => $this->energy_invested,
            'points_contributed' => $this->points_contributed,
            'created_at'         => $this->created_at,
        ];
    }
}