<?php

namespace Tests\Unit\Services;

use App\Enums\LeagueStatus;
use App\Enums\MatchStatus;
use App\Exceptions\Game\SeasonAlreadyActiveException;
use App\Models\FootballMatch;
use App\Models\League;
use App\Models\Team;
use App\Services\LeagueService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeagueServiceTest extends TestCase
{
    use RefreshDatabase;

    private LeagueService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new LeagueService();
    }

    // ── Schedule Generation ───────────────────────────────────────────────────

    public function test_start_season_generates_correct_match_count_for_four_teams(): void
    {
        $league = League::factory()->create();
        Team::factory()->count(4)->create(['league_id' => $league->id]);

        $this->service->startSeason($league);

        // 4 teams: 4*3/2 = 6 home fixtures × 2 (H+A) = 12 total matches
        $this->assertEquals(12, FootballMatch::where('league_id', $league->id)->count());
    }

    public function test_each_team_plays_every_other_team_twice(): void
    {
        $league = League::factory()->create();
        $teams  = Team::factory()->count(4)->create(['league_id' => $league->id]);

        $this->service->startSeason($league);

        foreach ($teams as $teamA) {
            foreach ($teams as $teamB) {
                if ($teamA->id === $teamB->id) {
                    continue;
                }

                // There must be exactly one fixture where A is home vs B
                $count = FootballMatch::where('home_team_id', $teamA->id)
                    ->where('away_team_id', $teamB->id)
                    ->where('league_id', $league->id)
                    ->count();

                $this->assertEquals(1, $count, "Team {$teamA->id} should be home to {$teamB->id} exactly once.");
            }
        }
    }

    public function test_start_season_throws_if_already_active(): void
    {
        $this->expectException(SeasonAlreadyActiveException::class);

        $league = League::factory()->create(['status' => LeagueStatus::Active]);
        Team::factory()->count(2)->create(['league_id' => $league->id]);

        $this->service->startSeason($league);
    }

    public function test_start_season_throws_with_fewer_than_two_teams(): void
    {
        $this->expectException(\DomainException::class);

        $league = League::factory()->create();
        Team::factory()->create(['league_id' => $league->id]);

        $this->service->startSeason($league);
    }

    // ── Standings Update ──────────────────────────────────────────────────────

    public function test_home_win_awards_three_points_to_home_team(): void
    {
        $league    = League::factory()->create(['status' => LeagueStatus::Active]);
        $homeTeam  = Team::factory()->create(['league_id' => $league->id]);
        $awayTeam  = Team::factory()->create(['league_id' => $league->id]);

        $match = FootballMatch::factory()->create([
            'league_id'    => $league->id,
            'home_team_id' => $homeTeam->id,
            'away_team_id' => $awayTeam->id,
            'home_score'   => 3,
            'away_score'   => 1,
            'status'       => MatchStatus::Completed,
        ]);

        $this->service->updateStandings($match);

        $homeTeam->refresh();
        $awayTeam->refresh();

        $this->assertEquals(3, $homeTeam->points);
        $this->assertEquals(1, $homeTeam->wins);
        $this->assertEquals(0, $awayTeam->points);
        $this->assertEquals(1, $awayTeam->losses);
    }

    public function test_draw_awards_one_point_each(): void
    {
        $league   = League::factory()->create(['status' => LeagueStatus::Active]);
        $homeTeam = Team::factory()->create(['league_id' => $league->id]);
        $awayTeam = Team::factory()->create(['league_id' => $league->id]);

        $match = FootballMatch::factory()->create([
            'league_id'    => $league->id,
            'home_team_id' => $homeTeam->id,
            'away_team_id' => $awayTeam->id,
            'home_score'   => 2,
            'away_score'   => 2,
            'status'       => MatchStatus::Completed,
        ]);

        $this->service->updateStandings($match);

        $homeTeam->refresh();
        $awayTeam->refresh();

        $this->assertEquals(1, $homeTeam->points);
        $this->assertEquals(1, $awayTeam->points);
        $this->assertEquals(1, $homeTeam->draws);
        $this->assertEquals(1, $awayTeam->draws);
    }

    // ── End Season ────────────────────────────────────────────────────────────

    public function test_end_season_creates_history_records_and_resets_standings(): void
    {
        $league   = League::factory()->create(['status' => LeagueStatus::Active]);
        $teams    = Team::factory()->count(2)->create([
            'league_id' => $league->id,
            'points'    => 9,
            'wins'      => 3,
        ]);

        $this->service->endSeason($league);

        $league->refresh();

        $this->assertEquals(LeagueStatus::Completed, $league->status);
        $this->assertNotNull($league->ended_at);

        foreach ($teams as $team) {
            $team->refresh();
            $this->assertEquals(0, $team->points);

            $this->assertDatabaseHas('season_history', [
                'league_id' => $league->id,
                'team_id'   => $team->id,
                'points'    => 9,
            ]);
        }
    }
}