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

function format_notification(array $row): array
{
    return [
        'id'          => (int)$row['id'],
        'type'        => (string)$row['type'],
        'title'       => (string)$row['title'],
        'description' => (string)$row['description'],
        'time'        => (string)$row['time'],
        'read'        => (bool)$row['is_read'],
    ];
}

try {
    $pdo = get_db_connection();
    $method = $_SERVER['REQUEST_METHOD'];
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    $action = $_GET['action'] ?? '';

    switch ($method) {
        case 'GET':
            $stmt = $pdo->query('SELECT * FROM notifications ORDER BY id DESC');
            $rows = $stmt->fetchAll();
            respond(200, ['success' => true, 'data' => array_map('format_notification', $rows)]);

        case 'POST':
            $input = read_json_body();

            $type = $input['type'] ?? 'deadline';
            $title = trim((string)($input['title'] ?? ''));
            $description = trim((string)($input['description'] ?? ''));
            $time = trim((string)($input['time'] ?? 'Just now'));
            $is_read = !empty($input['read']) ? 1 : 0;

            if ($title === '') {
                respond(400, ['success' => false, 'message' => 'Notification title is required.']);
            }

            if (!in_array($type, ['upcoming', 'deadline', 'overdue'], true)) {
                $type = 'deadline';
            }

            $stmt = $pdo->prepare('INSERT INTO notifications (type, title, description, time, is_read) VALUES (:type, :title, :description, :time, :is_read)');
            $stmt->execute([
                'type' => $type,
                'title' => $title,
                'description' => $description,
                'time' => $time,
                'is_read' => $is_read,
            ]);

            $newId = (int)$pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT * FROM notifications WHERE id = :id');
            $stmt->execute(['id' => $newId]);
            $created = $stmt->fetch();

            respond(201, [
                'success' => true,
                'message' => 'Notification created.',
                'data' => format_notification($created),
            ]);

        case 'PUT':
            if ($action === 'mark-all-read') {
                $pdo->query('UPDATE notifications SET is_read = 1');
                respond(200, ['success' => true, 'message' => 'All notifications marked as read.']);
            }

            if ($id === null || $id === false || $id < 1) {
                respond(400, ['success' => false, 'message' => 'Provide a valid notification id parameter.']);
            }

            $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = :id');
            $stmt->execute(['id' => $id]);

            if ($stmt->rowCount() === 0) {
                $check = $pdo->prepare('SELECT id FROM notifications WHERE id = :id');
                $check->execute(['id' => $id]);
                if (!$check->fetch()) {
                    respond(404, ['success' => false, 'message' => 'Notification not found.']);
                }
            }

            $stmt = $pdo->prepare('SELECT * FROM notifications WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $updated = $stmt->fetch();

            respond(200, ['success' => true, 'message' => 'Notification marked as read.', 'data' => format_notification($updated)]);

        case 'DELETE':
            if ($id === null || $id === false || $id < 1) {
                respond(400, ['success' => false, 'message' => 'Provide a valid notification id parameter.']);
            }

            $stmt = $pdo->prepare('DELETE FROM notifications WHERE id = :id');
            $stmt->execute(['id' => $id]);

            if ($stmt->rowCount() === 0) {
                respond(404, ['success' => false, 'message' => 'Notification not found.']);
            }

            respond(200, ['success' => true, 'message' => 'Notification deleted.']);

        default:
            header('Allow: GET, PUT, DELETE, OPTIONS');
            respond(405, ['success' => false, 'message' => 'Method not allowed.']);
    }
} catch (PDOException $e) {
    error_log('Notifications API database error: ' . $e->getMessage());
    respond(500, ['success' => false, 'message' => 'Database error. Check the PHP error log.']);
} catch (Throwable $e) {
    error_log('Notifications API unexpected error: ' . $e->getMessage());
    respond(500, ['success' => false, 'message' => 'Internal server error.']);
}
