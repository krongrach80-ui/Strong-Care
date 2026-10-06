<?php
require_once __DIR__ . '/../config/database.php';

class Patient {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getAll(): array {
        $stmt = $this->db->query("SELECT * FROM patients ORDER BY id DESC");
        return $stmt->fetchAll();
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM patients WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $res = $stmt->fetch();
        return $res ?: null;
    }

    public function create(array $data): int {
        $maxRetries = 10;
        $attempt = 0;

        while ($attempt < $maxRetries) {
            $attempt++;
            if (!empty($data['patient_code']) && $attempt === 1) {
                $patientCode = $data['patient_code'];
            } else {
                $suffix = strtoupper(bin2hex(random_bytes(2))) . '-' . random_int(100, 999);
                $patientCode = 'PT-' . date('Y') . '-' . $suffix;
            }

            try {
                $stmt = $this->db->prepare("
                    INSERT INTO patients (patient_code, name, age, gender, notes)
                    VALUES (:patient_code, :name, :age, :gender, :notes)
                ");
                $stmt->execute([
                    'patient_code' => $patientCode,
                    'name' => $data['name'],
                    'age' => (int)($data['age'] ?? 40),
                    'gender' => $data['gender'] ?? 'male',
                    'notes' => $data['notes'] ?? ''
                ]);
                return (int)$this->db->lastInsertId();
            } catch (PDOException $e) {
                if ($attempt >= $maxRetries) {
                    error_log("Patient::create failed after {$maxRetries} attempts: " . $e->getMessage());
                    throw $e;
                }
            }
        }
        throw new RuntimeException("Unable to generate unique patient code");
    }

    public function update(int $id, array $data): bool {
        $stmt = $this->db->prepare("
            UPDATE patients
            SET name = :name, age = :age, gender = :gender, notes = :notes
            WHERE id = :id
        ");
        return $stmt->execute([
            'id' => $id,
            'name' => $data['name'],
            'age' => (int)($data['age'] ?? 40),
            'gender' => $data['gender'] ?? 'male',
            'notes' => $data['notes'] ?? ''
        ]);
    }
}
