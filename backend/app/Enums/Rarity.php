<?php

namespace App\Enums;

enum Rarity: string
{
    case Q1 = 'Q1';
    case Q2 = 'Q2';
    case Q3 = 'Q3';
    case Q4 = 'Q4';
    case Q5 = 'Q5';

    public function next(): self
    {
        return match($this) {
            self::Q1 => self::Q2,
            self::Q2 => self::Q3,
            self::Q3 => self::Q4,
            self::Q4 => self::Q5,
            self::Q5 => throw new \DomainException('Q5 is the maximum rarity tier.'),
        };
    }

    public function isMax(): bool
    {
        return $this === self::Q5;
    }

    /** Drop weight for reward rolls (out of 100) */
    public function dropWeight(): int
    {
        return match($this) {
            self::Q1 => 60,
            self::Q2 => 25,
            self::Q3 => 10,
            self::Q4 => 4,
            self::Q5 => 1,
        };
    }
}