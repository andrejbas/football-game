<?php

namespace App\Enums;

enum LeagueStatus: string
{
    case Pending   = 'pending';
    case Active    = 'active';
    case Completed = 'completed';
}