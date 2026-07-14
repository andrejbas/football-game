<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeagueResource;
use App\Http\Resources\MatchResource;
use App\Http\Resources\TeamResource;
use App\Models\League;
use App\Models\Player;
use App\Services\LeagueService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;

class LeagueController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly LeagueService $leagueService) {}

    public function index(): JsonResponse
    {
        $leagues = League::withCount('teams')->paginate(20);

        return $this->successResponse(LeagueResource::collection($leagues)->response()->getData(true));
    }

    public function show(League $league): JsonResponse
    {
        $league->load('teams');

        return $this->successResponse(LeagueResource::make($league));
    }

    public function standings(League $league): JsonResponse
    {
        $standings = $this->leagueService->getStandings($league);

        return $this->successResponse([
            'league'    => LeagueResource::make($league),
            'standings' => TeamResource::collection($standings),
        ]);
    }

    public function topScorers(League $league): JsonResponse
    {
        $players = Player::whereHas('team', fn ($q) => $q->where('league_id', $league->id))
            ->with('team')
            ->orderByDesc('goals_scored')
            ->take(10)
            ->get();

        return $this->successResponse([
            'league'      => LeagueResource::make($league),
            'top_scorers' => $players->map(fn (Player $player) => [
                'id'           => $player->id,
                'name'         => $player->name,
                'goals_scored' => $player->goals_scored,
                'team'         => $player->team ? [
                    'id'   => $player->team->id,
                    'name' => $player->team->name,
                ] : null,
            ]),
        ]);
    }

    public function schedule(League $league): JsonResponse
    {
        $matches = $league->matches()
            ->with(['homeTeam', 'awayTeam'])
            ->orderBy('game_day')
            ->get()
            ->groupBy('game_day');

        return $this->successResponse([
            'league'   => LeagueResource::make($league),
            'schedule' => $matches->map(fn ($dayMatches, $day) => [
                'game_day' => $day,
                'matches'  => MatchResource::collection($dayMatches),
            ])->values(),
        ]);
    }
}