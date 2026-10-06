<?php
require_once __DIR__ . '/../models/FaceEmbedding.php';
require_once __DIR__ . '/../models/Patient.php';
require_once __DIR__ . '/../services/RateLimiter.php';
require_once __DIR__ . '/../config/database.php';

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
            $newPatientData = [
                'name' => trim($input['name']),
                'age' => (int)($input['age'] ?? 60),
                'gender' => $input['gender'] ?? 'male',
                'notes' => $input['notes'] ?? 'ลงทะเบียนด่วนด้วยใบหน้า (Face Enrollment)',
            ];

            try {
                $patientId = $this->patientModel->create($newPatientData);
            } catch (Throwable $e) {
                error_log("FaceController enroll patient creation error: " . $e->getMessage());
                http_response_code(500);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'ไม่สามารถสร้างข้อมูลผู้ป่วยสำหรับลงทะเบียนใบหน้าได้'
                ]);
                return;
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

        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        if (!RateLimiter::check('face_login', $ip, 5, 300)) {
            http_response_code(429);
            header('Retry-After: 300');
            echo json_encode([
                'status' => 'error',
                'message' => 'ระบบระงับการเข้าสู่ระบบชั่วคราวเนื่องจากพยายามล้มเหลวหลายครั้ง กรุณารอ 5 นาทีแล้วลองใหม่'
            ]);
            return;
        }

        $candidateVec = $input['embedding'];
        $config = require __DIR__ . '/../config/config.php';
        // Unified matching threshold from configuration (0.82+)
        $threshold = (float)($config['face_auth']['similarity_threshold'] ?? 0.82);

        $enrolled = $this->faceModel->getAllWithPatient();

        if (empty($enrolled)) {
            echo json_encode([
                'status' => 'fail',
                'match' => false,
                'similarity' => 0.0,
                'threshold' => round($threshold * 100, 2),
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
            RateLimiter::reset('face_login', $ip);

            // Issue secure session token
            $rawToken = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $rawToken);
            $patientId = (int)$bestMatch['patient_id'];
            $expiresAt = date('Y-m-d H:i:s', time() + 8 * 3600);

            try {
                $db = Database::getConnection();
                $tStmt = $db->prepare("
                    INSERT INTO auth_tokens (token_hash, patient_id, role, expires_at)
                    VALUES (:token_hash, :patient_id, 'patient', :expires_at)
                ");
                $tStmt->execute([
                    ':token_hash' => $tokenHash,
                    ':patient_id' => $patientId,
                    ':expires_at' => $expiresAt
                ]);
            } catch (Throwable $t) {
                // Ignore if unable to insert
            }

            echo json_encode([
                'status' => 'success',
                'match' => true,
                'similarity' => round($highestSimilarity, 4),
                'similarity_percent' => $similarityPct,
                'euclidean_distance' => round(sqrt(max(0.0, 2 - 2 * $highestSimilarity)), 4),
                'threshold' => round($threshold * 100, 2),
                'angle_matched' => $matchedAngle,
                'patient' => [
                    'id' => $patientId,
                    'patient_code' => $bestMatch['patient_code'],
                    'name' => $bestMatch['patient_name'],
                    'age' => (int)$bestMatch['patient_age'],
                    'gender' => $bestMatch['patient_gender'],
                    'notes' => $bestMatch['patient_notes'],
                ],
                'token' => $rawToken,
                'expires_at' => $expiresAt,
                'message' => "ยินดีต้อนรับคุณ {$bestMatch['patient_name']} เข้าสู่ระบบสำเร็จ!"
            ]);
        } else {
            RateLimiter::recordFailure('face_login', $ip, 300);
            echo json_encode([
                'status' => 'fail',
                'match' => false,
                'similarity' => round($highestSimilarity, 4),
                'similarity_percent' => $similarityPct,
                'euclidean_distance' => round(sqrt(max(0.0, 2 - 2 * $highestSimilarity)), 4),
                'threshold' => round($threshold * 100, 2),
                'message' => 'ไม่พบข้อมูลใบหน้าที่ตรงกัน (ความคล้าย ' . $similarityPct . '% ต่ำกว่าเกณฑ์ ' . round($threshold * 100) . '%) กรุณาลองใหม่หรือสมัครสมาชิก'
            ]);
        }
    }

    /**
     * POST /api/face/reset
     * Clear all face embeddings to allow fresh re-enrollment with updated FaceLandmarker model
     */
    public function resetAll(): void {
        $this->faceModel->deleteAll();
        echo json_encode([
            'status' => 'success',
            'message' => 'ล้างข้อมูล Face Embeddings เก่าทั้งหมดเรียบร้อยแล้ว ผู้ป่วยสามารถลงทะเบียนใบหน้าใหม่ได้ทันที'
        ]);
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
            'service' => 'StrongCare Face Recognition Engine (MediaPipe FaceLandmarker)',
            'total_embeddings' => count($enrolled),
            'enrolled_patients_count' => count($uniquePatients),
        ]);
    }
}
