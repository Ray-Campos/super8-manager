<?php
// api/tournament.php

// Force JSON response
header('Content-Type: application/json');

require_once '../core/JsonManager.php';
require_once '../core/Matchmaker.php';

$method = $_SERVER['REQUEST_METHOD'];

// ==========================================
// GET METHOD: Retrieve all or a specific tournament
// ==========================================
if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $tournament = JsonManager::getTournamentById($_GET['id']);
        if ($tournament) {
            echo json_encode(['success' => true, 'data' => $tournament]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Tournament not found.']);
        }
    } else {
        // If no ID is passed, return the whole list!
        $tournaments = JsonManager::read('tournaments');
        echo json_encode(['success' => true, 'data' => $tournaments]);
    }
    exit;
}

// ==========================================
// POST METHOD: Create a new tournament
// ==========================================
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $postData = json_decode($input, true);

    if (!isset($postData['name']) || !isset($postData['format']) || !isset($postData['player_ids'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Incomplete data.']);
        exit;
    }

    if (count($postData['player_ids']) !== 8) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'A Super 8 tournament requires exactly 8 players.']);
        exit;
    }

    // 1. Generate the new tournament
    $newTournament = Matchmaker::createTournament(
        $postData['name'], 
        $postData['format'], 
        $postData['player_ids']
    );

    // 2. Read current list
    $currentTournaments = JsonManager::read('tournaments');

    // 3. Add and save
    $currentTournaments[] = $newTournament;
    $saved = JsonManager::write('tournaments', $currentTournaments);

    if ($saved) {
        http_response_code(201);
        echo json_encode([
            'success' => true, 
            'message' => 'Tournament created successfully!',
            'tournament_id' => $newTournament['id']
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save to JSON file.']);
    }
    exit;
}

// Fallback for unsupported methods
http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed.']);