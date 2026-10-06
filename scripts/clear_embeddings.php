<?php
$files = ['database/physiovision.sqlite', 'database/strongcare.sqlite'];
foreach ($files as $f) {
    if (file_exists($f)) {
        $db = new PDO("sqlite:$f");
        $db->exec("DELETE FROM face_embeddings");
        $db->exec("DELETE FROM sqlite_sequence WHERE name='face_embeddings'");
        echo "Cleared face_embeddings in $f\n";
    }
}
