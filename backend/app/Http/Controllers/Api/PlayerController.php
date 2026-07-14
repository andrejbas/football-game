<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\Game\InsufficientEnergyException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Player\TrainPlayerRequest;
use App\Http\Requests\Player\UpdatePlayerRequest;
use App\Http\Resources\PlayerResource;
use App\Models\Player;
use App\Services\PlayerService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly PlayerService $playerService) {}

    public function show(Request $request): JsonResponse
    {
        $player = $request->user()
            ->player()
            ->with(['team', 'equippedItems'])
            ->firstOrFail();

        return $this->successResponse(PlayerResource::make($player));
    }

    /**
     * Public profile view for any player by ID, e.g. GET /players/{player}.
     */
    public function showPlayer(Player $player): JsonResponse
    {
        $player->load(['team', 'equippedItems']);

        return $this->successResponse(PlayerResource::make($player));
    }

    public function update(UpdatePlayerRequest $request): JsonResponse
    {
        $player = $request->user()->player;

        $this->authorize('update', $player);

        $player->update($request->validated());

        return $this->successResponse(PlayerResource::make($player->fresh()), 'Player updated.');
    }

    public function train(TrainPlayerRequest $request): JsonResponse
    {
        $player = $request->user()->player;

        $this->authorize('update', $player);

        try {
            $this->playerService->train($player, $request->validated('energy_invested'));
        } catch (InsufficientEnergyException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(PlayerResource::make($player->fresh(['team', 'equippedItems'])), 'Training complete.');
    }

    public function energyStatus(Request $request): JsonResponse
    {
        $player = $request->user()->player;

        return $this->successResponse([
            'current'    => $player->energy_current,
            'max'        => $player->energy_max,
            'regen_rate' => $player->energy_regen_rate,
            'pct'        => $player->energy_max > 0
                ? round(($player->energy_current / $player->energy_max) * 100, 1)
                : 0,
        ]);
    }
}