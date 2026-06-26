<?php

namespace App\Exceptions\Game;

use Exception;

class InsufficientEnergyException extends Exception {

    public function __construct(int $required, int $available) 
    {
        parent::__construct("Insufficient energy. Required: {$required}, available: {$available}.");
    }
}