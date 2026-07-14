<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GamePlayResource;
use App\Http\Resources\MatchResource;
use App\Models\FootballMatch;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request): JsonResponse
    {
        $query = FootballMatch::with(['homeTeam', 'awayTeam', 'league'])
            ->latest('scheduled_at');

        if ($request->has('league_id')) {
            $query->where('league_id', $request->league_id);
        }

        if ($request->has('game_day')) {
            $query->where('game_day', $request->integer('game_day'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $matches = $query->paginate(20);

        return $this->successResponse(MatchResource::collection($matches)->response()->getData(true));
    }

    public function show(FootballMatch $match): JsonResponse
    {
        $match->load(['homeTeam', 'awayTeam', 'league', 'gamePlays']);

        return $this->successResponse(MatchResource::make($match));
    }

    public function gamePlays(FootballMatch $match): JsonResponse
    {
        $gamePlays = $match->gamePlays()->with('contributions.player')->get();

        return $this->successResponse(GamePlayResource::collection($gamePlays));
    }
}