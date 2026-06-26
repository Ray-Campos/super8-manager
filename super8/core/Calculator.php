<?php
// core/Calculator.php

class Calculator {

    /**
     * Calculates the leaderboard for a given tournament.
     * Scoring rule: 
     * - 2 points for a match win (1 for tie)
     * - +1 point for each game/set won
     */
    public static function getLeaderboard($tournament) {
        $players = self::initializePlayerStats($tournament['player_ids']);
        
        // Iterate through all completed rounds and matches
        foreach ($tournament['rounds'] as $round) {
            foreach ($round['matches'] as $match) {
                // Only process matches that have scores logged
                if ($match['scoreA'] !== null && $match['scoreB'] !== null) {
                    self::processMatch($players, $match);
                }
            }
        }

        // Convert associative array to indexed array for sorting
        $leaderboard = array_values($players);
        
        // Sort the leaderboard
        usort($leaderboard, function($a, $b) {
            // 1st Tiebreaker: Total Points
            if ($a['total_points'] !== $b['total_points']) {
                return $b['total_points'] <=> $a['total_points'];
            }
            // 2nd Tiebreaker: Match Wins
            if ($a['matches_won'] !== $b['matches_won']) {
                return $b['matches_won'] <=> $a['matches_won'];
            }
            // 3rd Tiebreaker: Game Differential (Games Won - Games Lost)
            $diffA = $a['games_won'] - $a['games_lost'];
            $diffB = $b['games_won'] - $b['games_lost'];
            return $diffB <=> $diffA;
        });

        // Assign visual ranks after sorting
        $rank = 1;
        foreach ($leaderboard as &$player) {
            $player['rank'] = $rank++;
        }

        return $leaderboard;
    }

    /**
     * Creates a blank slate of statistics for every player in the tournament.
     */
    private static function initializePlayerStats($playerIds) {
        $stats = [];
        foreach ($playerIds as $id) {
            $stats[$id] = [
                'id' => $id,
                'matches_played' => 0,
                'matches_won' => 0,
                'matches_lost' => 0,
                'matches_tied' => 0,
                'games_won' => 0,
                'games_lost' => 0,
                'total_points' => 0
            ];
        }
        return $stats;
    }

    /**
     * Processes a single match and distributes points/stats to the involved players.
     */
    private static function processMatch(&$players, $match) {
        $scoreA = (int)$match['scoreA'];
        $scoreB = (int)$match['scoreB'];

        // Determine match points
        $pointsA = 0;
        $pointsB = 0;

        if ($scoreA > $scoreB) {
            $pointsA = 2; // Team A wins
        } elseif ($scoreB > $scoreA) {
            $pointsB = 2; // Team B wins
        } else {
            $pointsA = 1; // Tie
            $pointsB = 1;
        }

        // Distribute stats to Team A
        foreach ($match['teamA'] as $id) {
            $players[$id]['matches_played']++;
            $players[$id]['games_won'] += $scoreA;
            $players[$id]['games_lost'] += $scoreB;
            
            if ($pointsA == 2) $players[$id]['matches_won']++;
            elseif ($pointsA == 1) $players[$id]['matches_tied']++;
            else $players[$id]['matches_lost']++;

            // Core Logic: Total Points = (Match Win Points) + (1 point per game won)
            $players[$id]['total_points'] += ($pointsA + $scoreA);
        }

        // Distribute stats to Team B
        foreach ($match['teamB'] as $id) {
            $players[$id]['matches_played']++;
            $players[$id]['games_won'] += $scoreB;
            $players[$id]['games_lost'] += $scoreA;
            
            if ($pointsB == 2) $players[$id]['matches_won']++;
            elseif ($pointsB == 1) $players[$id]['matches_tied']++;
            else $players[$id]['matches_lost']++;

            $players[$id]['total_points'] += ($pointsB + $scoreB);
        }
    }
}