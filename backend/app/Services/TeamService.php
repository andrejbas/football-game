<?php

namespace App\Services;

use App\Exceptions\Game\AlreadyInTeamException;
use App\Exceptions\Game\NotTeamMemberException;
use App\Exceptions\Game\TeamFullException;
use App\Models\Player;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TeamService
{
    public function createTeam(User $user, array $data): Team
    {
        return DB::transaction(function () use ($user, $data) {
            $team = Team::create([
                'name'     => $data['name'],
                'owner_id' => $user->id,
            ]);

            // Owner automatically joins their team
            $team->members()->attach($user->id, [
                'id'        => (string) Str::ulid(),
                'joined_at' => now(),
            ]);

            // Associate player record
            if ($user->player) {
                $user->player->update(['team_id' => $team->id]);
            }

            return $team;
        });
    }

    public function updateTeam(Team $team, array $data): Team
    {
        $team->update(array_filter([
            'name' => $data['name'] ?? null,
        ]));

        return $team->fresh();
    }

    public function deleteTeam(Team $team): void
    {
        DB::transaction(function () use ($team) {
            // Detach all members
            $team->members()->detach();

            // Nullify player team associations
            Player::where('team_id', $team->id)->update(['team_id' => null]);

            $team->delete();
        });
    }

    /**
     * @throws TeamFullException
     * @throws AlreadyInTeamException
     */
    public function joinTeam(User $user, Team $team): void
    {
        if ($team->isFull()) {
            throw new TeamFullException();
        }

        if ($team->hasMember($user)) {
            throw new AlreadyInTeamException();
        }

        DB::transaction(function () use ($user, $team) {
            $team->members()->attach($user->id, [
                'id'        => (string) Str::ulid(),
                'joined_at' => now(),
            ]);

            if ($user->player) {
                $user->player->update(['team_id' => $team->id]);
            }
        });
    }

    /**
     * @throws NotTeamMemberException
     */
    public function leaveTeam(User $user, Team $team): void
    {
        if (! $team->hasMember($user)) {
            throw new NotTeamMemberException();
        }

        DB::transaction(function () use ($user, $team) {
            $team->members()->detach($user->id);

            if ($user->player) {
                $user->player->update(['team_id' => null]);
            }

            // Transfer ownership if the owner is leaving
            if ($team->owner_id === $user->id) {
                $this->transferOwnership($team);
            }
        });
    }

    public function getTeamRoster(Team $team): Collection
    {
        return $team->players()->with('user')->get();
    }

    private function transferOwnership(Team $team): void
    {
        $nextMember = $team->members()
            ->where('users.id', '!=', $team->owner_id)
            ->first();

        if ($nextMember) {
            $team->update(['owner_id' => $nextMember->id]);
        } else {
            // No members left, delete team
            $team->delete();
        }
    }
}