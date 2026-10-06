<?php
/**
 * Strong Care - Global Configuration
 */

// Error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Load .env file from project root or backend folder if present
if (!function_exists('loadEnvFile')) {
    function loadEnvFile(string $filePath): void {
        if (!file_exists($filePath)) {
            return;
        }
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            if (strpos($line, '=') !== false) {
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                // Strip quotes if wrapped
                if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                    (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                    $value = substr($value, 1, -1);
                }
                if (!array_key_exists($key, $_SERVER) && !array_key_exists($key, $_ENV)) {
                    putenv("{$key}={$value}");
                    $_ENV[$key] = $value;
                    $_SERVER[$key] = $value;
                }
            }
        }
    }
}

// Search root .env or backend .env
loadEnvFile(dirname(__DIR__, 2) . '/.env');
loadEnvFile(dirname(__DIR__) . '/.env');

$dbName = getenv('DB_NAME') ?: 'strongcare';
$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbPort = (int)(getenv('DB_PORT') ?: 3306);
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

return [
    'app' => [
        'name' => getenv('VITE_APP_NAME') ?: 'Strong Care API',
        'version' => getenv('VITE_APP_VERSION') ?: '1.0.0',
        'timezone' => 'Asia/Bangkok',
        'env' => getenv('APP_ENV') ?: 'development',
    ],
    'database' => [
        'driver' => getenv('DB_CONNECTION') ?: 'mysql',
        'host' => $dbHost,
        'port' => $dbPort,
        'database' => $dbName,
        'username' => $dbUser,
        'password' => $dbPass,
        'charset' => 'utf8mb4',
        // Fallback SQLite file if MySQL is unavailable
        'sqlite_path' => dirname(__DIR__, 2) . "/database/{$dbName}.sqlite"
    ],
    'cors' => [
        'allowed_origins' => array_filter(array_map('trim', explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173,https://krongrach80-ui.github.io'))),
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
    ],
    'face_auth' => [
        'similarity_threshold' => (float)(getenv('FACE_SIMILARITY_THRESHOLD') ?: 0.82),
    ]
];
