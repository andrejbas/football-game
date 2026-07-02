<?php

namespace Database\Seeders;

use App\Enums\LeagueStatus;
use App\Enums\UserRole;
use App\Jobs\AdvanceGameDayJob;
use App\Models\League;
use App\Models\Player;
use App\Models\User;
use App\Services\LeagueService;
use App\Services\TeamService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoGameSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password123');

        $admin = User::create([
            'name' => 'Admin Coach',
            'email' => 'admin@football.test',
            'password' => $password,
            'role' => UserRole::Admin,
        ]);

        $players = collect([
            ['name' => 'Alex Striker', 'email' => 'alex@football.test', 'attack' => 18, 'speed' => 16, 'technique' => 15],
            ['name' => 'Ben Shield', 'email' => 'ben@football.test', 'defense' => 18, 'stamina' => 16],
            ['name' => 'Chris Engine', 'email' => 'chris@football.test', 'stamina' => 18, 'speed' => 14],
            ['name' => 'Dylan Playmaker', 'email' => 'dylan@football.test', 'technique' => 19, 'attack' => 14],
        ])->map(function (array $data) use ($password) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $password,
                'role' => UserRole::Player,
            ]);

            Player::create([
                'user_id' => $user->id,
                'name' => $data['name'],
                'level' => 1,
                'xp' => 0,
                'xp_to_next_level' => 100,
                'attack' => $data['attack'] ?? 10,
                'defense' => $data['defense'] ?? 10,
                'stamina' => $data['stamina'] ?? 10,
                'speed' => $data['speed'] ?? 10,
                'technique' => $data['technique'] ?? 10,
                'energy_current' => 100,
                'energy_max' => 100,
                'energy_regen_rate' => 10,
            ]);

            return $user->fresh();
        });

        $league = League::create([
            'name' => 'Demo Premier League',
            'season_number' => 1,
            'status' => LeagueStatus::Pending,
            'current_game_day' => 0,
        ]);

        /** @var TeamService $teamService */
        $teamService = app(TeamService::class);
        /** @var LeagueService $leagueService */
        $leagueService = app(LeagueService::class);

        $teamA = $teamService->createTeam($players[0], ['name' => 'North FC']);
        $teamB = $teamService->createTeam($players[2], ['name' => 'South United']);

        $teamA->update(['league_id' => $league->id]);
        $teamB->update(['league_id' => $league->id]);

        $teamService->joinTeam($players[1], $teamA);
        $teamService->joinTeam($players[3], $teamB);

        $leagueService->startSeason($league->fresh(['teams']));
        AdvanceGameDayJob::dispatchSync();
    }
}