<?php
// core/Matchmaker.php

class Matchmaker {

    /**
     * Generates the complete structure for a new tournament.
     */
    public static function createTournament($name, $format, $playerIds) {
        $tournamentId = 'trn_' . date('Ymd_His') . '_' . rand(100, 999);

        $tournament = [
            'id' => $tournamentId,
            'name' => $name,
            'status' => 'in_progress',
            'format' => $format,
            'current_round' => 1,
            'player_ids' => $playerIds,
            'created_at' => date('Y-m-d H:i:s'),
            'rounds' => []
        ];

        if ($format === 'rotating') {
            $tournament['rounds'] = self::generateRotatingRounds($playerIds);
        } else {
            $tournament['rounds'] = self::generateFixedRounds($playerIds);
        }

        return $tournament;
    }

    /**
     * BONUS Algorithm: Rotating Partners (King of the Court)
     * Ensures no one plays with the same partner twice.
     */
    private static function generateRotatingRounds($ids) {
        // Perfect mathematical matrix for 8 players (indexes 0 to 7)
        $matrix = [
            [[0,1], [2,3], [4,5], [6,7]], // Round 1: Court 1 (0,1 v 2,3) | Court 2 (4,5 v 6,7)
            [[0,2], [4,6], [1,3], [5,7]], // Round 2
            [[0,3], [5,6], [1,2], [4,7]], // Round 3
            [[0,4], [1,5], [2,6], [3,7]], // Round 4
            [[0,5], [2,7], [1,6], [3,4]], // Round 5
            [[0,6], [3,5], [1,7], [2,4]], // Round 6
            [[0,7], [1,4], [2,5], [3,6]]  // Round 7
        ];

        // Shuffle IDs so position 0 isn't always the same player
        shuffle($ids);

        $rounds = [];
        foreach ($matrix as $roundIndex => $matches) {
            $rounds[] = [
                'number' => $roundIndex + 1,
                'completed' => false,
                'matches' => [
                    [
                        'court' => 1,
                        'teamA' => [$ids[$matches[0][0]], $ids[$matches[0][1]]],
                        'teamB' => [$ids[$matches[1][0]], $ids[$matches[1][1]]],
                        'scoreA' => null, 'scoreB' => null
                    ],
                    [
                        'court' => 2,
                        'teamA' => [$ids[$matches[2][0]], $ids[$matches[2][1]]],
                        'teamB' => [$ids[$matches[3][0]], $ids[$matches[3][1]]],
                        'scoreA' => null, 'scoreB' => null
                    ]
                ]
            ];
        }
        return $rounds;
    }

    /**
     * Fixed Partners Format
     */
    private static function generateFixedRounds($ids) {
        // Form 4 fixed duos randomly
        shuffle($ids);
        $d1 = [$ids[0], $ids[1]];
        $d2 = [$ids[2], $ids[3]];
        $d3 = [$ids[4], $ids[5]];
        $d4 = [$ids[6], $ids[7]];

        $rounds = [];
        // Cycle of matchups for 4 teams
        $cycle = [
            [['teamA' => $d1, 'teamB' => $d2], ['teamA' => $d3, 'teamB' => $d4]], // R1
            [['teamA' => $d1, 'teamB' => $d3], ['teamA' => $d2, 'teamB' => $d4]], // R2
            [['teamA' => $d1, 'teamB' => $d4], ['teamA' => $d2, 'teamB' => $d3]]  // R3
        ];

        for ($i = 0; $i < 7; $i++) {
            $matchups = $cycle[$i % 3]; 
            
            $rounds[] = [
                'number' => $i + 1,
                'completed' => false,
                'matches' => [
                    [
                        'court' => 1,
                        'teamA' => $matchups[0]['teamA'],
                        'teamB' => $matchups[0]['teamB'],
                        'scoreA' => null, 'scoreB' => null
                    ],
                    [
                        'court' => 2,
                        'teamA' => $matchups[1]['teamA'],
                        'teamB' => $matchups[1]['teamB'],
                        'scoreA' => null, 'scoreB' => null
                    ]
                ]
            ];
        }
        return $rounds;
    }
}