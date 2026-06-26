<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\Game\SeasonAlreadyActiveException;
use App\Http\Controllers\Controller;
use App\Http\Requests\League\StoreLeagueRequest;
use App\Http\Resources\LeagueResource;
use App\Jobs\AdvanceGameDayJob;
use App\Models\League;
use App\Services\LeagueService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;

class LeagueAdminController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly LeagueService $leagueService) {}

    public function store(StoreLeagueRequest $request): JsonResponse
    {
        $league = $this->leagueService->createLeague($request->validated());

        return $this->createdResponse(LeagueResource::make($league), 'League created.');
    }

    public function start(League $league): JsonResponse
    {
        try {
            $this->leagueService->startSeason($league);
        } catch (SeasonAlreadyActiveException $e) {
            return $this->errorResponse($e->getMessage(), 409);
        } catch (\DomainException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            LeagueResource::make($league->fresh()),
            'Season started. Schedule generated.'
        );
    }

    public function forceEndSeason(League $league): JsonResponse
    {
        if (! $league->isActive()) {
            return $this->errorResponse('League is not active.', 422);
        }

        $this->leagueService->endSeason($league);

        return $this->successResponse(
            LeagueResource::make($league->fresh()),
            'Season ended and archived.'
        );
    }

    public function reset(League $league): JsonResponse
    {
        $this->leagueService->resetLeague($league);

        return $this->successResponse(
            LeagueResource::make($league->fresh()),
            'League reset. Ready for new season.'
        );
    }

    public function advanceGameDay(League $league): JsonResponse
    {
        if (! $league->isActive()) {
            return $this->errorResponse('League is not active.', 422);
        }

        AdvanceGameDayJob::dispatch();

        return $this->successResponse(null, 'Game day advancement queued.');
    }
}