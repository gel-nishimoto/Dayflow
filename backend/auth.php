<?php
declare(strict_types=1);

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/config.php';

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        respond(400, ['success' => false, 'message' => 'Request body is required.']);
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        respond(400, ['success' => false, 'message' => 'Invalid JSON request body.']);
    }

    return $decoded;
}

function ensure_users_table(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL DEFAULT 'Student User',
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL DEFAULT '',
            school VARCHAR(150) NOT NULL DEFAULT '',
            daily_reminder TINYINT(1) NOT NULL DEFAULT 1,
            sound_alerts TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Seed default student account if table is empty
    $count = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    if ($count === 0) {
        $defaultPasswordHash = password_hash('password123', PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("
            INSERT INTO users (name, email, password, phone, school, daily_reminder, sound_alerts)
            VALUES (:name, :email, :password, :phone, :school, 1, 0)
        ");
        $stmt->execute([
            'name'     => 'Student User',
            'email'    => 'student@dayflow.app',
            'password' => $defaultPasswordHash,
            'phone'    => '+63 912 345 6789',
            'school'   => 'Dayflow University',
        ]);
    }
}

function format_user(array $row): array
{
    return [
        'id'            => (int)$row['id'],
        'name'          => (string)$row['name'],
        'email'         => (string)$row['email'],
        'phone'         => (string)($row['phone'] ?? ''),
        'school'        => (string)($row['school'] ?? ''),
        'dailyReminder' => (bool)($row['daily_reminder'] ?? 1),
        'soundAlerts'   => (bool)($row['sound_alerts'] ?? 0),
    ];
}

try {
    $pdo = get_db_connection();
    ensure_users_table($pdo);

    $action = $_GET['action'] ?? 'login';
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        $body = read_json_body();

        if ($action === 'login') {
            $email = trim((string)($body['email'] ?? ''));
            $password = (string)($body['password'] ?? '');

            if ($email === '' || $password === '') {
                respond(400, ['success' => false, 'message' => 'Email and password are required.']);
            }

            $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
            $stmt->execute(['email' => $email]);
            $user = $stmt->fetch();

            if (!$user) {
                respond(401, ['success' => false, 'message' => 'No account found with this email.']);
            }

            // Verify password hash or plain text fallback
            $verified = password_verify($password, (string)$user['password']) || $password === $user['password'];
            if (!$verified) {
                respond(401, ['success' => false, 'message' => 'Incorrect password.']);
            }

            respond(200, [
                'success' => true,
                'message' => 'Logged in successfully.',
                'data'    => format_user($user),
            ]);
        } elseif ($action === 'register') {
            $email = trim((string)($body['email'] ?? ''));
            $password = (string)($body['password'] ?? '');
            $name = trim((string)($body['name'] ?? 'User'));
            $school = trim((string)($body['school'] ?? ''));
            $phone = trim((string)($body['phone'] ?? ''));

            if ($email === '' || $password === '') {
                respond(400, ['success' => false, 'message' => 'Email and password are required.']);
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                respond(422, ['success' => false, 'message' => 'Please provide a valid email address.']);
            }

            if (strlen($password) < 4) {
                respond(422, ['success' => false, 'message' => 'Password must be at least 4 characters.']);
            }

            $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
            $stmt->execute(['email' => $email]);
            if ($stmt->fetch()) {
                respond(409, ['success' => false, 'message' => 'An account with that email already exists.']);
            }

            $hashed = password_hash($password, PASSWORD_BCRYPT);
            $insert = $pdo->prepare('
                INSERT INTO users (name, email, password, phone, school)
                VALUES (:name, :email, :password, :phone, :school)
            ');
            $insert->execute([
                'name'     => $name !== '' ? $name : 'User',
                'email'    => $email,
                'password' => $hashed,
                'phone'    => $phone,
                'school'   => $school,
            ]);

            $newId = (int)$pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
            $stmt->execute(['id' => $newId]);
            $newUser = $stmt->fetch();

            respond(201, [
                'success' => true,
                'message' => 'Account created successfully.',
                'data'    => format_user($newUser),
            ]);
        } else {
            respond(400, ['success' => false, 'message' => "Unknown action '{$action}'."]);
        }
    } elseif ($method === 'GET' && $action === 'check') {
        $userId = filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT);
        if ($userId) {
            $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
            $stmt->execute(['id' => $userId]);
            $user = $stmt->fetch();
            if ($user) {
                respond(200, ['success' => true, 'data' => format_user($user)]);
            }
        }
        respond(404, ['success' => false, 'message' => 'User not found.']);
    } else {
        respond(405, ['success' => false, 'message' => 'Method not allowed.']);
    }
} catch (PDOException $e) {
    error_log('Auth API database error: ' . $e->getMessage());
    respond(500, ['success' => false, 'message' => 'Database error. Check the PHP error log.']);
} catch (Throwable $e) {
    error_log('Auth API unexpected error: ' . $e->getMessage());
    respond(500, ['success' => false, 'message' => 'Internal server error.']);
}
