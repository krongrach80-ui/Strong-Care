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
        $patientCode = $data['patient_code'] ?? 'PT-' . date('Y') . '-' . str_pad((string)rand(100, 999), 3, '0', STR_PAD_LEFT);
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
