<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\Game\InvalidMergeException;
use App\Exceptions\Game\MaxRarityReachedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Equipment\MergeEquipmentRequest;
use App\Http\Resources\EquipmentResource;
use App\Models\Equipment;
use App\Services\EquipmentService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly EquipmentService $equipmentService) {}

    public function index(Request $request): JsonResponse
    {
        $inventory = $this->equipmentService->getPlayerInventory(
            $request->user()->player
        );

        return $this->successResponse(EquipmentResource::collection($inventory));
    }

    public function show(Request $request, Equipment $equipment): JsonResponse
    {
        $this->authorize('view', $equipment);

        return $this->successResponse(EquipmentResource::make($equipment));
    }

    public function equip(Request $request, Equipment $equipment): JsonResponse
    {
        $this->authorize('manage', $equipment);

        $this->equipmentService->equipItem($request->user()->player, $equipment);

        return $this->successResponse(
            EquipmentResource::make($equipment->fresh()),
            'Equipment equipped successfully.'
        );
    }

    public function unequip(Request $request, Equipment $equipment): JsonResponse
    {
        $this->authorize('manage', $equipment);

        $this->equipmentService->unequipItem($request->user()->player, $equipment);

        return $this->successResponse(
            EquipmentResource::make($equipment->fresh()),
            'Equipment unequipped successfully.'
        );
    }

    public function merge(MergeEquipmentRequest $request): JsonResponse
    {
        try {
            $merged = $this->equipmentService->mergeEquipment(
                $request->user()->player,
                $request->validated('equipment_ids')
            );
        } catch (MaxRarityReachedException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (InvalidMergeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->createdResponse(
            EquipmentResource::make($merged),
            'Merge successful. New item created.'
        );
    }
}