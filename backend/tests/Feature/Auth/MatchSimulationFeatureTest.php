<?php

namespace Tests\Feature\Match;

use App\Enums\GamePlayStatus;
use App\Enums\MatchStatus;
use App\Events\GamePlayFinished;
use App\Events\MatchFinished;
use App\Events\MatchStarted;
use App\Jobs\DistributeRewardsJob;
use App\Jobs\ProcessGamePlayJob;
use App\Models\FootballMatch;
use App\Models\GamePlay;
use App\Models\League;
use App\Models\Player;
use App\Models\Team;
use App\Models\User;
use App\Services\MatchSimulationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class MatchSimulationFeatureTest extends TestCase
{
    use RefreshDatabase;

    private MatchSimulationService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $playerService = app(\App\Services\PlayerService::class);
        $leagueService = app(\App\Services\LeagueService::class);

        $this->service = new MatchSimulationService($playerService, $leagueService);
    }

    private function makeMatchWithTeams(): array
    {
        $league    = League::factory()->create();
        $homeTeam  = Team::factory()->create(['league_id' => $league->id]);
        $awayTeam  = Team::factory()->create(['league_id' => $league->id]);

        $homePlayer = Player::factory()->for(User::factory()->create(), 'user')
            ->create(['team_id' => $homeTeam->id, 'energy_current' => 100]);
        $awayPlayer = Player::factory()->for(User::factory()->create(), 'user')
            ->create(['team_id' => $awayTeam->id, 'energy_current' => 100]);

        $homeTeam->members()->attach($homePlayer->user_id, ['joined_at' => now()]);
        $awayTeam->members()->attach($awayPlayer->user_id, ['joined_at' => now()]);

        $match = FootballMatch::factory()->create([
            'league_id'    => $league->id,
            'home_team_id' => $homeTeam->id,
            'away_team_id' => $awayTeam->id,
            'status'       => MatchStatus::Scheduled,
        ]);

        return [$match, $homeTeam, $awayTeam, $homePlayer, $awayPlayer];
    }

    // ── startMatch ────────────────────────────────────────────────────────────

    public function test_start_match_creates_eleven_game_plays(): void
    {
        Queue::fake();
        Event::fake();

        [$match] = $this->makeMatchWithTeams();

        $this->service->startMatch($match);

        $this->assertEquals(11, GamePlay::where('match_id', $match->id)->count());
    }

    public function test_start_match_activates_phase_one(): void
    {
        Queue::fake();
        Event::fake();

        [$match] = $this->makeMatchWithTeams();

        $this->service->startMatch($match);

        $phase1 = GamePlay::where('match_id', $match->id)
            ->where('phase_number', 1)
            ->first();

        $this->assertEquals(GamePlayStatus::Active, $phase1->status);
    }

    public function test_start_match_fires_match_started_event(): void
    {
        Queue::fake();
        Event::fake([MatchStarted::class]);

        [$match] = $this->makeMatchWithTeams();

        $this->service->startMatch($match);

        Event::assertDispatched(MatchStarted::class);
    }

    public function test_start_match_dispatches_process_gameplay_job(): void
    {
        Queue::fake();
        Event::fake();

        [$match] = $this->makeMatchWithTeams();

        $this->service->startMatch($match);

        Queue::assertPushed(ProcessGamePlayJob::class);
    }

    // ── contributeToGamePlay ──────────────────────────────────────────────────

    public function test_player_can_contribute_energy_to_active_gameplay(): void
    {
        $league   = League::factory()->create();
        $homeTeam = Team::factory()->create(['league_id' => $league->id]);
        $awayTeam = Team::factory()->create(['league_id' => $league->id]);

        $player = Player::factory()->for(User::factory()->create(), 'user')
            ->create(['team_id' => $homeTeam->id, 'energy_current' => 100]);
        $player->setRelation('equippedItems', collect());

        $match = FootballMatch::factory()->create([
            'league_id'    => $league->id,
            'home_team_id' => $homeTeam->id,
            'away_team_id' => $awayTeam->id,
            'status'       => MatchStatus::InProgress,
        ]);

        $gamePlay = GamePlay::factory()->create([
            'match_id'     => $match->id,
            'phase_number' => 1,
            'status'       => GamePlayStatus::Active,
        ]);

        $contribution = $this->service->contributeToGamePlay($player, $gamePlay, 20);

        $this->assertEquals(20, $contribution->energy_invested);
        $this->assertGreaterThan(0, $contribution->points_contributed);
        $this->assertEquals(80, $player->fresh()->energy_current);
    }

    public function test_contribution_fails_with_insufficient_energy(): void
    {
        $this->expectException(\App\Exceptions\Game\InsufficientEnergyException::class);

        $league   = League::factory()->create();
        $homeTeam = Team::factory()->create(['league_id' => $league->id]);
        $awayTeam = Team::factory()->create(['league_id' => $league->id]);

        $player = Player::factory()->for(User::factory()->create(), 'user')
            ->create(['team_id' => $homeTeam->id, 'energy_current' => 5]);
        $player->setRelation('equippedItems', collect());

        $match = FootballMatch::factory()->create([
            'league_id'    => $league->id,
            'home_team_id' => $homeTeam->id,
            'away_team_id' => $awayTeam->id,
            'status'       => MatchStatus::InProgress,
        ]);

        $gamePlay = GamePlay::factory()->create([
            'match_id' => $match->id,
            'status'   => GamePlayStatus::Active,
        ]);

        $this->service->contributeToGamePlay($player, $gamePlay, 50);
    }

    public function test_contribution_fails_when_gameplay_not_active(): void
    {
        $this->expectException(\App\Exceptions\Game\GamePlayNotActiveException::class);

        $league   = League::factory()->create();
        $homeTeam = Team::factory()->create(['league_id' => $league->id]);
        $awayTeam = Team::factory()->create(['league_id' => $league->id]);

        $player = Player::factory()->for(User::factory()->create(), 'user')
            ->create(['team_id' => $homeTeam->id, 'energy_current' => 100]);
        $player->setRelation('equippedItems', collect());

        $match = FootballMatch::factory()->create([
            'league_id'    => $league->id,
            'home_team_id' => $homeTeam->id,
            'away_team_id' => $awayTeam->id,
        ]);

        $gamePlay = GamePlay::factory()->create([
            'match_id' => $match->id,
            'status'   => GamePlayStatus::Pending,   // not active
        ]);

        $this->service->contributeToGamePlay($player, $gamePlay, 20);
    }

    // ── simulateGamePlay ──────────────────────────────────────────────────────

    public function test_simulate_gameplay_resolves_winner_and_scores_goal(): void
    {
        Queue::fake();
        Event::fake([GamePlayFinished::class]);

        $league   = League::factory()->create();
        $homeTeam = Team::factory()->create(['league_id' => $league->id]);
        $awayTeam = Team::factory()->create(['league_id' => $league->id]);

        $match = FootballMatch::factory()->create([
            'league_id'    => $league->id,
            'home_team_id' => $homeTeam->id,
            'away_team_id' => $awayTeam->id,
            'status'       => MatchStatus::InProgress,
            'home_score'   => 0,
            'away_score'   => 0,
        ]);

        // Create all 11 phases
        GamePlay::factory()->count(11)->sequence(fn ($s) => [
            'phase_number' => $s->index + 1,
            'status'       => $s->index === 0 ? GamePlayStatus::Active : GamePlayStatus::Pending,
        ])->create(['match_id' => $match->id]);

        $gamePlay = GamePlay::where('match_id', $match->id)
            ->where('phase_number', 1)
            ->first();

        // Home team contributes more points
        \App\Models\GamePlayContribution::create([
            'game_play_id'       => $gamePlay->id,
            'player_id'          => Player::factory()->create(['team_id' => $homeTeam->id])->id,
            'team_id'            => $homeTeam->id,
            'energy_invested'    => 50,
            'points_contributed' => 500,
        ]);

        \App\Models\GamePlayContribution::create([
            'game_play_id'       => $gamePlay->id,
            'player_id'          => Player::factory()->create(['team_id' => $awayTeam->id])->id,
            'team_id'            => $awayTeam->id,
            'energy_invested'    => 10,
            'points_contributed' => 50,
        ]);

        $this->service->simulateGamePlay($gamePlay);

        $gamePlay->refresh();
        $match->refresh();

        $this->assertEquals(GamePlayStatus::Completed, $gamePlay->status);
        $this->assertEquals('home', $gamePlay->winner_side->value);
        $this->assertEquals(1, $match->home_score);
        $this->assertEquals(0, $match->away_score);

        Event::assertDispatched(GamePlayFinished::class);
    }

    // ── finalizeMatch ─────────────────────────────────────────────────────────

    public function test_finalize_match_sets_status_to_completed_and_dispatches_rewards(): void
    {
        Queue::fake();
        Event::fake([MatchFinished::class]);

        $league   = League::factory()->create();
        $homeTeam = Team::factory()->create(['league_id' => $league->id]);
        $awayTeam = Team::factory()->create(['league_id' => $league->id]);

        $match = FootballMatch::factory()->create([
            'league_id'    => $league->id,
            'home_team_id' => $homeTeam->id,
            'away_team_id' => $awayTeam->id,
            'status'       => MatchStatus::InProgress,
        ]);

        $this->service->finalizeMatch($match);

        $match->refresh();

        $this->assertEquals(MatchStatus::Completed, $match->status);
        $this->assertNotNull($match->finished_at);

        Queue::assertPushed(DistributeRewardsJob::class);
        Event::assertDispatched(MatchFinished::class);
    }
}