<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Team\StoreTeamRequest;
use App\Http\Requests\Team\UpdateTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Services\TeamService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly TeamService $teamService) {}

    public function index(Request $request): JsonResponse
    {
        $teams = Team::with('owner')
            ->withCount('players as roster_count')
            ->paginate(20);

        return $this->successResponse(TeamResource::collection($teams)->response()->getData(true));
    }

    public function show(Team $team): JsonResponse
    {
        $team->load(['owner', 'league', 'players.user']);

        return $this->successResponse(TeamResource::make($team));
    }

    public function store(StoreTeamRequest $request): JsonResponse
    {
        $team = $this->teamService->createTeam($request->user(), $request->validated());

        return $this->createdResponse(
            TeamResource::make($team->load('owner')),
            'Team created successfully.'
        );
    }

    public function update(UpdateTeamRequest $request, Team $team): JsonResponse
    {
        $this->authorize('update', $team);

        $team = $this->teamService->updateTeam($team, $request->validated());

        return $this->successResponse(TeamResource::make($team), 'Team updated.');
    }

    public function destroy(Team $team): JsonResponse
    {
        $this->authorize('delete', $team);

        $this->teamService->deleteTeam($team);

        return $this->noContentResponse();
    }
}