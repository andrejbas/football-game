<?php

namespace App\Exceptions\Game;

use Exception;

class SeasonAlreadyActiveException extends Exception {

    public function __construct() 
    { 
        parent::__construct('A season is already active for this league.'); 
    }
}