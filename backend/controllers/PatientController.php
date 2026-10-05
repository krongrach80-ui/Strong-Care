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
}
