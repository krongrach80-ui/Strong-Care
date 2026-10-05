<?php
require_once __DIR__ . '/../config/database.php';

class Session {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT s.*, p.name AS patient_name, p.patient_code, e.name AS exercise_name, e.slug AS exercise_slug, e.target_angle, e.min_angle, e.max_angle
            FROM sessions s
            JOIN patients p ON s.patient_id = p.id
            JOIN exercises e ON s.exercise_id = e.id
            WHERE s.id = :id
        ");
        $stmt->execute(['id' => $id]);
        $res = $stmt->fetch();
        return $res ?: null;
    }

    public function getByPatientId(int $patientId): array {
        $stmt = $this->db->prepare("
            SELECT s.*, e.name AS exercise_name, e.slug AS exercise_slug, e.target_angle
            FROM sessions s
            JOIN exercises e ON s.exercise_id = e.id
            WHERE s.patient_id = :patient_id
            ORDER BY s.id DESC
        ");
        $stmt->execute(['patient_id' => $patientId]);
        return $stmt->fetchAll();
    }

    public function getAll(): array {
        $stmt = $this->db->query("
            SELECT s.*, p.name AS patient_name, p.patient_code, e.name AS exercise_name
            FROM sessions s
            JOIN patients p ON s.patient_id = p.id
            JOIN exercises e ON s.exercise_id = e.id
            ORDER BY s.id DESC
        ");
        return $stmt->fetchAll();
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare("
            INSERT INTO sessions (
                patient_id, exercise_id, started_at, ended_at, total_reps, correct_reps,
                accuracy, avg_duration_per_rep, max_angle, avg_angle, status, notes
            ) VALUES (
                :patient_id, :exercise_id, :started_at, :ended_at, :total_reps, :correct_reps,
                :accuracy, :avg_duration_per_rep, :max_angle, :avg_angle, :status, :notes
            )
        ");

        $startedAt = $data['started_at'] ?? date('Y-m-d H:i:s');
        $endedAt = $data['ended_at'] ?? date('Y-m-d H:i:s');

        $stmt->execute([
            'patient_id' => (int)$data['patient_id'],
            'exercise_id' => (int)$data['exercise_id'],
            'started_at' => $startedAt,
            'ended_at' => $endedAt,
            'total_reps' => (int)($data['total_reps'] ?? 0),
            'correct_reps' => (int)($data['correct_reps'] ?? 0),
            'accuracy' => (float)($data['accuracy'] ?? 0.0),
            'avg_duration_per_rep' => (float)($data['avg_duration_per_rep'] ?? 0.0),
            'max_angle' => (float)($data['max_angle'] ?? 0.0),
            'avg_angle' => (float)($data['avg_angle'] ?? 0.0),
            'status' => $data['status'] ?? 'completed',
            'notes' => $data['notes'] ?? ''
        ]);

        return (int)$this->db->lastInsertId();
    }
}
