<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\PlayerService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly PlayerService $playerService) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        // Auto-create a player profile on registration
        $this->playerService->createPlayerProfile($user, ['name' => $user->name]);

        $token = $user->createToken('api')->plainTextToken;

        return $this->createdResponse([
            'user'  => UserResource::make($user->load('player')),
            'token' => $token,
        ], 'Registration successful.');
    }

    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user  = Auth::user();
        $token = $user->createToken('api')->plainTextToken;

        return $this->successResponse([
            'user'  => UserResource::make($user->load('player')),
            'token' => $token,
        ], 'Login successful.');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logged out successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->successResponse(
            UserResource::make($request->user()->load('player'))
        );
    }
}