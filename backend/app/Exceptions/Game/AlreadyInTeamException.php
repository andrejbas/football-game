<?php

namespace App\Exceptions\Game;

use Exception;

class AlreadyInTeamException extends Exception {
    
    public function __construct() 
    { 
        parent::__construct('Player is already a member of this team.'); 
    }
}