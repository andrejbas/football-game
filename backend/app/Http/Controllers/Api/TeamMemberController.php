<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\Game\AlreadyInTeamException;
use App\Exceptions\Game\NotTeamMemberException;
use App\Exceptions\Game\TeamFullException;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlayerResource;
use App\Models\Team;
use App\Services\TeamService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamMemberController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly TeamService $teamService) {}

    public function index(Team $team): JsonResponse
    {
        $roster = $this->teamService->getTeamRoster($team);

        return $this->successResponse(PlayerResource::collection($roster));
    }

    public function join(Request $request, Team $team): JsonResponse
    {
        try {
            $this->teamService->joinTeam($request->user(), $team);
        } catch (TeamFullException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (AlreadyInTeamException $e) {
            return $this->errorResponse($e->getMessage(), 409);
        }

        return $this->successResponse(null, 'Successfully joined the team.');
    }

    public function leave(Request $request, Team $team): JsonResponse
    {
        try {
            $this->teamService->leaveTeam($request->user(), $team);
        } catch (NotTeamMemberException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(null, 'Successfully left the team.');
    }
}