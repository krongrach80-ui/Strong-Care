<?php
require_once __DIR__ . '/../models/Exercise.php';

class ExerciseController {
    private Exercise $exerciseModel;

    public function __construct() {
        $this->exerciseModel = new Exercise();
    }

    public function index(): void {
        $exercises = $this->exerciseModel->getAll();
        echo json_encode(['status' => 'success', 'data' => $exercises]);
    }

    public function show(int $id): void {
        $exercise = $this->exerciseModel->getById($id);
        if (!$exercise) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Exercise not found']);
            return;
        }
        echo json_encode(['status' => 'success', 'data' => $exercise]);
    }
}
