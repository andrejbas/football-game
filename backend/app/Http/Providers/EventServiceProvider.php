<?php

namespace App\Providers;

use App\Events\GamePlayFinished;
use App\Events\MatchFinished;
use App\Events\MatchStarted;
use App\Events\PlayerLevelUp;
use App\Events\SeasonEnded;
use App\Listeners\ArchiveSeasonData;
use App\Listeners\GrantLevelUpReward;
use App\Listeners\LogGamePlayResult;
use App\Listeners\LogMatchResult;
use App\Listeners\LogMatchStarted;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        MatchStarted::class => [
            LogMatchStarted::class,
        ],

        GamePlayFinished::class => [
            LogGamePlayResult::class,
        ],

        MatchFinished::class => [
            LogMatchResult::class,
        ],

        PlayerLevelUp::class => [
            GrantLevelUpReward::class,
        ],

        SeasonEnded::class => [
            ArchiveSeasonData::class,
        ],
    ];

    public function boot(): void
    {
        //
    }

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}