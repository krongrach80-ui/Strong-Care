<?php
$files = ['database/physiovision.sqlite', 'database/strongcare.sqlite'];
foreach ($files as $f) {
    if (file_exists($f)) {
        echo "=== $f ===\n";
        $db = new PDO("sqlite:$f");
        $stmt = $db->query("SELECT id, patient_id, angle_tag, model_version, created_at FROM face_embeddings");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Face embeddings (" . count($rows) . "):\n";
        foreach ($rows as $r) {
            echo "  ID: {$r['id']} | Patient: {$r['patient_id']} | Angle: {$r['angle_tag']} | Model: {$r['model_version']} | Date: {$r['created_at']}\n";
        }
    }
}
