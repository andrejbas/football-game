<?php

namespace App\Http\Requests\Team;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $teamId = $this->route('team')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:100', "unique:teams,name,{$teamId}"],
        ];
    }
}