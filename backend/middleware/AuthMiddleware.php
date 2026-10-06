<?php
/**
 * Strong Care - Bearer Token Authentication & Role-Based Authorization Guard
 */
require_once __DIR__ . '/../config/database.php';

class AuthMiddleware {
    private static ?array $currentUser = null;

    /**
     * Verify Bearer token from HTTP Authorization header
     */
    public static function check(): bool {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? (function_exists('apache_request_headers') ? (apache_request_headers()['Authorization'] ?? '') : '');

        if (!$authHeader || !preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode([
                'status' => 'error',
                'message' => 'Unauthorized: Missing or invalid Authorization header'
            ]);
            exit();
        }

        $rawToken = trim($matches[1]);
        $tokenHash = hash('sha256', $rawToken);

        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT id, patient_id, role, expires_at
            FROM auth_tokens
            WHERE token_hash = :hash
            LIMIT 1
        ");
        $stmt->execute([':hash' => $tokenHash]);
        $tokenRow = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$tokenRow) {
            http_response_code(401);
            echo json_encode([
                'status' => 'error',
                'message' => 'Unauthorized: Invalid token'
            ]);
            exit();
        }

        // Check expiration
        if (strtotime($tokenRow['expires_at']) < time()) {
            $del = $db->prepare("DELETE FROM auth_tokens WHERE id = :id");
            $del->execute([':id' => $tokenRow['id']]);

            http_response_code(401);
            echo json_encode([
                'status' => 'error',
                'message' => 'Unauthorized: Session expired, please login again'
            ]);
            exit();
        }

        self::$currentUser = $tokenRow;
        return true;
    }

    public static function getUser(): ?array {
        return self::$currentUser;
    }

    /**
     * Enforce patient data isolation:
     * Patient can only access their own patient ID unless they have therapist/admin role
     */
    public static function authorizePatient(int $targetPatientId): void {
        if (!self::$currentUser) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
            exit();
        }

        $role = self::$currentUser['role'] ?? 'patient';
        if ($role === 'admin' || $role === 'therapist') {
            return;
        }

        $patientId = (int)(self::$currentUser['patient_id'] ?? 0);
        if ($patientId !== $targetPatientId) {
            http_response_code(403);
            echo json_encode([
                'status' => 'error',
                'message' => 'Forbidden: You do not have permission to access another patient\'s records'
            ]);
            exit();
        }
    }

    /**
     * Require therapist or admin role (e.g. For full patient directory listing)
     */
    public static function requireStaff(): void {
        if (!self::$currentUser) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
            exit();
        }

        $role = self::$currentUser['role'] ?? 'patient';
        if ($role !== 'admin' && $role !== 'therapist') {
            http_response_code(403);
            echo json_encode([
                'status' => 'error',
                'message' => 'Forbidden: This resource is restricted to therapist or admin roles'
            ]);
            exit();
        }
    }
}
