<?php
/**
 * PhysioVision - Global Configuration
 */

// Error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', '0');

return [
    'app' => [
        'name' => 'PhysioVision API',
        'version' => '1.0.0',
        'timezone' => 'Asia/Bangkok',
        'env' => 'development', // 'development' or 'production'
    ],
    'database' => [
        'driver' => 'mysql', // 'mysql' with automatic sqlite fallback
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'physiovision',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
        // Fallback SQLite file if MySQL is unavailable
        'sqlite_path' => __DIR__ . '/../../database/physiovision.sqlite'
    ],
    'cors' => [
        'allowed_origins' => ['*', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost'],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
    ]
];
