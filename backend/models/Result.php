<?php
require_once __DIR__ . '/../config/database.php';

class Result {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getBySessionId(int $sessionId): array {
        $stmt = $this->db->prepare("
            SELECT * FROM session_results
            WHERE session_id = :session_id
            ORDER BY rep_number ASC
        ");
        $stmt->execute(['session_id' => $sessionId]);
        return $stmt->fetchAll();
    }

    public function createBatch(int $sessionId, array $results): bool {
        if (empty($results)) {
            return true;
        }

        $stmt = $this->db->prepare("
            INSERT INTO session_results (session_id, rep_number, angle, accuracy, duration, is_correct, feedback)
            VALUES (:session_id, :rep_number, :angle, :accuracy, :duration, :is_correct, :feedback)
        ");

        foreach ($results as $item) {
            $stmt->execute([
                'session_id' => $sessionId,
                'rep_number' => (int)($item['rep_number'] ?? 1),
                'angle' => (float)($item['angle'] ?? 0.0),
                'accuracy' => (float)($item['accuracy'] ?? 0.0),
                'duration' => (float)($item['duration'] ?? 0.0),
                'is_correct' => !empty($item['is_correct']) ? 1 : 0,
                'feedback' => $item['feedback'] ?? 'Completed'
            ]);
        }

        return true;
    }
}
