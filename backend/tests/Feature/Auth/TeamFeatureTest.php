<?php

namespace Tests\Feature\Team;

use App\Models\Player;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamFeatureTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsPlayer(): array
    {
        $user  = User::factory()->has(Player::factory())->create();
        $token = $user->createToken('api')->plainTextToken;
        return [$user, $token];
    }

    public function test_user_can_create_team(): void
    {
        [$user, $token] = $this->actingAsPlayer();

        $response = $this->withToken($token)
            ->postJson('/api/teams', ['name' => 'Alpha FC']);

        $response->assertStatus(201)
                 ->assertJsonPath('data.name', 'Alpha FC');

        $this->assertDatabaseHas('teams', ['name' => 'Alpha FC', 'owner_id' => $user->id]);
    }

    public function test_team_name_must_be_unique(): void
    {
        [$user, $token] = $this->actingAsPlayer();
        Team::factory()->create(['name' => 'Taken Name']);

        $response = $this->withToken($token)
            ->postJson('/api/teams', ['name' => 'Taken Name']);

        $response->assertStatus(422);
    }

    public function test_user_can_join_a_team(): void
    {
        [$user, $token] = $this->actingAsPlayer();
        $team = Team::factory()->create();

        $response = $this->withToken($token)
            ->postJson("/api/teams/{$team->id}/join");

        $response->assertStatus(200);
        $this->assertTrue($team->hasMember($user));
    }

    public function test_joining_full_team_returns_422(): void
    {
        [$user, $token] = $this->actingAsPlayer();

        $team = Team::factory()->create();

        // Fill team to 23 players
        $players = Player::factory()->count(23)->create(['team_id' => $team->id]);
        foreach ($players as $p) {
            $team->members()->attach($p->user_id, ['joined_at' => now()]);
        }

        $response = $this->withToken($token)
            ->postJson("/api/teams/{$team->id}/join");

        $response->assertStatus(422)
                 ->assertJsonPath('success', false);
    }

    public function test_user_can_leave_team(): void
    {
        [$user, $token] = $this->actingAsPlayer();
        $team = Team::factory()->create();
        $team->members()->attach($user->id, ['joined_at' => now()]);
        $user->player->update(['team_id' => $team->id]);

        $response = $this->withToken($token)
            ->deleteJson("/api/teams/{$team->id}/leave");

        $response->assertStatus(200);
        $this->assertFalse($team->fresh()->hasMember($user));
    }

    public function test_only_owner_can_update_team(): void
    {
        [$owner,    $ownerToken]    = $this->actingAsPlayer();
        [$nonOwner, $nonOwnerToken] = $this->actingAsPlayer();

        $team = Team::factory()->create(['owner_id' => $owner->id]);

        $this->withToken($ownerToken)
            ->patchJson("/api/teams/{$team->id}", ['name' => 'New Name'])
            ->assertStatus(200);

        $this->withToken($nonOwnerToken)
            ->patchJson("/api/teams/{$team->id}", ['name' => 'Hijack'])
            ->assertStatus(403);
    }

    public function test_team_roster_lists_players(): void
    {
        [$user, $token] = $this->actingAsPlayer();
        $team = Team::factory()->create();
        $team->members()->attach($user->id, ['joined_at' => now()]);
        $user->player->update(['team_id' => $team->id]);

        $response = $this->withToken($token)
            ->getJson("/api/teams/{$team->id}/members");

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => [['id', 'name']]]);
    }
}