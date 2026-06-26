<?php
namespace App\Events;
use App\Models\League;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
class SeasonEnded {
    use Dispatchable, SerializesModels;
    public function __construct(public readonly League $league) {}
}