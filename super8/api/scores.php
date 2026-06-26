<?php
// api/scores.php

header('Content-Type: application/json');
require_once '../core/JsonManager.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

$input = file_get_contents('php://input');
$payload = json_decode($input, true);

if (!isset($payload['tournament_id']) || !isset($payload['round_number']) || !isset($payload['results'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required data.']);
    exit;
}

$tournamentId = $payload['tournament_id']; // ID is a string like "trn_..."
$roundNumber = intval($payload['round_number']);
$results = $payload['results'];

$tournaments = JsonManager::read('tournaments');
$tournamentIndex = null;

foreach ($tournaments as $index => $tour) {
    if ($tour['id'] === $tournamentId) {
        $tournamentIndex = $index;
        break;
    }
}

if ($tournamentIndex === null) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Tournament not found.']);
    exit;
}

$tournament = &$tournaments[$tournamentIndex];
$roundIndex = $roundNumber - 1; 

if (!isset($tournament['rounds'][$roundIndex])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid round number.']);
    exit;
}

$currentRound = &$tournament['rounds'][$roundIndex];

if ($currentRound['completed'] && $tournament['status'] !== 'completed') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'This round is already completed.'
    ]);
    exit;
}

// Inject scores into the matches
foreach ($results as $result) {
    $matchIdx = intval($result['matchIndex']);
    if (isset($currentRound['matches'][$matchIdx])) {
        $currentRound['matches'][$matchIdx]['scoreA'] = intval($result['scoreA']);
        $currentRound['matches'][$matchIdx]['scoreB'] = intval($result['scoreB']);
    }
}

// Mark round as complete
$currentRound['completed'] = true;

// Check if tournament is finished
$allCompleted = true;
foreach ($tournament['rounds'] as $r) {
    if (!$r['completed']) {
        $allCompleted = false;
        break;
    }
}

// Advance tournament state
if ($allCompleted) {
    $tournament['status'] = 'completed';
} else {
    $tournament['current_round'] += 1;
}

if (JsonManager::write('tournaments', $tournaments)) {
    echo json_encode([
        'success' => true, 
        'message' => 'Round saved successfully.',
        'tournament_status' => $tournament['status'],
        'next_round' => $tournament['current_round']
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save tournament data.']);
}