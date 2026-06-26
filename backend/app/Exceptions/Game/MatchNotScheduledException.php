<?php

namespace App\Exceptions\Game;

use Exception;

class MatchNotScheduledException extends Exception {

    public function __construct() 
    { 
        parent::__construct('Match is not in a scheduled state.'); 
    }
}