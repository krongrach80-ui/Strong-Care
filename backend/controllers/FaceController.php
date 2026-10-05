<?php
require_once __DIR__ . '/../models/FaceEmbedding.php';
require_once __DIR__ . '/../models/Patient.php';

class FaceController {
    private FaceEmbedding $faceModel;
    private Patient $patientModel;

    public function __construct() {
        $this->faceModel = new FaceEmbedding();
        $this->patientModel = new Patient();
    }

    /**
     * POST /api/face/enroll
     * Enrolls 1-5 facial embeddings for a patient (new or existing)
     */
    public function enroll(): void {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || empty($input['embeddings']) || !is_array($input['embeddings'])) {
            http_response_code(422);
            echo json_encode([
                'status' => 'error',
                'message' => 'ข้อมูล Face Embedding ไม่ถูกต้องหรือว่างเปล่า'
            ]);
            return;
        }

        $patientId = $input['patient_id'] ?? null;

        // If new patient data provided (Elderly quick enrollment)
        if (!$patientId && !empty($input['name'])) {
            $patientCode = 'PT-' . date('Y') . '-' . str_pad((string)rand(100, 999), 3, '0', STR_PAD_LEFT);
            $newPatientData = [
                'patient_code' => $patientCode,
                'name' => trim($input['name']),
                'age' => (int)($input['age'] ?? 60),
                'gender' => $input['gender'] ?? 'male',
                'notes' => $input['notes'] ?? 'ลงทะเบียนด่วนด้วยใบหน้า (Face Enrollment)',
            ];

            try {
                $patientId = $this->patientModel->create($newPatientData);
            } catch (Exception $e) {
                // If patient code collision, retry with timestamp
                $newPatientData['patient_code'] = 'PT-' . date('Y') . '-' . substr((string)time(), -4);
                $patientId = $this->patientModel->create($newPatientData);
            }
        }

        if (!$patientId) {
            http_response_code(422);
            echo json_encode([
                'status' => 'error',
                'message' => 'จำเป็นต้องระบุ patient_id หรือ ชื่อ-นามสกุล ของผู้ป่วย'
            ]);
            return;
        }

        $enrolledCount = 0;
        foreach ($input['embeddings'] as $item) {
            $vec = $item['embedding'] ?? $item;
            if (is_array($vec) && count($vec) > 0) {
                $angleTag = $item['angle_tag'] ?? 'center';
                $qualityScore = (float)($item['quality_score'] ?? 100.0);

                $this->faceModel->store($patientId, $vec, $angleTag, $qualityScore);
                $enrolledCount++;
            }
        }

        $patient = $this->patientModel->getById($patientId);

        http_response_code(201);
        echo json_encode([
            'status' => 'success',
            'message' => 'บันทึกข้อมูลใบหน้า (Face Enrollment) สำเร็จเรียบร้อย',
            'patient' => $patient,
            'enrolled_embeddings' => $enrolledCount
        ]);
    }

    /**
     * POST /api/face/verify
     * Compares candidate face embedding against all enrolled profiles in DB
     */
    public function verify(): void {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || empty($input['embedding']) || !is_array($input['embedding'])) {
            http_response_code(422);
            echo json_encode([
                'status' => 'error',
                'message' => 'ไม่มีข้อมูลเวกเตอร์ใบหน้าสำหรับตรวจสอบ'
            ]);
            return;
        }

        $candidateVec = $input['embedding'];
        $threshold = (float)($input['threshold'] ?? 0.82); // 82% Cosine similarity threshold

        $enrolled = $this->faceModel->getAllWithPatient();

        if (empty($enrolled)) {
            echo json_encode([
                'status' => 'fail',
                'match' => false,
                'similarity' => 0.0,
                'message' => 'ยังไม่มีข้อมูลใบหน้าที่ลงทะเบียนในระบบ กรุณาลงทะเบียนก่อน'
            ]);
            return;
        }

        // Compare against every enrolled embedding
        $bestMatch = null;
        $highestSimilarity = 0.0;
        $matchedAngle = '';

        foreach ($enrolled as $record) {
            $targetVec = $record['embedding'];
            if (!is_array($targetVec)) continue;

            $sim = FaceEmbedding::cosineSimilarity($candidateVec, $targetVec);

            if ($sim > $highestSimilarity) {
                $highestSimilarity = $sim;
                $bestMatch = $record;
                $matchedAngle = $record['angle_tag'];
            }
        }

        $similarityPct = round($highestSimilarity * 100, 1);

        if ($highestSimilarity >= $threshold && $bestMatch !== null) {
            echo json_encode([
                'status' => 'success',
                'match' => true,
                'similarity' => round($highestSimilarity, 4),
                'similarity_percent' => $similarityPct,
                'angle_matched' => $matchedAngle,
                'patient' => [
                    'id' => (int)$bestMatch['patient_id'],
                    'patient_code' => $bestMatch['patient_code'],
                    'name' => $bestMatch['patient_name'],
                    'age' => (int)$bestMatch['patient_age'],
                    'gender' => $bestMatch['patient_gender'],
                    'notes' => $bestMatch['patient_notes'],
                ],
                'message' => "ยินดีต้อนรับคุณ {$bestMatch['patient_name']} เข้าสู่ระบบสำเร็จ!"
            ]);
        } else {
            echo json_encode([
                'status' => 'fail',
                'match' => false,
                'similarity' => round($highestSimilarity, 4),
                'similarity_percent' => $similarityPct,
                'message' => 'ไม่พบข้อมูลใบหน้าที่ตรงกัน (ความคล้าย ' . $similarityPct . '% ต่ำกว่าเกณฑ์ ' . round($threshold * 100) . '%) กรุณาลองใหม่หรือสมัครสมาชิก'
            ]);
        }
    }

    /**
     * GET /api/face/status
     */
    public function status(): void {
        $enrolled = $this->faceModel->getAllWithPatient();
        $uniquePatients = [];
        foreach ($enrolled as $r) {
            $uniquePatients[$r['patient_id']] = true;
        }

        echo json_encode([
            'status' => 'online',
            'service' => 'PhysioVision Face Recognition Engine',
            'total_embeddings' => count($enrolled),
            'enrolled_patients_count' => count($uniquePatients),
        ]);
    }
}
