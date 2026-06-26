<?php

namespace App\Exceptions\Game;

use Exception;

class InvalidMergeException extends Exception {
    public function __construct(string $reason) 
    { 
        parent::__construct("Invalid merge: {$reason}"); 
    }
}