<?php

namespace App\Providers;

use App\Services\EquipmentService;
use App\Services\LeagueService;
use App\Services\MatchSimulationService;
use App\Services\PlayerService;
use App\Services\RewardService;
use App\Services\TeamService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Services are stateless, so singleton bindings are fine.
        $this->app->singleton(TeamService::class);
        $this->app->singleton(PlayerService::class);
        $this->app->singleton(EquipmentService::class);
        $this->app->singleton(LeagueService::class);

        $this->app->singleton(MatchSimulationService::class, function ($app) {
            return new MatchSimulationService(
                $app->make(PlayerService::class),
                $app->make(LeagueService::class),
            );
        });

        $this->app->singleton(RewardService::class, function ($app) {
            return new RewardService(
                $app->make(PlayerService::class),
                $app->make(EquipmentService::class),
            );
        });
    }

    public function boot(): void
    {
        //
    }
}