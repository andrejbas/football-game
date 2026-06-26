<?php

use App\Jobs\AdvanceGameDayJob;
use App\Jobs\EndSeasonJob;
use App\Jobs\ProcessPendingGamePlaysJob;
use App\Jobs\ResetDailyEnergyJob;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes / Scheduler
|--------------------------------------------------------------------------
|
| Each task is guarded with withoutOverlapping() to prevent pile-up
| if a previous run is still executing.
|
| NOTE: The queue each job runs on is declared via the $queue property
| on the job class itself — Schedule::job() does not support onQueue().
|
*/

// ── Safety-net: re-dispatch any stale active GamePlays every 5 minutes.
// The primary trigger is the ProcessGamePlayJob chain (self-dispatching with
// a 3-minute delay), but this catches jobs that were silently dropped.
// Queue: 'simulation' (set on ProcessPendingGamePlaysJob::$queue)
Schedule::job(new ProcessPendingGamePlaysJob)
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->name('process-pending-game-plays');

// ── Advance the game day for all active leagues once per hour.
// The job itself checks that all current-day matches are finished
// before incrementing, so it is safe to run frequently.
// Queue: 'default' (set on AdvanceGameDayJob::$queue)
Schedule::job(new AdvanceGameDayJob)
    ->hourly()
    ->withoutOverlapping()
    ->name('advance-game-day');

// ── Check whether any active league has completed all 18 game days
// and end the season if so. Runs every 30 minutes.
// Queue: 'default' (set on EndSeasonJob::$queue)
Schedule::job(new EndSeasonJob)
    ->everyThirtyMinutes()
    ->withoutOverlapping()
    ->name('end-season');

// ── Reset all player energy to their maximum value at midnight every day.
// Queue: 'default' (set on ResetDailyEnergyJob::$queue)
Schedule::job(new ResetDailyEnergyJob)
    ->dailyAt('00:00')
    ->withoutOverlapping()
    ->name('reset-daily-energy');

// ── Prune stale Sanctum tokens older than 30 days (built-in Laravel command).
Schedule::command('sanctum:prune-expired --hours=720')
    ->daily()
    ->name('prune-expired-tokens');