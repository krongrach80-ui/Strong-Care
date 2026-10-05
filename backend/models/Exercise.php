<?php
require_once __DIR__ . '/../config/database.php';

class Exercise {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getAll(): array {
        $stmt = $this->db->query("SELECT * FROM exercises ORDER BY id ASC");
        return $stmt->fetchAll();
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM exercises WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $res = $stmt->fetch();
        return $res ?: null;
    }

    public function getBySlug(string $slug): ?array {
        $stmt = $this->db->prepare("SELECT * FROM exercises WHERE slug = :slug");
        $stmt->execute(['slug' => $slug]);
        $res = $stmt->fetch();
        return $res ?: null;
    }
}
