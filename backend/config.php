<?php
declare(strict_types=1);

/**
 * Database connection configuration for Dayflow API.
 * Update credentials according to your local environment (e.g., XAMPP, WAMP, Docker).
 */
function get_db_connection(): PDO
{
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $db   = getenv('DB_NAME') ?: 'dayflow_db';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    return new PDO($dsn, $user, $pass, $options);
}
