<?php
require_once __DIR__ . '/../models/Session.php';
require_once __DIR__ . '/../models/Result.php';
require_once __DIR__ . '/../models/Patient.php';

class ReportController {
    private Session $sessionModel;
    private Result $resultModel;
    private Patient $patientModel;

    public function __construct() {
        $this->sessionModel = new Session();
        $this->resultModel = new Result();
        $this->patientModel = new Patient();
    }

    public function show(int $sessionId): void {
        $session = $this->sessionModel->getById($sessionId);
        if (!$session) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Session not found']);
            return;
        }

        $results = $this->resultModel->getBySessionId($sessionId);
        $patient = $this->patientModel->getById((int)$session['patient_id']);

        // Compute summary metrics for medical report
        $totalReps = count($results);
        $correctCount = 0;
        $totalAngle = 0;
        $maxAngle = 0;
        $totalAccuracy = 0;

        foreach ($results as $res) {
            if ($res['is_correct']) $correctCount++;
            $totalAngle += (float)$res['angle'];
            if ((float)$res['angle'] > $maxAngle) {
                $maxAngle = (float)$res['angle'];
            }
            $totalAccuracy += (float)$res['accuracy'];
        }

        $avgAngle = $totalReps > 0 ? round($totalAngle / $totalReps, 1) : 0;
        $avgAccuracy = $totalReps > 0 ? round($totalAccuracy / $totalReps, 1) : 0;

        echo json_encode([
            'status' => 'success',
            'data' => [
                'session' => $session,
                'patient' => $patient,
                'metrics' => [
                    'total_reps' => $totalReps,
                    'correct_reps' => $correctCount,
                    'accuracy_percentage' => $avgAccuracy,
                    'max_angle' => $maxAngle,
                    'avg_angle' => $avgAngle,
                    'status' => $session['status']
                ],
                'results' => $results
            ]
        ]);
    }
}
