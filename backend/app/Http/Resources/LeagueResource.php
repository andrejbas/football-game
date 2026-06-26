<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeagueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'name'             => $this->name,
            'season_number'    => $this->season_number,
            'status'           => $this->status,
            'current_game_day' => $this->current_game_day,
            'started_at'       => $this->started_at,
            'ended_at'         => $this->ended_at,
            'teams'            => TeamResource::collection($this->whenLoaded('teams')),
            'created_at'       => $this->created_at,
        ];
    }
}