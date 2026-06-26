<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'      => $this->id,
            'name'    => $this->name,
            'owner'   => UserResource::make($this->whenLoaded('owner')),
            'league'  => LeagueResource::make($this->whenLoaded('league')),
            'roster_count' => $this->when(
                isset($this->roster_count),
                $this->roster_count
            ),
            'standings' => [
                'points'          => $this->points,
                'wins'            => $this->wins,
                'draws'           => $this->draws,
                'losses'          => $this->losses,
                'goals_for'       => $this->goals_for,
                'goals_against'   => $this->goals_against,
                'goal_difference' => $this->goal_difference,
            ],
            'players'    => PlayerResource::collection($this->whenLoaded('players')),
            'created_at' => $this->created_at,
        ];
    }
}