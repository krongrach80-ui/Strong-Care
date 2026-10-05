<?php
/**
 * Strong Care - Main API Router & Front Controller
 * AI-assisted Rehabilitation Monitoring Platform REST API
 * Supports Apache/XAMPP with mod_rewrite AND PHP Built-in Server
 */

require_once __DIR__ . '/middleware/CorsMiddleware.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';
require_once __DIR__ . '/controllers/PatientController.php';
require_once __DIR__ . '/controllers/ExerciseController.php';
require_once __DIR__ . '/controllers/SessionController.php';
require_once __DIR__ . '/controllers/ReportController.php';
require_once __DIR__ . '/controllers/FaceController.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/AdaptiveController.php';
require_once __DIR__ . '/controllers/SyncController.php';

// Handle CORS
CorsMiddleware::handle();

// Parse requested URI
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Normalize path: strip folder prefixes (e.g. /physiovision/backend, /strongcare/backend or /backend)
$uri = preg_replace('#^.*?/api/#', '/api/', $requestUri);

// If running in root directory or via direct script
if (!str_starts_with($uri, '/api/')) {
    $uri = '/api/' . ltrim($requestUri, '/');
}

// Router matching: Health check
if ($uri === '/api/health' || $uri === '/api/') {
    echo json_encode([
        'status' => 'online',
        'service' => 'Strong Care REST API',
        'tagline' => 'AI-assisted Rehabilitation Monitoring Platform',
        'version' => '1.0.0',
        'db_driver' => Database::getDriver(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
}

// ==========================================
// 1. AUTHENTICATION & BIOMETRIC LIVENESS
// ==========================================

// POST /api/auth/enroll
if ($uri === '/api/auth/enroll') {
    $controller = new AuthController();
    if ($method === 'POST') {
        $controller->enroll();
    }
    exit();
}

// POST /api/auth/face-login
if ($uri === '/api/auth/face-login') {
    $controller = new AuthController();
    if ($method === 'POST') {
        $controller->faceLogin();
    }
    exit();
}

// POST /api/auth/logout
if ($uri === '/api/auth/logout') {
    $controller = new AuthController();
    if ($method === 'POST') {
        $controller->logout();
    }
    exit();
}

// Legacy /api/face routes backward compatibility
if ($uri === '/api/face/enroll') {
    $controller = new FaceController();
    if ($method === 'POST') $controller->enroll();
    exit();
}
if ($uri === '/api/face/verify') {
    $controller = new FaceController();
    if ($method === 'POST') $controller->verify();
    exit();
}
if ($uri === '/api/face/status') {
    $controller = new FaceController();
    if ($method === 'GET') $controller->status();
    exit();
}

// ==========================================
// 2. PATIENTS
// ==========================================

// /api/patients
if ($uri === '/api/patients') {
    $controller = new PatientController();
    if ($method === 'GET') {
        $controller->index();
    } elseif ($method === 'POST') {
        $controller->store();
    }
    exit();
}

// /api/patients/{id}/history
if (preg_match('#^/api/patients/(\d+)/history$#', $uri, $matches)) {
    $patientId = (int)$matches[1];
    $controller = new PatientController();
    $controller->history($patientId);
    exit();
}

// /api/patients/{id}
if (preg_match('#^/api/patients/(\d+)$#', $uri, $matches)) {
    $patientId = (int)$matches[1];
    $controller = new PatientController();
    if ($method === 'GET') {
        $controller->show($patientId);
    }
    exit();
}

// ==========================================
// 3. EXERCISES
// ==========================================

// /api/exercises
if ($uri === '/api/exercises') {
    $controller = new ExerciseController();
    if ($method === 'GET') {
        $controller->index();
    }
    exit();
}

// /api/exercises/{id}
if (preg_match('#^/api/exercises/(\d+)$#', $uri, $matches)) {
    $exerciseId = (int)$matches[1];
    $controller = new ExerciseController();
    if ($method === 'GET') {
        $controller->show($exerciseId);
    }
    exit();
}

// ==========================================
// 4. SESSIONS & RESULTS
// ==========================================

// /api/sessions
if ($uri === '/api/sessions') {
    $controller = new SessionController();
    if ($method === 'GET') {
        $controller->index();
    } elseif ($method === 'POST') {
        $controller->store();
    }
    exit();
}

// /api/sessions/{id}/results
if (preg_match('#^/api/sessions/(\d+)/results$#', $uri, $matches)) {
    $sessionId = (int)$matches[1];
    $controller = new SessionController();
    if ($method === 'POST') {
        $controller->storeResults($sessionId);
    }
    exit();
}

// /api/sessions/{id}/safety-events
if (preg_match('#^/api/sessions/(\d+)/safety-events$#', $uri, $matches)) {
    $sessionId = (int)$matches[1];
    $controller = new SessionController();
    if ($method === 'POST') {
        $controller->storeSafetyEvents($sessionId);
    }
    exit();
}

// /api/sessions/{id}
if (preg_match('#^/api/sessions/(\d+)$#', $uri, $matches)) {
    $sessionId = (int)$matches[1];
    $controller = new SessionController();
    if ($method === 'GET') {
        $controller->show($sessionId);
    }
    exit();
}

// ==========================================
// 5. REPORTS
// ==========================================

// /api/reports/{id}
if (preg_match('#^/api/reports/(\d+)$#', $uri, $matches)) {
    $sessionId = (int)$matches[1];
    $controller = new ReportController();
    if ($method === 'GET') {
        $controller->show($sessionId);
    }
    exit();
}

// ==========================================
// 6. ADAPTIVE REHABILITATION & APPROVAL
// ==========================================

// GET /api/adaptive/recommendations/{patientId}
if (preg_match('#^/api/adaptive/recommendations/(\d+)$#', $uri, $matches)) {
    $patientId = (int)$matches[1];
    $controller = new AdaptiveController();
    if ($method === 'GET') {
        $controller->getRecommendations($patientId);
    }
    exit();
}

// POST /api/adaptive/approval
if ($uri === '/api/adaptive/approval') {
    $controller = new AdaptiveController();
    if ($method === 'POST') {
        $controller->submitApproval();
    }
    exit();
}

// ==========================================
// 7. OFFLINE SYNC
// ==========================================

// POST /api/sync
if ($uri === '/api/sync') {
    $controller = new SyncController();
    if ($method === 'POST') {
        $controller->syncBatch();
    }
    exit();
}

// ==========================================
// 8. TTS (THAI TEXT-TO-SPEECH PROXY CACHE)
// ==========================================

if ($uri === '/api/tts') {
    $text = $_GET['text'] ?? '';
    if (empty($text)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing text parameter']);
        exit();
    }

    $cacheDir = __DIR__ . '/cache/tts';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0777, true);
    }

    $hash = md5($text);
    $cacheFile = $cacheDir . '/' . $hash . '.mp3';

    if (!file_exists($cacheFile) || filesize($cacheFile) < 100) {
        $encoded = urlencode($text);
        $url = "https://translate.google.com/translate_tts?ie=UTF-8&q={$encoded}&tl=th&client=tw-ob";
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        $audioData = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($audioData && $httpCode === 200 && strlen($audioData) > 500) {
            file_put_contents($cacheFile, $audioData);
        }
    }

    if (file_exists($cacheFile)) {
        header('Content-Type: audio/mpeg');
        header('Content-Length: ' . filesize($cacheFile));
        header('Cache-Control: public, max-age=86400');
        readfile($cacheFile);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Could not synthesize audio']);
    }
    exit();
}

// Route not found
http_response_code(404);
echo json_encode([
    'status' => 'error',
    'message' => 'API endpoint not found',
    'requested_uri' => $uri,
    'method' => $method
]);
