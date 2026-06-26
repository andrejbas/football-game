<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Horizon Domain
    |--------------------------------------------------------------------------
    */
    'domain' => env('HORIZON_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Path
    |--------------------------------------------------------------------------
    */
    'path' => env('HORIZON_PATH', 'horizon'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Connection
    |--------------------------------------------------------------------------
    */
    'use' => 'default',

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Prefix
    |--------------------------------------------------------------------------
    */
    'prefix' => env('HORIZON_PREFIX', Str::slug(env('APP_NAME', 'football-sim'), '_') . '_horizon:'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Route Middleware
    | Restrict the Horizon dashboard to admins only.
    |--------------------------------------------------------------------------
    */
    'middleware' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Queue Wait Time Thresholds (seconds)
    |--------------------------------------------------------------------------
    */
    'waits' => [
        'redis:simulation' => 10,   // alert if simulation queue waits > 10s
        'redis:rewards'    => 60,
        'redis:default'    => 120,
    ],

    /*
    |--------------------------------------------------------------------------
    | Job Trimming (minutes)
    |--------------------------------------------------------------------------
    */
    'trim' => [
        'recent'        => 60,
        'pending'       => 60,
        'completed'     => 60,
        'recent_failed' => 10080,   // 7 days
        'failed'        => 10080,
        'monitored'     => 10080,
    ],

    /*
    |--------------------------------------------------------------------------
    | Silenced Jobs (excluded from Horizon dashboard)
    |--------------------------------------------------------------------------
    */
    'silenced' => [],

    /*
    |--------------------------------------------------------------------------
    | Metrics
    |--------------------------------------------------------------------------
    */
    'metrics' => [
        'trim_snapshots' => [
            'job'   => 24,
            'queue' => 24,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Fast Termination
    |--------------------------------------------------------------------------
    */
    'fast_termination' => false,

    /*
    |--------------------------------------------------------------------------
    | Memory Limit (MB)
    |--------------------------------------------------------------------------
    */
    'memory_limit' => 128,

    /*
    |--------------------------------------------------------------------------
    | Queue Worker Supervisors
    |--------------------------------------------------------------------------
    |
    | Three dedicated pools:
    |   simulation  – high-priority, match flow (5 workers)
    |   rewards     – medium-priority, XP + loot drops (3 workers)
    |   default     – low-priority, admin / scheduler tasks (2 workers)
    |
    */
    'environments' => [

        'production' => [

            'simulation-supervisor' => [
                'connection'  => 'redis',
                'queue'       => ['simulation'],
                'balance'     => 'simple',
                'processes'   => 5,
                'tries'       => 3,
                'timeout'     => 60,
                'nice'        => 0,
            ],

            'rewards-supervisor' => [
                'connection'  => 'redis',
                'queue'       => ['rewards'],
                'balance'     => 'auto',
                'processes'   => 3,
                'tries'       => 5,
                'timeout'     => 120,
                'nice'        => 5,
            ],

            'default-supervisor' => [
                'connection'  => 'redis',
                'queue'       => ['default'],
                'balance'     => 'auto',
                'processes'   => 2,
                'tries'       => 3,
                'timeout'     => 180,
                'nice'        => 10,
            ],
        ],

        'local' => [

            'local-supervisor' => [
                'connection' => 'redis',
                'queue'      => ['simulation', 'rewards', 'default'],
                'balance'    => 'simple',
                'processes'  => 3,
                'tries'      => 3,
                'timeout'    => 180,
            ],
        ],
    ],

];