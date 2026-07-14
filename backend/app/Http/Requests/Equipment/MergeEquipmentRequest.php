<?php

namespace App\Http\Requests\Equipment;

use Illuminate\Foundation\Http\FormRequest;

class MergeEquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'equipment_ids'   => ['required', 'array', 'size:3'],
            'equipment_ids.*' => ['required', 'string', 'exists:equipment,id'],
        ];
    }
}