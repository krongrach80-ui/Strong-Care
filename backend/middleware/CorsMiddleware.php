<?php
/**
 * CorsMiddleware - Cross-Origin Resource Sharing handling
 */
class CorsMiddleware {
    public static function handle(): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $config = require __DIR__ . '/../config/config.php';
        $allowedOrigins = $config['cors']['allowed_origins'] ?? [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:4173',
            'http://127.0.0.1:4173',
            'https://krongrach80-ui.github.io'
        ];

        $matchedOrigin = null;
        if (!empty($origin)) {
            if (in_array('*', $allowedOrigins, true)) {
                $matchedOrigin = $origin;
            } elseif (in_array($origin, $allowedOrigins, true)) {
                $matchedOrigin = $origin;
            } else {
                $parsed = parse_url($origin);
                $host = $parsed['host'] ?? '';
                if ($host === 'localhost' || $host === '127.0.0.1' || str_ends_with($host, 'github.io')) {
                    $matchedOrigin = $origin;
                }
            }
        }

        if ($matchedOrigin) {
            header("Access-Control-Allow-Origin: {$matchedOrigin}");
        } elseif (!empty($allowedOrigins)) {
            header("Access-Control-Allow-Origin: " . reset($allowedOrigins));
        }

        header("Vary: Origin");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Max-Age: 86400");
        header("Content-Type: application/json; charset=UTF-8");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
}
