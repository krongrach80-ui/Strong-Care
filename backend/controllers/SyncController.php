<?php
/**
 * Strong Care - Offline-First Sync Controller
 * Synchronizes client IndexedDB queue to MySQL/SQLite backend when connection is restored
 */

require_once __DIR__ . '/../config/database.php';

class SyncController {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * POST /api/sync
     */
    public function syncBatch(): void {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true) ?? [];

        $sessions = $payload['sessions'] ?? [];
        $safetyEvents = $payload['safety_events'] ?? [];
        $syncedSessions = 0;
        $syncedSafety = 0;

        try {
            $this->db->beginTransaction();

            // Process offline sessions
            foreach ($sessions as $s) {
                $stmt = $this->db->prepare("
                    INSERT INTO sessions (
                        patient_id, exercise_id, started_at, ended_at, total_reps,
                        correct_reps, accuracy, avg_duration_per_rep, max_angle, avg_angle, rom, duration, status, notes
                    ) VALUES (
                        :pid, :eid, :started_at, :ended_at, :total_reps,
                        :correct_reps, :accuracy, :avg_duration, :max_angle, :avg_angle, :rom, :duration, :status, :notes
                    )
                ");

                $stmt->execute([
                    ':pid' => $s['patient_id'] ?? 1,
                    ':eid' => $s['exercise_id'] ?? 1,
                    ':started_at' => $s['started_at'] ?? date('Y-m-d H:i:s'),
                    ':ended_at' => $s['ended_at'] ?? date('Y-m-d H:i:s'),
                    ':total_reps' => $s['total_reps'] ?? 0,
                    ':correct_reps' => $s['correct_reps'] ?? 0,
                    ':accuracy' => $s['accuracy'] ?? 0.0,
                    ':avg_duration' => $s['avg_duration_per_rep'] ?? 0.0,
                    ':max_angle' => $s['max_angle'] ?? 0.0,
                    ':avg_angle' => $s['avg_angle'] ?? 0.0,
                    ':rom' => $s['rom'] ?? 0.0,
                    ':duration' => $s['duration'] ?? 0,
                    ':status' => $s['status'] ?? 'completed',
                    ':notes' => $s['notes'] ?? 'Synced from StrongCareDB Offline Queue'
                ]);

                $newSessionId = (int)$this->db->lastInsertId();
                $syncedSessions++;

                // If rep results attached
                if (!empty($s['results']) && is_array($s['results'])) {
                    $repStmt = $this->db->prepare("
                        INSERT INTO session_results (session_id, rep_number, angle, accuracy, rom, duration, is_correct, feedback)
                        VALUES (:sid, :rep_num, :angle, :acc, :rom, :dur, :correct, :fb)
                    ");
                    foreach ($s['results'] as $r) {
                        $repStmt->execute([
                            ':sid' => $newSessionId,
                            ':rep_num' => $r['rep_number'] ?? 1,
                            ':angle' => $r['angle'] ?? 0.0,
                            ':acc' => $r['accuracy'] ?? 100.0,
                            ':rom' => $r['rom'] ?? 0.0,
                            ':dur' => $r['duration'] ?? 0.0,
                            ':correct' => !empty($r['is_correct']) ? 1 : 0,
                            ':fb' => $r['feedback'] ?? 'Good form'
                        ]);
                    }
                }
            }

            // Process safety events
            if (!empty($safetyEvents) && is_array($safetyEvents)) {
                $safeStmt = $this->db->prepare("
                    INSERT INTO safety_events (session_id, event_type, severity, message)
                    VALUES (:sid, :type, :sev, :msg)
                ");
                foreach ($safetyEvents as $ev) {
                    $safeStmt->execute([
                        ':sid' => $ev['session_id'] ?? 1,
                        ':type' => $ev['event_type'] ?? 'UNKNOWN',
                        ':sev' => $ev['severity'] ?? 'CAUTION',
                        ':msg' => $ev['message'] ?? 'Safety event logged'
                    ]);
                    $syncedSafety++;
                }
            }

            $this->db->commit();

            echo json_encode([
                'status' => 'success',
                'synced_sessions' => $syncedSessions,
                'synced_safety_events' => $syncedSafety,
                'synced_at' => date('Y-m-d H:i:s'),
                'message' => "ซิงค์ข้อมูลสำเร็จ ({$syncedSessions} เซสชัน, {$syncedSafety} เหตุการณ์ความปลอดภัย)"
            ]);
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}
