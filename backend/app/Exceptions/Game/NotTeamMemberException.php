<?php

namespace App\Exceptions\Game;

use Exception;

class NotTeamMemberException extends Exception {

    public function __construct() 
    { 
        parent::__construct('Player is not a member of this team.'); 
    }
}