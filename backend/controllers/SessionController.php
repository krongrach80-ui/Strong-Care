<?php
require_once __DIR__ . '/../models/Session.php';
require_once __DIR__ . '/../models/Result.php';
require_once __DIR__ . '/../config/database.php';

class SessionController {
    private Session $sessionModel;
    private Result $resultModel;
    private PDO $db;

    public function __construct() {
        $this->sessionModel = new Session();
        $this->resultModel = new Result();
        $this->db = Database::getConnection();
    }

    public function index(): void {
        $sessions = $this->sessionModel->getAll();
        echo json_encode(['status' => 'success', 'data' => $sessions]);
    }

    public function show(int $id): void {
        $session = $this->sessionModel->getById($id);
        if (!$session) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Session not found']);
            return;
        }

        $results = $this->resultModel->getBySessionId($id);
        $session['results'] = $results;

        // Fetch safety events
        $stmt = $this->db->prepare("SELECT * FROM safety_events WHERE session_id = :sid ORDER BY created_at ASC");
        $stmt->execute([':sid' => $id]);
        $session['safety_events'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'data' => $session]);
    }

    public function store(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['patient_id']) || empty($input['exercise_id'])) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'message' => 'patient_id and exercise_id are required']);
            return;
        }

        $sessionId = $this->sessionModel->create($input);

        // Batch save repetition results if provided
        if (!empty($input['results']) && is_array($input['results'])) {
            $this->resultModel->createBatch($sessionId, $input['results']);
        }

        // Save safety events if provided
        if (!empty($input['safety_events']) && is_array($input['safety_events'])) {
            $safeStmt = $this->db->prepare("
                INSERT INTO safety_events (session_id, event_type, severity, message)
                VALUES (:sid, :type, :sev, :msg)
            ");
            foreach ($input['safety_events'] as $ev) {
                $safeStmt->execute([
                    ':sid' => $sessionId,
                    ':type' => $ev['code'] ?? $ev['event_type'] ?? 'SAFETY_VIOLATION',
                    ':sev' => $ev['severity'] ?? 'CAUTION',
                    ':msg' => $ev['message'] ?? 'Safety alert'
                ]);
            }
        }

        $session = $this->sessionModel->getById($sessionId);
        $session['results'] = $this->resultModel->getBySessionId($sessionId);

        http_response_code(201);
        echo json_encode([
            'status' => 'success',
            'message' => 'บันทึกเซสชันการฟื้นฟูสำเร็จ',
            'data' => $session
        ]);
    }

    public function storeResults(int $sessionId): void {
        $session = $this->sessionModel->getById($sessionId);
        if (!$session) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Session not found']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $results = $input['results'] ?? ($input ? [$input] : []);

        if (empty($results)) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'message' => 'No result items provided']);
            return;
        }

        $this->resultModel->createBatch($sessionId, $results);
        $allResults = $this->resultModel->getBySessionId($sessionId);

        echo json_encode([
            'status' => 'success',
            'message' => 'Results saved successfully',
            'data' => $allResults
        ]);
    }

    public function storeSafetyEvents(int $sessionId): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $events = $input['safety_events'] ?? ($input ? [$input] : []);

        if (empty($events)) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'message' => 'No safety events provided']);
            return;
        }

        $stmt = $this->db->prepare("
            INSERT INTO safety_events (session_id, event_type, severity, message)
            VALUES (:sid, :type, :sev, :msg)
        ");

        foreach ($events as $ev) {
            $stmt->execute([
                ':sid' => $sessionId,
                ':type' => $ev['event_type'] ?? $ev['code'] ?? 'SAFETY_ALERT',
                ':sev' => $ev['severity'] ?? 'CAUTION',
                ':msg' => $ev['message'] ?? 'Clinical safety warning'
            ]);
        }

        echo json_encode([
            'status' => 'success',
            'message' => 'บันทึกเหตุการณ์ความปลอดภัยทางการแพทย์เรียบร้อย',
            'saved_count' => count($events)
        ]);
    }
}
