<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BanUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;

class UserAdminController extends Controller
{
    use ApiResponseTrait;

    public function index(): JsonResponse
    {
        $users = User::with('player')->latest()->paginate(30);

        return $this->successResponse(UserResource::collection($users)->response()->getData(true));
    }

    public function show(User $user): JsonResponse
    {
        $user->load(['player.team', 'player.equippedItems']);

        return $this->successResponse(UserResource::make($user));
    }

    public function ban(BanUserRequest $request, User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return $this->errorResponse('Cannot ban an admin user.', 403);
        }

        // Revoke all tokens
        $user->tokens()->delete();

        // In a real app you'd have a `banned_at` column.
        // This is a placeholder for that logic.
        // $user->update(['banned_at' => now(), 'ban_reason' => $request->reason]);

        return $this->successResponse(null, "User {$user->name} has been banned.");
    }
}