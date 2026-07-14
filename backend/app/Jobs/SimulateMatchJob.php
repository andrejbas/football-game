<?php

namespace App\Jobs;

use App\Exceptions\Game\MatchNotScheduledException;
use App\Models\FootballMatch;
use App\Services\MatchSimulationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SimulateMatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 10;

    public function __construct(public readonly string $matchId) {}

    public function handle(MatchSimulationService $service): void
    {
        $match = FootballMatch::findOrFail($this->matchId);

        try {
            $service->startMatch($match);
        } catch (MatchNotScheduledException $e) {
            Log::warning('SimulateMatchJob: match not in scheduled state', [
                'match_id' => $this->matchId,
                'status'   => $match->status,
            ]);
            // Don't fail the job — idempotent skip
            $this->delete();
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error('SimulateMatchJob failed', [
            'match_id' => $this->matchId,
            'error'    => $e->getMessage(),
        ]);
    }
}