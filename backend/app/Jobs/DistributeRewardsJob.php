<?php

namespace App\Jobs;

use App\Models\FootballMatch;
use App\Services\RewardService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DistributeRewardsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 5;
    public int $backoff = 30;

    public ?string $queue = 'rewards';

    public function __construct(public readonly string $matchId) {}

    public function handle(RewardService $service): void
    {
        $match = FootballMatch::findOrFail($this->matchId);

        if (! $match->isCompleted()) {
            Log::warning('DistributeRewardsJob: match not completed, skipping.', [
                'match_id' => $this->matchId,
            ]);
            $this->delete();
            return;
        }

        $service->distributeMatchRewards($match);
    }

    public function failed(\Throwable $e): void
    {
        Log::error('DistributeRewardsJob failed', [
            'match_id' => $this->matchId,
            'error'    => $e->getMessage(),
        ]);
    }
}