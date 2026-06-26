<?php

namespace App\Jobs;

use App\Enums\GamePlayStatus;
use App\Models\GamePlay;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Safety-net job that catches any active GamePlays whose
 * ProcessGamePlayJob was lost/failed without retrying.
 * Dispatches fresh ProcessGamePlayJob instances for them.
 * Should run every 3–5 minutes via the scheduler.
 */
class ProcessPendingGamePlaysJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    // A GamePlay is considered stale if active for > 5 minutes without resolution
    private const STALE_THRESHOLD_MINUTES = 5;

    public function handle(): void
    {
        $staleGamePlays = GamePlay::where('status', GamePlayStatus::Active)
            ->where('started_at', '<', now()->subMinutes(self::STALE_THRESHOLD_MINUTES))
            ->get();

        if ($staleGamePlays->isEmpty()) {
            return;
        }

        Log::warning('ProcessPendingGamePlaysJob: found stale active GamePlays.', [
            'count' => $staleGamePlays->count(),
        ]);

        foreach ($staleGamePlays as $gamePlay) {
            ProcessGamePlayJob::dispatch($gamePlay->id)
                ->onQueue('simulation');

            Log::info('ProcessPendingGamePlaysJob: re-dispatched.', [
                'game_play_id' => $gamePlay->id,
                'match_id'     => $gamePlay->match_id,
                'phase_number' => $gamePlay->phase_number,
            ]);
        }
    }
}