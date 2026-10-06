<?php
require_once __DIR__ . '/../models/Patient.php';
require_once __DIR__ . '/../models/Session.php';

class PatientController {
    private Patient $patientModel;
    private Session $sessionModel;

    public function __construct() {
        $this->patientModel = new Patient();
        $this->sessionModel = new Session();
    }

    public function index(): void {
        $patients = $this->patientModel->getAll();
        echo json_encode(['status' => 'success', 'data' => $patients]);
    }

    public function show(int $id): void {
        $patient = $this->patientModel->getById($id);
        if (!$patient) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Patient not found']);
            return;
        }
        echo json_encode(['status' => 'success', 'data' => $patient]);
    }

    public function store(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['name'])) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'message' => 'Name is required']);
            return;
        }

        $id = $this->patientModel->create($input);
        $newPatient = $this->patientModel->getById($id);
        http_response_code(201);
        echo json_encode(['status' => 'success', 'message' => 'Patient registered successfully', 'data' => $newPatient]);
    }

    public function history(int $id): void {
        $patient = $this->patientModel->getById($id);
        if (!$patient) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Patient not found']);
            return;
        }

        $sessions = $this->sessionModel->getByPatientId($id);
        echo json_encode([
            'status' => 'success',
            'data' => [
                'patient' => $patient,
                'sessions' => $sessions
            ]
        ]);
    }

    public function purge(int $id): void {
        $patient = $this->patientModel->getById($id);
        if (!$patient) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Patient not found']);
            return;
        }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            // Find all session IDs for this patient
            $sessionStmt = $db->prepare("SELECT id FROM sessions WHERE patient_id = ?");
            $sessionStmt->execute([$id]);
            $sessionIds = $sessionStmt->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($sessionIds)) {
                $inClause = implode(',', array_fill(0, count($sessionIds), '?'));
                // 1. Delete session_results
                $delResults = $db->prepare("DELETE FROM session_results WHERE session_id IN ($inClause)");
                $delResults->execute($sessionIds);

                // 2. Delete safety_events
                $delSafety = $db->prepare("DELETE FROM safety_events WHERE session_id IN ($inClause)");
                $delSafety->execute($sessionIds);
            }

            // 3. Delete sessions
            $delSessions = $db->prepare("DELETE FROM sessions WHERE patient_id = ?");
            $delSessions->execute([$id]);

            // 4. Delete face_embeddings
            $delFace = $db->prepare("DELETE FROM face_embeddings WHERE patient_id = ?");
            $delFace->execute([$id]);

            // 5. Delete adaptive_recommendations
            $delAdaptive = $db->prepare("DELETE FROM adaptive_recommendations WHERE patient_id = ?");
            $delAdaptive->execute([$id]);

            // 6. Delete auth_tokens if table exists
            try {
                $delTokens = $db->prepare("DELETE FROM auth_tokens WHERE patient_id = ?");
                $delTokens->execute([$id]);
            } catch (Throwable $t) {
                // Table might not exist yet
            }

            // 7. Delete patient
            $delPatient = $db->prepare("DELETE FROM patients WHERE id = ?");
            $delPatient->execute([$id]);

            $db->commit();
            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'success' => true,
                'message' => 'Patient and all associated clinical & biometric data purged permanently under PDPA.'
            ]);
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            error_log("Purge patient error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to purge patient data']);
        }
    }
}
