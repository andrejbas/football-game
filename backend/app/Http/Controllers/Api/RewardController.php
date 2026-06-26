<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RewardResource;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RewardController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request): JsonResponse
    {
        $rewards = $request->user()
            ->player
            ->rewards()
            ->with(['equipment', 'match'])
            ->latest()
            ->paginate(30);

        return $this->successResponse(
            RewardResource::collection($rewards)->response()->getData(true)
        );
    }
}