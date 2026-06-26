<?php
// api/players.php

// Force JSON response header
header('Content-Type: application/json');

require_once '../core/JsonManager.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    
    // ==========================================
    // READ: Get all players
    // ==========================================
    case 'GET':
        $players = JsonManager::read('players'); // Reads data/players.json
        echo json_encode([
            'success' => true,
            'data' => $players
        ]);
        break;

    // ==========================================
    // CREATE: Add a new player
    // ==========================================
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);

        // Validation
        if (empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Player name is required.']);
            exit;
        }

        $players = JsonManager::read('players');

        // Generate a simple incremental ID or timestamp-based ID
        $newId = count($players) > 0 ? max(array_column($players, 'id')) + 1 : 1;

        $newPlayer = [
            'id' => $newId,
            'name' => trim($input['name']),
            'nickname' => isset($input['nickname']) ? trim($input['nickname']) : ''
        ];

        $players[] = $newPlayer;
        $saved = JsonManager::write('players', $players);

        if ($saved) {
            http_response_code(201); // 201 Created
            echo json_encode([
                'success' => true,
                'message' => 'Player registered successfully.',
                'data' => $newPlayer
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to write data to disk.']);
        }
        break;

    // ==========================================
    // UPDATE: Modify player details
    // ==========================================
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['id']) || empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing required fields (id, name).']);
            exit;
        }

        $players = JsonManager::read('players');
        $found = false;

        foreach ($players as &$player) {
            if ($player['id'] == $input['id']) {
                $player['name'] = trim($input['name']);
                $player['nickname'] = isset($input['nickname']) ? trim($input['nickname']) : '';
                $found = true;
                break;
            }
        }

        if (!$found) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Player not found.']);
            exit;
        }

        if (JsonManager::write('players', $players)) {
            echo json_encode(['success' => true, 'message' => 'Player updated successfully.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save updates.']);
        }
        break;

    // ==========================================
    // DELETE: Remove a player
    // ==========================================
    case 'DELETE':
        // For DELETE requests, we can pass the ID via query string: api/players.php?id=5
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Player ID is required for deletion.']);
            exit;
        }

        $targetId = intval($_GET['id']);
        $players = JsonManager::read('players');
        
        // Filter out the player with the target ID
        $initialCount = count($players);
        $players = array_values(array_filter($players, function($player) use ($targetId) {
            return $player['id'] !== $targetId;
        }));

        if (count($players) === $initialCount) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Player not found.']);
            exit;
        }

        if (JsonManager::write('players', $players)) {
            echo json_encode(['success' => true, 'message' => 'Player removed successfully.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save changes.']);
        }
        break;

    // ==========================================
    // Method handling fail-safe
    // ==========================================
    default:
        http_response_code(405); // 405 Method Not Allowed
        echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
        break;
}