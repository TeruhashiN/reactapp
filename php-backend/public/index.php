<?php
declare(strict_types=1);

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
if ($scriptDir !== '' && str_starts_with($uri, $scriptDir)) {
    $uri = substr($uri, strlen($scriptDir));
}
$uri = rtrim($uri, '/');
if ($uri === '') { $uri = '/'; }

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
create_tables($pdo);

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = db_connect();

    $router = [
        ['GET', '/health', fn() => json_out(['ok' => true])],

        ['POST', '/api/login', fn() => route_login($pdo)],
        ['GET', '/api/me', fn() => route_me($pdo)],
        ['PATCH', '/api/me/change-password', fn() => route_change_password($pdo)],
        ['POST', '/api/admin/create-user', fn() => route_create_user($pdo)],
        ['GET', '/api/me/scores', fn() => route_my_scores($pdo)],
        ['POST', '/api/me/level-score', fn() => route_level_score($pdo)],

        ['GET', '/api/leaderboard/me', fn() => route_leaderboard_me($pdo)],
        ['GET', '/api/leaderboard', fn() => route_leaderboard($pdo)],

        ['GET', '/api/dictionary/english', fn() => route_dictionary($pdo)],
        ['GET', '/api/timer-quiz/questions', fn() => route_timer_quiz($pdo)],
        ['GET', '/api/quiz/questions', fn() => route_quiz_questions($pdo)],

        ['POST', '/api/battle/create', fn() => route_battle_create($pdo)],
        ['POST', '/api/battle/join', fn() => route_battle_join($pdo)],
        ['POST', '/api/battle/answer', fn() => route_battle_answer($pdo)],
        ['GET', '/api/battle/pending', fn() => route_battle_pending($pdo)],
    ];

    $found = false;
    foreach ($router as [$m, $path, $handler]) {
        if ($method === $m && $uri === $path) {
            $found = true;
            $handler();
            exit;
        }
    }

    if (!$found && preg_match('#^/api/battle/(\d+)$#', $uri, $matches)) {
        route_battle_get($pdo, (int)$matches[1]);
        exit;
    }

    http_response_code(404);
    json_out(['message' => 'Not found']);
} catch (Throwable $e) {
    http_response_code(500);
    json_out([
        'message' => 'Server error',
        'error' => $e->getMessage(),
        'code' => $e->getCode(),
    ]);
}
