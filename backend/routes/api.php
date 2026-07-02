<?php

use App\Http\Controllers\Admin\LeagueAdminController;
use App\Http\Controllers\Admin\UserAdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\GamePlayController;
use App\Http\Controllers\Api\LeagueController;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\RewardController;
use App\Http\Controllers\Api\SeasonController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\TeamMemberController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ─── Public Auth ─────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// ─── Authenticated Routes ─────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });

    // Player profile
    Route::prefix('player')->group(function () {
        Route::get('/',        [PlayerController::class, 'show']);
        Route::patch('/',      [PlayerController::class, 'update']);
        Route::post('/train',  [PlayerController::class, 'train']);
        Route::get('/energy',  [PlayerController::class, 'energyStatus']);
    });

    // Teams
    Route::apiResource('teams', TeamController::class);
    Route::prefix('teams/{team}')->group(function () {
        Route::post('/join',    [TeamMemberController::class, 'join']);
        Route::delete('/leave', [TeamMemberController::class, 'leave']);
        Route::get('/members',  [TeamMemberController::class, 'index']);
    });

    // Equipment
    Route::prefix('equipment')->group(function () {
        Route::get('/',                      [EquipmentController::class, 'index']);
        Route::post('/merge',                [EquipmentController::class, 'merge']);
        Route::get('/{equipment}',           [EquipmentController::class, 'show']);
        Route::post('/{equipment}/equip',    [EquipmentController::class, 'equip']);
        Route::post('/{equipment}/unequip',  [EquipmentController::class, 'unequip']);
    });

    // Leagues
    Route::prefix('leagues')->group(function () {
        Route::get('/',                       [LeagueController::class, 'index']);
        Route::get('/{league}',               [LeagueController::class, 'show']);
        Route::get('/{league}/standings',     [LeagueController::class, 'standings']);
        Route::get('/{league}/schedule',      [LeagueController::class, 'schedule']);
    });

    // Matches
    Route::prefix('matches')->group(function () {
        Route::get('/',                       [MatchController::class, 'index']);
        Route::get('/{match}',                [MatchController::class, 'show']);
        Route::get('/{match}/game-plays',     [MatchController::class, 'gamePlays']);
    });

    // GamePlay — player contributions (the primary real-time action)
    Route::prefix('game-plays')->group(function () {
        Route::get('/{gamePlay}',             [GamePlayController::class, 'show']);
        Route::post('/{gamePlay}/contribute', [GamePlayController::class, 'contribute']);
    });

    // Rewards
    Route::get('/rewards', [RewardController::class, 'index']);

    // Season
    Route::prefix('seasons')->group(function () {
        Route::get('/current', [SeasonController::class, 'current']);
        Route::get('/history', [SeasonController::class, 'history']);
    });
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'admin'])
    ->prefix('admin')
    ->group(function () {

    // League management
    Route::prefix('leagues')->group(function () {
        Route::post('/',                          [LeagueAdminController::class, 'store']);
        Route::post('/{league}/start',            [LeagueAdminController::class, 'start']);
        Route::post('/{league}/end-season',       [LeagueAdminController::class, 'forceEndSeason']);
        Route::post('/{league}/reset',            [LeagueAdminController::class, 'reset']);
        Route::post('/{league}/advance-game-day', [LeagueAdminController::class, 'advanceGameDay']);
    });

    // User management
    Route::prefix('users')->group(function () {
        Route::get('/',              [UserAdminController::class, 'index']);
        Route::get('/{user}',        [UserAdminController::class, 'show']);
        Route::post('/{user}/ban',   [UserAdminController::class, 'ban']);
    });
});