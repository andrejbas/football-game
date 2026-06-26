<?php

namespace App\Jobs;

use App\Services\PlayerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ResetDailyEnergyJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function handle(PlayerService $service): void
    {
        $service->resetDailyEnergy();

        Log::info('ResetDailyEnergyJob: all player energy reset to max.');
    }

    public function failed(\Throwable $e): void
    {
        Log::error('ResetDailyEnergyJob failed', ['error' => $e->getMessage()]);
    }
}