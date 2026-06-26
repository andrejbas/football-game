<?php

namespace App\Exceptions\Game;

use Exception;

class TeamFullException extends Exception
{
    public function __construct()
    {
        parent::__construct('Team has reached the maximum roster size of 23 players.');
    }
}