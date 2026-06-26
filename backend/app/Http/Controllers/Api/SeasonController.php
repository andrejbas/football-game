<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeagueResource;
use App\Http\Resources\SeasonHistoryResource;
use App\Models\League;
use App\Models\SeasonHistory;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeasonController extends Controller
{
    use ApiResponseTrait;

    public function current(): JsonResponse
    {
        $league = League::active()->with('teams')->first();

        if (! $league) {
            return $this->errorResponse('No active season found.', 404);
        }

        return $this->successResponse(LeagueResource::make($league));
    }

    public function history(Request $request): JsonResponse
    {
        $query = SeasonHistory::with('team')
            ->orderByDesc('season_number')
            ->orderBy('final_position');

        if ($request->has('league_id')) {
            $query->where('league_id', $request->league_id);
        }

        if ($request->has('team_id')) {
            $query->where('team_id', $request->team_id);
        }

        $history = $query->paginate(50);

        return $this->successResponse(
            SeasonHistoryResource::collection($history)->response()->getData(true)
        );
    }
}