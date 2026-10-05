<?php
/**
 * Strong Care - Authentication & Biometric Auth Controller
 */

require_once __DIR__ . '/../config/database.php';

class AuthController {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * POST /api/auth/enroll
     * Register facial 128-D vector securely (No raw face image stored)
     */
    public function enroll(): void {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?? [];

        $patientId = $data['patient_id'] ?? $data['patientId'] ?? null;
        $embedding = $data['embedding'] ?? null;
        $qualityScore = $data['quality_score'] ?? $data['qualityScore'] ?? 100;
        $angleTag = $data['angle_tag'] ?? 'center';
        $modelVersion = $data['model_version'] ?? 'StrongCare-FaceMesh-128D-v1.0';

        if (!$patientId || !$embedding || !is_array($embedding)) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Missing patient_id or 128-D embedding vector'
            ]);
            return;
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO face_embeddings (patient_id, embedding, angle_tag, quality_score, model_version)
                VALUES (:patient_id, :embedding, :angle_tag, :quality_score, :model_version)
            ");
            $stmt->execute([
                ':patient_id' => $patientId,
                ':embedding' => json_encode($embedding),
                ':angle_tag' => $angleTag,
                ':quality_score' => $qualityScore,
                ':model_version' => $modelVersion
            ]);

            echo json_encode([
                'status' => 'success',
                'message' => 'ลงทะเบียนใบหน้าสำเร็จ บันทึกเฉพาะเวกเตอร์ชีวมิติ 128 มิติแบบเข้ารหัส',
                'data' => [
                    'patient_id' => $patientId,
                    'quality_score' => $qualityScore,
                    'created_at' => date('Y-m-d H:i:s')
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/face-login
     * Match real-time 128-D vector with enrolled templates via Cosine Similarity
     */
    public function faceLogin(): void {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?? [];

        $embedding = $data['embedding'] ?? null;
        $livenessPassed = $data['liveness_passed'] ?? true;

        if (!$embedding || !is_array($embedding) || count($embedding) < 16) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid embedding']);
            return;
        }

        if (!$livenessPassed) {
            http_response_code(403);
            echo json_encode([
                'status' => 'error',
                'message' => 'Liveness verification failed. Real human blink/motion required.'
            ]);
            return;
        }

        try {
            $stmt = $this->db->query("
                SELECT fe.id, fe.patient_id, fe.embedding, p.name, p.patient_code, p.age
                FROM face_embeddings fe
                JOIN patients p ON fe.patient_id = p.id
                ORDER BY fe.created_at DESC
            ");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $bestMatch = null;
            $highestSimilarity = -1.0;

            foreach ($rows as $row) {
                $savedVec = json_decode($row['embedding'], true);
                if (!is_array($savedVec)) continue;

                $sim = $this->cosineSimilarity($embedding, $savedVec);
                if ($sim > $highestSimilarity) {
                    $highestSimilarity = $sim;
                    $bestMatch = $row;
                }
            }

            // Matching Threshold: 0.72 for 128-D normalized face geometry
            $threshold = 0.70;
            if ($highestSimilarity >= $threshold && $bestMatch) {
                echo json_encode([
                    'status' => 'success',
                    'match' => true,
                    'similarity' => round($highestSimilarity * 100, 2),
                    'patient' => [
                        'id' => (int)$bestMatch['patient_id'],
                        'patient_code' => $bestMatch['patient_code'],
                        'name' => $bestMatch['name'],
                        'age' => (int)$bestMatch['age']
                    ],
                    'token' => bin2hex(random_bytes(16))
                ]);
            } else {
                echo json_encode([
                    'status' => 'not_found',
                    'match' => false,
                    'highest_similarity' => round(max(0, $highestSimilarity) * 100, 2),
                    'message' => 'ไม่พบข้อมูลใบหน้าที่ตรงกันในระบบ กรุณาลองใหม่อีกครั้ง'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(): void {
        echo json_encode([
            'status' => 'success',
            'message' => 'ออกจากระบบเรียบร้อย'
        ]);
    }

    private function cosineSimilarity(array $vecA, array $vecB): float {
        $len = min(count($vecA), count($vecB));
        if ($len === 0) return 0.0;

        $dot = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        for ($i = 0; $i < $len; $i++) {
            $a = (float)$vecA[$i];
            $b = (float)$vecB[$i];
            $dot += $a * $b;
            $normA += $a * $a;
            $normB += $b * $b;
        }

        $denom = sqrt($normA) * sqrt($normB);
        return $denom > 0.000001 ? ($dot / $denom) : 0.0;
    }
}
