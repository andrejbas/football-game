<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeasonHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'league_id'       => $this->league_id,
            'team'            => TeamResource::make($this->whenLoaded('team')),
            'season_number'   => $this->season_number,
            'final_position'  => $this->final_position,
            'points'          => $this->points,
            'wins'            => $this->wins,
            'draws'           => $this->draws,
            'losses'          => $this->losses,
            'goals_for'       => $this->goals_for,
            'goals_against'   => $this->goals_against,
            'goal_difference' => $this->goal_difference,
        ];
    }
}