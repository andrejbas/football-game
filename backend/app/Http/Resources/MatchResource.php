<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'league_id'  => $this->league_id,
            'game_day'   => $this->game_day,
            'home_team'  => TeamResource::make($this->whenLoaded('homeTeam')),
            'away_team'  => TeamResource::make($this->whenLoaded('awayTeam')),
            'score' => [
                'home' => $this->home_score,
                'away' => $this->away_score,
            ],
            'status'       => $this->status,
            'scheduled_at' => $this->scheduled_at,
            'started_at'   => $this->started_at,
            'finished_at'  => $this->finished_at,
            'game_plays'   => GamePlayResource::collection($this->whenLoaded('gamePlays')),
        ];
    }
}