<?php

namespace App\Enums;

enum RewardType: string
{
    case XP        = 'xp';
    case Equipment = 'equipment';
    case Energy    = 'energy';
}