<?php

namespace App\Exceptions\Game;

use Exception;

class GamePlayNotActiveException extends Exception {
    public function __construct() 
    { 
        parent::__construct('This GamePlay phase is not currently active.'); 
    }
}