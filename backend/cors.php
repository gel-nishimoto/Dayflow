<?php
declare(strict_types=1);

/**
 * Shared CORS handling for all Dayflow API endpoints.
 * Include this FIRST in every endpoint (before config.php / any DB access / output).
 *
 * Origins are echoed back only when explicitly allowed (never "*"), so credentialed
 * requests remain valid. Capacitor Android WebView origin is `https://localhost`
 * (default androidScheme "https"); iOS uses `capacitor://localhost`.
 */
$allowedOrigins = [
    'http://localhost',
    'http://localhost:8100',
    'http://127.0.0.1:8100',
    'http://localhost:4200',
    'https://localhost',        // Capacitor Android WebView (default)
    'capacitor://localhost',    // Capacitor iOS
    'ionic://localhost',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} elseif ($origin !== '' && preg_match('#^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$#', $origin)) {
    // Local network origins for testing on mobile phones over Wi-Fi
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Answer preflight immediately: no DB connection, no body.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

