<?php
// core/JsonManager.php

class JsonManager {
    
    // Base path for the data directory relative to this file
    private static $dataPath = __DIR__ . '/../data/';

    /**
     * Reads a JSON file and converts it into a PHP associative array.
     */
    public static function read($file) {
        $fullPath = self::$dataPath . $file . '.json';
        
        // If the file doesn't exist, return an empty array to prevent breaking
        if (!file_exists($fullPath)) {
            return [];
        }

        $content = file_get_contents($fullPath);
        $data = json_decode($content, true);

        // Ensure it always returns an array, even if JSON is corrupted/empty
        return is_array($data) ? $data : [];
    }

    /**
     * Converts a PHP array into JSON and saves it safely to the disk.
     */
    public static function write($file, $data) {
        $fullPath = self::$dataPath . $file . '.json';
        
        // Create the data directory if it doesn't exist
        if (!is_dir(self::$dataPath)) {
            mkdir(self::$dataPath, 0777, true);
        }

        // JSON_PRETTY_PRINT makes it readable in VS Code
        // JSON_UNESCAPED_UNICODE ensures accents aren't mangled
        $jsonString = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        
        // Save the file atomically (prevents corruption on concurrent writes)
        return file_put_contents($fullPath, $jsonString, LOCK_EX) !== false;
    }

    /**
     * Helper to find a specific tournament by ID within the global array.
     */
    public static function getTournamentById($id) {
        $tournaments = self::read('tournaments');
        foreach ($tournaments as $tournament) {
            if ($tournament['id'] === $id) {
                return $tournament;
            }
        }
        return null;
    }
}