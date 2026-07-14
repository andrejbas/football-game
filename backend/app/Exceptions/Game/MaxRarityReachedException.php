<?php

namespace App\Exceptions\Game;

use Exception;

class MaxRarityReachedException extends Exception {
    public function __construct() 
    { 
        parent::__construct('Q5 is the maximum rarity tier and cannot be merged further.'); 
    }
}