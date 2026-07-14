<?php
namespace App\Events;
use App\Models\GamePlay;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
class GamePlayFinished {
    use Dispatchable, SerializesModels;
    public function __construct(public readonly GamePlay $gamePlay) {}
}