<?php
/**
 * Strong Care - Adaptive Rehabilitation & Therapist Approval Controller
 * 
 * CORE PRINCIPLE:
 * AI Analysis -> AI Recommendation -> Human Therapist/Caregiver Review -> Approval -> New Config
 * Strict Clinical Governance: AI NEVER changes prescriptions automatically!
 */

require_once __DIR__ . '/../config/database.php';

class AdaptiveController {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * GET /api/adaptive/recommendations/{patientId}
     */
    public function getRecommendations(int $patientId): void {
        try {
            $stmt = $this->db->prepare("
                SELECT ar.*, p.name as patient_name, p.patient_code
                FROM adaptive_recommendations ar
                JOIN patients p ON ar.patient_id = p.id
                WHERE ar.patient_id = :patient_id
                ORDER BY ar.created_at DESC
            ");
            $stmt->execute([':patient_id' => $patientId]);
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'status' => 'success',
                'data' => $records
            ]);
        } catch (Throwable $e) {
            error_log("AdaptiveController::getRecommendations error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to retrieve recommendations']);
        }
    }

    /**
     * POST /api/adaptive/approval
     * Caregiver / Therapist Approval Gate
     * Decisions: APPROVED | MODIFIED | REJECTED
     */
    public function submitApproval(): void {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?? [];

        $recommendationId = $data['recommendation_id'] ?? ('REC-' . uniqid());
        $approvedBy = $data['approved_by'] ?? 'กภ. วริศรา (นักกายภาพบำบัด)';
        $decision = $data['decision'] ?? 'APPROVED'; // APPROVED | MODIFIED | REJECTED
        $previousConfig = is_array($data['previous_config'] ?? null) ? json_encode($data['previous_config']) : ($data['previous_config'] ?? '{}');
        $finalConfig = is_array($data['final_config'] ?? null) ? json_encode($data['final_config']) : ($data['final_config'] ?? '{}');
        $auditNote = $data['audit_note'] ?? 'ตรวจสอบผลการฟื้นฟูและอนุมัติการปรับเปลี่ยนแผนการฝึก';

        try {
            $stmt = $this->db->prepare("
                INSERT INTO approval_audits (recommendation_id, approved_by, decision, previous_config, final_config, audit_note)
                VALUES (:rec_id, :approved_by, :decision, :prev_cfg, :final_cfg, :audit_note)
            ");
            $stmt->execute([
                ':rec_id' => $recommendationId,
                ':approved_by' => $approvedBy,
                ':decision' => $decision,
                ':prev_cfg' => $previousConfig,
                ':final_cfg' => $finalConfig,
                ':audit_note' => $auditNote
            ]);

            // Update recommendation status if ID exists in database
            $updateStmt = $this->db->prepare("
                UPDATE adaptive_recommendations
                SET status = :status
                WHERE id = :id OR previous_config = :prev_cfg
            ");
            $updateStmt->execute([
                ':status' => strtolower($decision),
                ':id' => is_numeric($recommendationId) ? (int)$recommendationId : 0,
                ':prev_cfg' => $previousConfig
            ]);

            echo json_encode([
                'status' => 'success',
                'message' => 'บันทึกการอนุมัติทางคลินิก (Clinical Audit Trail) สำเร็จ',
                'data' => [
                    'recommendation_id' => $recommendationId,
                    'decision' => $decision,
                    'approved_by' => $approvedBy,
                    'final_config' => json_decode($finalConfig, true),
                    'audit_timestamp' => date('Y-m-d H:i:s')
                ]
            ]);
        } catch (Throwable $e) {
            error_log("AdaptiveController::submitApproval error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to record clinical approval']);
        }
    }
}
