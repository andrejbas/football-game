<?php

namespace App\Enums;

enum WinnerSide: string
{
    case Home = 'home';
    case Away = 'away';
    case Draw = 'draw';
}