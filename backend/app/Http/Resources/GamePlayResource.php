<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GamePlayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'match_id'     => $this->match_id,
            'phase_number' => $this->phase_number,
            'points' => [
                'home' => $this->home_team_points,
                'away' => $this->away_team_points,
            ],
            'winner_side'   => $this->winner_side,
            'status'        => $this->status,
            'started_at'    => $this->started_at,
            'finished_at'   => $this->finished_at,
            'contributions' => GamePlayContributionResource::collection(
                $this->whenLoaded('contributions')
            ),
        ];
    }
}