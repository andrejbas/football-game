<?php

namespace App\Enums;

enum GamePlayStatus: string
{
    case Pending   = 'pending';
    case Active    = 'active';
    case Completed = 'completed';
}