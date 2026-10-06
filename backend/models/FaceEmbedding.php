<?php
require_once __DIR__ . '/../config/database.php';

class FaceEmbedding {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Store a new facial embedding vector
     */
    public function store(
        int $patientId,
        array $embedding,
        string $angleTag = 'center',
        float $qualityScore = 100.0,
        string $modelVersion = 'face-resnet34-v2'
    ): int {
        $embeddingJson = json_encode($embedding);

        $stmt = $this->db->prepare("
            INSERT INTO face_embeddings (patient_id, embedding, angle_tag, quality_score, model_version, created_at)
            VALUES (:patient_id, :embedding, :angle_tag, :quality_score, :model_version, CURRENT_TIMESTAMP)
        ");

        $stmt->execute([
            'patient_id' => $patientId,
            'embedding' => $embeddingJson,
            'angle_tag' => $angleTag,
            'quality_score' => $qualityScore,
            'model_version' => $modelVersion,
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Fetch all enrolled embeddings joined with patient profile
     * Optionally filtered by model_version to isolate legacy model embeddings
     */
    public function getAllWithPatient(?string $modelVersion = 'face-resnet34-v2'): array {
        $sql = "
            SELECT 
                fe.id AS embedding_id,
                fe.patient_id,
                fe.embedding,
                fe.angle_tag,
                fe.quality_score,
                fe.model_version,
                fe.created_at AS enrolled_at,
                p.patient_code,
                p.name AS patient_name,
                p.age AS patient_age,
                p.gender AS patient_gender,
                p.notes AS patient_notes
            FROM face_embeddings fe
            JOIN patients p ON fe.patient_id = p.id
        ";

        if ($modelVersion !== null) {
            $sql .= " WHERE fe.model_version = :model_version ";
        }

        $sql .= " ORDER BY fe.patient_id ASC, fe.id ASC";

        $stmt = $this->db->prepare($sql);
        if ($modelVersion !== null) {
            $stmt->execute([':model_version' => $modelVersion]);
        } else {
            $stmt->execute();
        }

        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['embedding'] = json_decode($row['embedding'], true);
        }
        return $rows;
    }

    /**
     * Get embeddings by patient ID
     */
    public function getByPatientId(int $patientId): array {
        $stmt = $this->db->prepare("
            SELECT id, patient_id, embedding, angle_tag, quality_score, model_version, created_at
            FROM face_embeddings
            WHERE patient_id = :patient_id
            ORDER BY id ASC
        ");
        $stmt->execute(['patient_id' => $patientId]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['embedding'] = json_decode($row['embedding'], true);
        }
        return $rows;
    }

    /**
     * Delete all embeddings for a patient
     */
    public function deleteByPatientId(int $patientId): bool {
        $stmt = $this->db->prepare("DELETE FROM face_embeddings WHERE patient_id = :patient_id");
        return $stmt->execute(['patient_id' => $patientId]);
    }

    /**
     * Delete all facial embeddings in the database (Reset / Re-enrollment)
     */
    public function deleteAll(): bool {
        $stmt = $this->db->prepare("DELETE FROM face_embeddings");
        return $stmt->execute();
    }

    /**
     * Compute Cosine Similarity between two N-dimensional float vectors
     * Cosine = (A • B) / (||A|| * ||B||)
     */
    public static function cosineSimilarity(array $vecA, array $vecB): float {
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

        if ($normA <= 0.0 || $normB <= 0.0) return 0.0;

        $sim = $dot / (sqrt($normA) * sqrt($normB));
        return max(0.0, min(1.0, $sim));
    }

    /**
     * Compute Euclidean Distance between two vectors
     * Distance = sqrt(sum((A[i] - B[i])^2))
     */
    public static function euclideanDistance(array $vecA, array $vecB): float {
        $len = min(count($vecA), count($vecB));
        if ($len === 0) return 999.0;

        $sumSq = 0.0;
        for ($i = 0; $i < $len; $i++) {
            $diff = (float)$vecA[$i] - (float)$vecB[$i];
            $sumSq += $diff * $diff;
        }

        return sqrt($sumSq);
    }
}

