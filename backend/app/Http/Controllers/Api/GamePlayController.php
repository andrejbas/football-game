<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\Game\GamePlayNotActiveException;
use App\Exceptions\Game\InsufficientEnergyException;
use App\Http\Controllers\Controller;
use App\Http\Requests\GamePlay\ContributeRequest;
use App\Http\Resources\GamePlayContributionResource;
use App\Http\Resources\GamePlayResource;
use App\Models\GamePlay;
use App\Services\MatchSimulationService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GamePlayController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly MatchSimulationService $simulationService) {}

    public function show(GamePlay $gamePlay): JsonResponse
    {
        $gamePlay->load(['contributions.player', 'match']);

        return $this->successResponse(GamePlayResource::make($gamePlay));
    }

    public function contribute(ContributeRequest $request, GamePlay $gamePlay): JsonResponse
    {
        $this->authorize('contribute', $gamePlay);

        try {
            $contribution = $this->simulationService->contributeToGamePlay(
                $request->user()->player,
                $gamePlay,
                $request->validated('energy_invested')
            );
        } catch (GamePlayNotActiveException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (InsufficientEnergyException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\DomainException $e) {
            return $this->errorResponse($e->getMessage(), 403);
        }

        return $this->createdResponse(
            GamePlayContributionResource::make($contribution->load('player')),
            'Energy contributed successfully.'
        );
    }
}