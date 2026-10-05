<?php
require_once __DIR__ . '/../backend/config/database.php';

$pdo = Database::getConnection();
echo "Active driver: " . Database::getDriver() . "\n";

$stmt = $pdo->query("SELECT id, name, patient_code FROM patients");
while ($r = $stmt->fetch()) {
    echo $r['id'] . " | " . $r['patient_code'] . " | " . $r['name'] . "\n";
    if (strpos($r['name'], '?') !== false) {
        // Fix corrupted question marks name to proper Thai name
        $update = $pdo->prepare("UPDATE patients SET name = 'คุณตาสมชาย มีสุข' WHERE id = ?");
        $update->execute([$r['id']]);
        echo "Fixed name for patient ID " . $r['id'] . " to 'คุณตาสมชาย มีสุข'\n";
    }
}
