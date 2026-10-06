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
                'message' => 'ข้อมูลเวกเตอร์ใบหน้า (Face Embedding) ไม่ถูกต้องหรือว่างเปล่า'
            ]);
            return;
        }

        $config = require __DIR__ . '/../config/config.php';
        $threshold = (float)($config['face_auth']['similarity_threshold'] ?? 0.82);
        $modelVersion = $config['face_auth']['model_version'] ?? 'face-resnet34-v2';

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

        // Duplicate Face Check: Ensure this face is not already enrolled under another patient
        $existingProfiles = $this->faceModel->getAllWithPatient($modelVersion);
        foreach ($input['embeddings'] as $item) {
            $candidateVec = $item['embedding'] ?? $item;
            if (!is_array($candidateVec) || count($candidateVec) === 0) continue;

            foreach ($existingProfiles as $existing) {
                if ((int)$existing['patient_id'] !== (int)$patientId && is_array($existing['embedding'])) {
                    $sim = FaceEmbedding::cosineSimilarity($candidateVec, $existing['embedding']);
                    if ($sim >= $threshold) {
                        http_response_code(409);
                        echo json_encode([
                            'status' => 'error',
                            'code' => 'DUPLICATE_FACE',
                            'message' => 'ใบหน้านี้ได้ลงทะเบียนไว้แล้วในระบบของผู้ป่วยท่านอื่น (' . $existing['patient_name'] . ') ไม่สามารถลงทะเบียนซ้ำได้',
                            'similarity' => round($sim, 4),
                        ]);
                        return;
                    }
                }
            }
        }

        $enrolledCount = 0;
        foreach ($input['embeddings'] as $item) {
            $vec = $item['embedding'] ?? $item;
            if (is_array($vec) && count($vec) > 0) {
                $angleTag = $item['angle_tag'] ?? 'center';
                $qualityScore = (float)($item['quality_score'] ?? 100.0);

                $this->faceModel->store((int)$patientId, $vec, $angleTag, $qualityScore, $modelVersion);
                $enrolledCount++;
            }
        }

        $patient = $this->patientModel->getById((int)$patientId);

        http_response_code(201);
        echo json_encode([
            'status' => 'success',
            'message' => 'บันทึกข้อมูลใบหน้า (Face Enrollment) สำเร็จเรียบร้อย',
            'patient' => $patient,
            'enrolled_embeddings' => $enrolledCount,
            'model_version' => $modelVersion
        ]);
    }

    /**
     * POST /api/face/verify
     * Compares candidate face embedding against all enrolled profiles in DB
     * Enforces unified threshold, Top1 vs Top2 separation margin, and model_version validation
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
                'message' => 'ระบบระงับการเข้าสู่ระบบชั่วคราวเนื่องจากพยายามเกินกำหนด กรุณารอ 5 นาทีแล้วลองใหม่อีกครั้ง'
            ]);
            return;
        }

        $candidateVec = $input['embedding'];
        $config = require __DIR__ . '/../config/config.php';
        $threshold = (float)($config['face_auth']['similarity_threshold'] ?? 0.82);
        $marginThreshold = (float)($config['face_auth']['margin_threshold'] ?? 0.08);
        $modelVersion = $config['face_auth']['model_version'] ?? 'face-resnet34-v2';

        $enrolled = $this->faceModel->getAllWithPatient($modelVersion);

        if (empty($enrolled)) {
            echo json_encode([
                'status' => 'fail',
                'match' => false,
                'similarity' => 0.0,
                'threshold' => round($threshold * 100, 2),
                'message' => 'ยังไม่มีข้อมูลใบหน้าที่ลงทะเบียนด้วยโมเดลเวอร์ชันปัจจุบัน (' . $modelVersion . ') กรุณาลงทะเบียนใบหน้าใหม่'
            ]);
            return;
        }

        // Aggregate highest similarity per patient profile
        $patientMatches = [];
        foreach ($enrolled as $record) {
            $targetVec = $record['embedding'];
            if (!is_array($targetVec)) continue;

            $sim = FaceEmbedding::cosineSimilarity($candidateVec, $targetVec);
            $pId = (int)$record['patient_id'];

            if (!isset($patientMatches[$pId]) || $sim > $patientMatches[$pId]['similarity']) {
                $patientMatches[$pId] = [
                    'patient' => $record,
                    'similarity' => $sim,
                    'angle_matched' => $record['angle_tag'] ?? 'center'
                ];
            }
        }

        if (empty($patientMatches)) {
            echo json_encode([
                'status' => 'fail',
                'match' => false,
                'similarity' => 0.0,
                'threshold' => round($threshold * 100, 2),
                'message' => 'ไม่พบข้อมูลใบหน้าที่สามารถเปรียบเทียบได้'
            ]);
            return;
        }

        // Sort patients by similarity descending
        uasort($patientMatches, fn($a, $b) => $b['similarity'] <=> $a['similarity']);
        $sortedList = array_values($patientMatches);

        $top1 = $sortedList[0];
        $top2 = count($sortedList) > 1 ? $sortedList[1] : null;

        $top1Sim = (float)$top1['similarity'];
        $top2Sim = $top2 ? (float)$top2['similarity'] : 0.0;
        $margin = $top2 ? ($top1Sim - $top2Sim) : 1.0;

        $similarityPct = round($top1Sim * 100, 1);
        $bestMatch = $top1['patient'];
        $matchedAngle = $top1['angle_matched'];

        // Condition 1: Similarity exceeds calibrated threshold
        $meetsThreshold = $top1Sim >= $threshold;
        // Condition 2: Top-1 vs Top-2 margin separation check (prevents ambiguous identity mix-ups)
        $meetsMargin = ($top2 === null) || ($margin >= $marginThreshold);

        if ($meetsThreshold && $meetsMargin) {
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
                // Ignore if token insert warning
            }

            echo json_encode([
                'status' => 'success',
                'match' => true,
                'similarity' => round($top1Sim, 4),
                'similarity_percent' => $similarityPct,
                'top2_similarity' => round($top2Sim, 4),
                'margin' => round($margin, 4),
                'euclidean_distance' => round(sqrt(max(0.0, 2 - 2 * $top1Sim)), 4),
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

            $failReason = '';
            if ($meetsThreshold && !$meetsMargin) {
                $failReason = 'ระบบตรวจพบความคล้ายคลึงระหว่างผู้ป่วย 2 ท่านใกล้เคียงกันเกินไป เพื่อความปลอดภัยกรุณาจัดแสงให้ชัดเจนและมองตรงมาที่กล้อง';
            } else {
                $failReason = 'ไม่พบข้อมูลใบหน้าที่ตรงกัน (ความคล้าย ' . $similarityPct . '% ต่ำกว่าเกณฑ์ ' . round($threshold * 100) . '%) กรุณาลองใหม่หรือสมัครสมาชิก';
            }

            echo json_encode([
                'status' => 'fail',
                'match' => false,
                'similarity' => round($top1Sim, 4),
                'similarity_percent' => $similarityPct,
                'top2_similarity' => round($top2Sim, 4),
                'margin' => round($margin, 4),
                'margin_required' => $marginThreshold,
                'euclidean_distance' => round(sqrt(max(0.0, 2 - 2 * $top1Sim)), 4),
                'threshold' => round($threshold * 100, 2),
                'message' => $failReason
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
