<?php

namespace App\Http\Requests\Player;

use Illuminate\Foundation\Http\FormRequest;

class TrainPlayerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'energy_invested' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }
}