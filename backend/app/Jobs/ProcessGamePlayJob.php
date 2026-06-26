<?php

namespace App\Jobs;

use App\Models\GamePlay;
use App\Services\MatchSimulationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessGamePlayJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 5;

    public ?string $queue = 'simulation';

    public function __construct(public readonly string $gamePlayId) {}

    public function handle(MatchSimulationService $service): void
    {
        $gamePlay = GamePlay::with('match')->findOrFail($this->gamePlayId);

        if ($gamePlay->isCompleted()) {
            Log::info('ProcessGamePlayJob: GamePlay already completed, skipping.', [
                'game_play_id' => $this->gamePlayId,
            ]);
            $this->delete();
            return;
        }

        if (! $gamePlay->isActive()) {
            Log::warning('ProcessGamePlayJob: GamePlay is not active.', [
                'game_play_id' => $this->gamePlayId,
                'status'       => $gamePlay->status,
            ]);
            $this->delete();
            return;
        }

        $service->simulateGamePlay($gamePlay);
    }

    public function failed(\Throwable $e): void
    {
        Log::error('ProcessGamePlayJob failed', [
            'game_play_id' => $this->gamePlayId,
            'error'        => $e->getMessage(),
        ]);
    }
}