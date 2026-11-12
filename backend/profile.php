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

function format_profile(array $row): array
{
    return [
        'id'            => (int)$row['id'],
        'name'          => (string)$row['name'],
        'email'         => (string)$row['email'],
        'phone'         => (string)$row['phone'],
        'school'        => (string)$row['school'],
        'dailyReminder' => (bool)$row['daily_reminder'],
        'soundAlerts'   => (bool)$row['sound_alerts'],
    ];
}

try {
    $pdo = get_db_connection();
    $method = $_SERVER['REQUEST_METHOD'];
    $userId = filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT) ?: 1;

    $hasUsersTable = false;
    try {
        $check = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
        $hasUsersTable = !empty($check);
    } catch (Throwable $e) {
        $hasUsersTable = false;
    }

    switch ($method) {
        case 'GET':
            if ($hasUsersTable) {
                $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
                $stmt->execute(['id' => $userId]);
                $userRow = $stmt->fetch();
                if ($userRow) {
                    respond(200, ['success' => true, 'data' => format_profile($userRow)]);
                }
            }

            $stmt = $pdo->query('SELECT * FROM user_profile WHERE id = 1');
            $profile = $stmt->fetch();

            if (!$profile) {
                // Initialize default profile if empty
                $pdo->query("INSERT INTO user_profile (id, name, email, phone, school, daily_reminder, sound_alerts) 
                             VALUES (1, 'User', '', '', '', 1, 0)");
                $stmt = $pdo->query('SELECT * FROM user_profile WHERE id = 1');
                $profile = $stmt->fetch();
            }

            respond(200, ['success' => true, 'data' => format_profile($profile)]);

        case 'PUT':
            $input = read_json_body();
            $existing = null;

            if ($hasUsersTable) {
                $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
                $stmt->execute(['id' => $userId]);
                $existing = $stmt->fetch();
            }

            if (!$existing) {
                $stmt = $pdo->query('SELECT * FROM user_profile WHERE id = 1');
                $existing = $stmt->fetch();
            }

            if (!$existing) {
                $existing = [
                    'name'           => 'User',
                    'email'          => '',
                    'phone'          => '',
                    'school'         => '',
                    'daily_reminder' => 1,
                    'sound_alerts'   => 0,
                ];
            }

            $name = isset($input['name']) ? trim((string)$input['name']) : $existing['name'];
            $email = isset($input['email']) ? trim((string)$input['email']) : $existing['email'];
            $phone = isset($input['phone']) ? trim((string)$input['phone']) : $existing['phone'];
            $school = isset($input['school']) ? trim((string)$input['school']) : $existing['school'];
            $dailyReminder = isset($input['dailyReminder']) ? ($input['dailyReminder'] ? 1 : 0) : (int)$existing['daily_reminder'];
            $soundAlerts = isset($input['soundAlerts']) ? ($input['soundAlerts'] ? 1 : 0) : (int)$existing['sound_alerts'];

            if ($hasUsersTable) {
                $updateUser = $pdo->prepare(
                    'UPDATE users 
                     SET name = :name, email = :email, phone = :phone, school = :school,
                         daily_reminder = :daily_reminder, sound_alerts = :sound_alerts
                     WHERE id = :id'
                );
                $updateUser->execute([
                    'name'           => $name,
                    'email'          => $email,
                    'phone'          => $phone,
                    'school'         => $school,
                    'daily_reminder' => $dailyReminder,
                    'sound_alerts'   => $soundAlerts,
                    'id'             => $userId,
                ]);
            }

            $update = $pdo->prepare(
                'INSERT INTO user_profile (id, name, email, phone, school, daily_reminder, sound_alerts)
                 VALUES (1, :name, :email, :phone, :school, :daily_reminder, :sound_alerts)
                 ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    email = VALUES(email),
                    phone = VALUES(phone),
                    school = VALUES(school),
                    daily_reminder = VALUES(daily_reminder),
                    sound_alerts = VALUES(sound_alerts)'
            );
            $update->execute([
                'name'           => $name,
                'email'          => $email,
                'phone'          => $phone,
                'school'         => $school,
                'daily_reminder' => $dailyReminder,
                'sound_alerts'   => $soundAlerts,
            ]);

            $result = null;
            if ($hasUsersTable) {
                $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
                $stmt->execute(['id' => $userId]);
                $result = $stmt->fetch();
            }
            if (!$result) {
                $stmt = $pdo->query('SELECT * FROM user_profile WHERE id = 1');
                $result = $stmt->fetch();
            }

            respond(200, ['success' => true, 'message' => 'Profile updated.', 'data' => format_profile($result)]);

        default:
            header('Allow: GET, PUT, OPTIONS');
            respond(405, ['success' => false, 'message' => 'Method not allowed.']);
    }
} catch (PDOException $e) {
    error_log('Profile API database error: ' . $e->getMessage());
    respond(500, ['success' => false, 'message' => 'Database error. Check the PHP error log.']);
} catch (Throwable $e) {
    error_log('Profile API unexpected error: ' . $e->getMessage());
    respond(500, ['success' => false, 'message' => 'Internal server error.']);
}
