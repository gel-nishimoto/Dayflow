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

function validate_activity(array $input): array
{
    $title = trim((string)($input['title'] ?? ''));
    $date = trim((string)($input['date'] ?? ''));
    $category = trim((string)($input['category'] ?? ''));
    $status = trim((string)($input['status'] ?? 'pending'));

    $validStatuses = ['pending', 'ongoing', 'completed', 'cancelled'];

    $errors = [];
    if ($title === '') $errors['title'] = 'Activity title is required.';
    if ($date === '') $errors['date'] = 'Schedule date is required.';
    if ($category === '') $errors['category'] = 'Category is required.';
    if (!in_array($status, $validStatuses, true)) {
        $errors['status'] = 'Status must be one of: ' . implode(', ', $validStatuses);
    }

    if ($errors) {
        respond(422, [
            'success' => false,
            'message' => 'Validation failed.',
            'errors' => $errors,
        ]);
    }

    $latitude = isset($input['latitude']) && $input['latitude'] !== null && $input['latitude'] !== ''
        ? (float)$input['latitude']
        : null;
    $longitude = isset($input['longitude']) && $input['longitude'] !== null && $input['longitude'] !== ''
        ? (float)$input['longitude']
        : null;

    $photos = isset($input['photos']) && is_array($input['photos'])
        ? json_encode($input['photos'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        : null;

    $videos = isset($input['videos']) && is_array($input['videos'])
        ? json_encode($input['videos'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        : null;

    return [
        'title'            => $title,
        'description'      => trim((string)($input['description'] ?? '')),
        'date'             => $date,
        'time'             => !empty($input['time']) ? trim((string)$input['time']) : null,
        'deadline'         => !empty($input['deadline']) ? trim((string)$input['deadline']) : null,
        'category'         => $category,
        'status'           => $status,
        'reminder'         => !empty($input['reminder']) ? 1 : 0,
        'reminder_minutes' => isset($input['reminderMinutes']) ? (int)$input['reminderMinutes'] : 15,
        'reminder_ref'     => ($input['reminderRef'] ?? 'time') === 'deadline' ? 'deadline' : 'time',
        'location_name'    => !empty($input['locationName']) ? trim((string)$input['locationName']) : null,
        'location_address' => !empty($input['locationAddress']) ? trim((string)$input['locationAddress']) : null,
        'latitude'         => $latitude,
        'longitude'        => $longitude,
        'photos'           => $photos,
        'videos'           => $videos,
    ];
}

function format_row(array $row): array
{
    return [
        'id'              => (int)$row['id'],
        'title'           => $row['title'],
        'description'     => $row['description'] ?? '',
        'date'            => $row['date'],
        'time'            => $row['time'] ?? '',
        'deadline'        => $row['deadline'] ?? '',
        'category'        => $row['category'],
        'status'          => $row['status'],
        'reminder'        => (bool)$row['reminder'],
        'reminderMinutes' => (int)($row['reminder_minutes'] ?? 15),
        'reminderRef'     => $row['reminder_ref'] ?? 'time',
        'locationName'    => $row['location_name'],
        'locationAddress' => $row['location_address'],
        'latitude'        => isset($row['latitude']) && $row['latitude'] !== null ? (float)$row['latitude'] : null,
        'longitude'       => isset($row['longitude']) && $row['longitude'] !== null ? (float)$row['longitude'] : null,
        'photos'          => !empty($row['photos']) ? json_decode((string)$row['photos'], true) : [],
        'videos'          => !empty($row['videos']) ? json_decode((string)$row['videos'], true) : [],
    ];
}

try {
    $pdo = get_db_connection();
    $method = $_SERVER['REQUEST_METHOD'];
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

    if (isset($_GET['id']) && ($id === false || $id === null || $id < 1)) {
        respond(400, ['success' => false, 'message' => 'The id parameter must be a positive integer.']);
    }

    switch ($method) {
        case 'GET':
            if ($id !== null && $id !== false) {
                $stmt = $pdo->prepare('SELECT * FROM activities WHERE id = :id');
                $stmt->execute(['id' => $id]);
                $activity = $stmt->fetch();

                if (!$activity) {
                    respond(404, ['success' => false, 'message' => 'Activity not found.']);
                }

                respond(200, ['success' => true, 'data' => format_row($activity)]);
            }

            $stmt = $pdo->query('SELECT * FROM activities ORDER BY date ASC, time ASC, id DESC');
            $rows = $stmt->fetchAll();
            $activities = array_map('format_row', $rows);

            respond(200, ['success' => true, 'data' => $activities]);

        case 'POST':
            $activity = validate_activity(read_json_body());
            $stmt = $pdo->prepare(
                'INSERT INTO activities 
                 (title, description, date, time, deadline, category, status, reminder, reminder_minutes, reminder_ref, location_name, location_address, latitude, longitude, photos, videos)
                 VALUES 
                 (:title, :description, :date, :time, :deadline, :category, :status, :reminder, :reminder_minutes, :reminder_ref, :location_name, :location_address, :latitude, :longitude, :photos, :videos)'
            );
            $stmt->execute($activity);

            $newId = (int)$pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT * FROM activities WHERE id = :id');
            $stmt->execute(['id' => $newId]);
            $created = $stmt->fetch();

            respond(201, ['success' => true, 'message' => 'Activity created.', 'data' => format_row($created)]);

        case 'PUT':
            if ($id === null || $id === false) {
                respond(400, ['success' => false, 'message' => 'Provide an activity id in the query string, e.g. ?id=1.']);
            }

            $activity = validate_activity(read_json_body());
            $activity['id'] = $id;

            $check = $pdo->prepare('SELECT id FROM activities WHERE id = :id');
            $check->execute(['id' => $id]);
            if (!$check->fetch()) {
                respond(404, ['success' => false, 'message' => 'Activity not found.']);
            }

            $stmt = $pdo->prepare(
                'UPDATE activities SET
                    title = :title,
                    description = :description,
                    date = :date,
                    time = :time,
                    deadline = :deadline,
                    category = :category,
                    status = :status,
                    reminder = :reminder,
                    reminder_minutes = :reminder_minutes,
                    reminder_ref = :reminder_ref,
                    location_name = :location_name,
                    location_address = :location_address,
                    latitude = :latitude,
                    longitude = :longitude,
                    photos = :photos,
                    videos = :videos
                 WHERE id = :id'
            );
            $stmt->execute($activity);

            $stmt = $pdo->prepare('SELECT * FROM activities WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $updated = $stmt->fetch();

            respond(200, ['success' => true, 'message' => 'Activity updated.', 'data' => format_row($updated)]);

        case 'DELETE':
            if ($id === null || $id === false) {
                respond(400, ['success' => false, 'message' => 'Provide an activity id in the query string, e.g. ?id=1.']);
            }

            $stmt = $pdo->prepare('DELETE FROM activities WHERE id = :id');
            $stmt->execute(['id' => $id]);

            if ($stmt->rowCount() === 0) {
                respond(404, ['success' => false, 'message' => 'Activity not found.']);
            }

            respond(200, ['success' => true, 'message' => 'Activity deleted.']);

        default:
            header('Allow: GET, POST, PUT, DELETE, OPTIONS');
            respond(405, ['success' => false, 'message' => 'Method not allowed.']);
    }
} catch (PDOException $e) {
    error_log('Activities API database error: ' . $e->getMessage());
    respond(500, ['success' => false, 'message' => 'Database error. Check the PHP error log.']);
} catch (Throwable $e) {
    error_log('Activities API unexpected error: ' . $e->getMessage());
    respond(500, ['success' => false, 'message' => 'Internal server error.']);
}
