<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$allowedOrigins = [
    'http://localhost',
    'http://localhost:8100',
    'http://127.0.0.1:8100',
    'http://localhost:4200',
    'https://localhost',
    'capacitor://localhost',
    'ionic://localhost',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} elseif ($origin !== '' && preg_match('#^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$#', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

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

function format_category(array $row): array
{
    return [
        'id'    => (string)$row['id'],
        'name'  => (string)$row['name'],
        'group' => (string)$row['group_name'],
        'icon'  => (string)$row['icon'],
        'color' => (string)$row['color'],
    ];
}

try {
    $pdo = get_db_connection();
    $method = $_SERVER['REQUEST_METHOD'];
    $id = isset($_GET['id']) ? trim((string)$_GET['id']) : null;

    switch ($method) {
        case 'GET':
            if ($id !== null && $id !== '') {
                $stmt = $pdo->prepare('SELECT * FROM categories WHERE id = :id');
                $stmt->execute(['id' => $id]);
                $cat = $stmt->fetch();
                if (!$cat) {
                    respond(404, ['success' => false, 'message' => 'Category not found.']);
                }
                respond(200, ['success' => true, 'data' => format_category($cat)]);
            }

            $stmt = $pdo->query('SELECT * FROM categories ORDER BY group_name ASC, name ASC');
            $rows = $stmt->fetchAll();
            respond(200, ['success' => true, 'data' => array_map('format_category', $rows)]);

        case 'POST':
            $input = read_json_body();
            $name = trim((string)($input['name'] ?? ''));
            $group = trim((string)($input['group'] ?? 'Personal'));
            $icon = trim((string)($input['icon'] ?? 'pricetag-outline'));
            $color = trim((string)($input['color'] ?? '#3979D8'));
            $catId = !empty($input['id']) ? trim((string)$input['id']) : 'cat-custom-' . time();

            if ($name === '') {
                respond(422, ['success' => false, 'message' => 'Category name is required.']);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO categories (id, name, group_name, icon, color)
                 VALUES (:id, :name, :group_name, :icon, :color)'
            );
            $stmt->execute([
                'id'         => $catId,
                'name'       => $name,
                'group_name' => $group === 'Academic' ? 'Academic' : 'Personal',
                'icon'       => $icon,
                'color'      => $color,
            ]);

            $stmt = $pdo->prepare('SELECT * FROM categories WHERE id = :id');
            $stmt->execute(['id' => $catId]);
            $created = $stmt->fetch();

            respond(201, ['success' => true, 'message' => 'Category created.', 'data' => format_category($created)]);

        case 'PUT':
            if ($id === null || $id === '') {
                respond(400, ['success' => false, 'message' => 'Category id parameter is required.']);
            }

            $check = $pdo->prepare('SELECT * FROM categories WHERE id = :id');
            $check->execute(['id' => $id]);
            $existing = $check->fetch();
            if (!$existing) {
                respond(404, ['success' => false, 'message' => 'Category not found.']);
            }

            $input = read_json_body();
            $name = trim((string)($input['name'] ?? $existing['name']));
            $group = trim((string)($input['group'] ?? $existing['group_name']));
            $icon = trim((string)($input['icon'] ?? $existing['icon']));
            $color = trim((string)($input['color'] ?? $existing['color']));

            $stmt = $pdo->prepare(
                'UPDATE categories SET name = :name, group_name = :group_name, icon = :icon, color = :color WHERE id = :id'
            );
            $stmt->execute([
                'id'         => $id,
                'name'       => $name,
                'group_name' => $group === 'Academic' ? 'Academic' : 'Personal',
                'icon'       => $icon,
                'color'      => $color,
            ]);

            // Sync activities if category name was updated
            if ($existing['name'] !== $name) {
                $sync = $pdo->prepare('UPDATE activities SET category = :new_name WHERE category = :old_name');
                $sync->execute(['new_name' => $name, 'old_name' => $existing['name']]);
            }

            $stmt = $pdo->prepare('SELECT * FROM categories WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $updated = $stmt->fetch();

            respond(200, ['success' => true, 'message' => 'Category updated.', 'data' => format_category($updated)]);

        case 'DELETE':
            if ($id === null || $id === '') {
                respond(400, ['success' => false, 'message' => 'Category id parameter is required.']);
            }

            $check = $pdo->prepare('SELECT name FROM categories WHERE id = :id');
            $check->execute(['id' => $id]);
            $cat = $check->fetch();
            if (!$cat) {
                respond(404, ['success' => false, 'message' => 'Category not found.']);
            }

            $stmt = $pdo->prepare('DELETE FROM categories WHERE id = :id');
            $stmt->execute(['id' => $id]);

            // Reassign tasks using deleted category to 'Others'
            $reassign = $pdo->prepare('UPDATE activities SET category = "Others" WHERE category = :deleted_name');
            $reassign->execute(['deleted_name' => $cat['name']]);

            respond(200, ['success' => true, 'message' => 'Category deleted.']);

        default:
            header('Allow: GET, POST, PUT, DELETE, OPTIONS');
            respond(405, ['success' => false, 'message' => 'Method not allowed.']);
    }
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        respond(409, ['success' => false, 'message' => 'A category with that name already exists.']);
    }
    respond(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Throwable $e) {
    respond(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
