<?php
declare(strict_types=1);

function route_login(PDO $pdo): void {
    global $input;
    $input = read_json_input();
    $username = (string) ($input['username'] ?? '');
    $password = (string) ($input['password'] ?? '');
    if ($username === '' || $password === '') {
        json_out(['message' => 'username and password are required'], 400);
    }
    $user = get_user_by_username($pdo, $username);
    if (!$user) {
        json_out(['message' => 'Invalid username or password'], 401);
    }
    if ($user['password'] !== $password) {
        json_out(['message' => 'Invalid username or password'], 401);
    }
    $total = get_total_score($pdo, (int) $user['user_id']);
    $level = min(20, (int) floor($total / 25) + 1);
    $payload = [
        'user_id' => (int) $user['user_id'],
        'username' => $user['username'],
        'score' => $total,
        'level' => $level,
    ];
    $secret = env('JWT_SECRET');
    $token = jwt_encode(array_merge($payload, ['exp' => time() + 60 * 60 * 24 * 7]), $secret);
    json_out(['token' => $token, 'user' => $payload]);
}

function route_me(PDO $pdo): void {
    $tokenPayload = require_auth();
    $userId = (int) $tokenPayload['user_id'];
    $user = get_user_by_id($pdo, $userId);
    if (!$user) {
        json_out(['message' => 'User not found'], 404);
    }
    $total = get_total_score($pdo, $userId);
    $level = min(20, (int) floor($total / 25) + 1);
    $role = $user['role'] ?? 'user';
    json_out(['user' => [
        'user_id' => (int) $user['user_id'],
        'username' => $user['username'],
        'score' => $total,
        'level' => $level,
        'role' => $role,
    ]]);
}

function route_change_password(PDO $pdo): void {
    global $input;
    $input = read_json_input();
    $tokenPayload = require_auth();
    $currentPassword = (string) ($input['current_password'] ?? '');
    $newPassword = (string) ($input['new_password'] ?? '');
    if ($currentPassword === '' || $newPassword === '') {
        json_out(['message' => 'current_password and new_password are required'], 400);
    }
    $userId = (int) $tokenPayload['user_id'];
    $user = get_user_by_id($pdo, $userId);
    if (!$user) {
        json_out(['message' => 'User not found'], 404);
    }
    if ($user['password'] !== $currentPassword) {
        json_out(['message' => 'Current password is incorrect'], 401);
    }
    if (strlen($newPassword) < 6) {
        json_out(['message' => 'New password must be at least 6 characters'], 400);
    }
    $stmt = $pdo->prepare('UPDATE `' . table_users() . '` SET password = ? WHERE user_id = ?');
    $stmt->execute([$newPassword, $userId]);
    if ($stmt->rowCount() === 0) {
        json_out(['message' => 'Failed to update password'], 500);
    }
    json_out(['ok' => true]);
}

function route_create_user(PDO $pdo): void {
    global $input;
    $input = read_json_input();
    $tokenPayload = require_auth();
    $username = (string) ($input['username'] ?? '');
    $password = (string) ($input['password'] ?? '');
    if ($username === '' || $password === '') {
        json_out(['message' => 'username and password are required'], 400);
    }
    if (strlen($username) < 3) {
        json_out(['message' => 'username must be at least 3 characters'], 400);
    }
    if (strlen($password) < 6) {
        json_out(['message' => 'password must be at least 6 characters'], 400);
    }
    $duplicate = get_user_by_username($pdo, $username);
    if ($duplicate) {
        json_out(['message' => 'Username already exists'], 409);
    }
    $stmt = $pdo->query('SELECT MAX(user_id) AS maxId FROM `' . table_users() . '`');
    $row = $stmt->fetch();
    $nextId = ((int) ($row['maxId'] ?? 0)) + 1;
    $stmt = $pdo->prepare('INSERT INTO `' . table_users() . '` (user_id, username, password, score) VALUES (?, ?, ?, ?)');
    $stmt->execute([$nextId, $username, $password, 0]);
    $newUser = get_user_by_username($pdo, $username);
    if (!$newUser) {
        json_out(['message' => 'Failed to load newly created user'], 500);
    }
    json_out(['user' => [
        'user_id' => (int) $newUser['user_id'],
        'username' => $newUser['username'],
        'role' => $newUser['role'] ?? 'user',
    ]], 201);
}

function route_my_scores(PDO $pdo): void {
    $tokenPayload = require_auth();
    $level = isset($_GET['level']) ? (int) $_GET['level'] : 1;
    $allScores = get_level_scores($pdo, (int) $tokenPayload['user_id']);
    $entry = null;
    foreach ($allScores as $score) {
        if ($score['level'] === $level) {
            $entry = $score;
            break;
        }
    }
    if (!$entry) {
        $entry = ['level' => $level, 'best_score' => 0];
    }
    json_out(['scores' => [$entry]]);
}

function route_level_score(PDO $pdo): void {
    global $input;
    $input = read_json_input();
    $tokenPayload = require_auth();
    $level = isset($input['level']) ? (int) $input['level'] : 0;
    $score = isset($input['score']) ? (int) $input['score'] : 0;
    if (!is_int($level) || $level < 1 || !is_int($score) || $score < 0) {
        json_out(['message' => 'level and positive score are required'], 400);
    }
    $userId = (int) $tokenPayload['user_id'];
    set_level_score($pdo, $userId, $level, $score);
    $total = get_total_score($pdo, $userId);
    json_out(['ok' => true, 'total' => $total]);
}

function route_leaderboard_me(PDO $pdo): void {
    $tokenPayload = require_auth();
    $currentUserId = (int) $tokenPayload['user_id'];
    $stmt = $pdo->query('SELECT COUNT(*) AS total FROM `' . table_users() . '`');
    $row = $stmt->fetch();
    $totalUsers = (int) ($row['total'] ?? 0);
    $myScore = get_total_score($pdo, $currentUserId);
    $stmt = $pdo->query('SELECT user_id, SUM(best_score) as total FROM level_scores GROUP BY user_id');
    $allTotals = $stmt->fetchAll();
    $higher = 0;
    foreach ($allTotals as $r) {
        if ((int) ($r['total'] ?? 0) > $myScore) {
            $higher++;
        }
    }
    $rank = $higher + 1;
    json_out(['totalUsers' => $totalUsers, 'rank' => $rank]);
}

function route_leaderboard(PDO $pdo): void {
    $tokenPayload = require_auth();
    $limit = (int) ($_GET['limit'] ?? 25);
    $limit = min($limit, 100);
    $stmt = $pdo->prepare('SELECT u.user_id, u.username, COALESCE(SUM(ls.best_score), 0) as total FROM `user` u LEFT JOIN level_scores ls ON u.user_id = ls.user_id GROUP BY u.user_id, u.username ORDER BY total DESC LIMIT ?');
    $stmt->execute([$limit]);
    $allTotals = $stmt->fetchAll();
    $ranked = [];
    $idx = 1;
    foreach ($allTotals as $r) {
        $ranked[] = [
            'rank' => $idx++,
            'user_id' => (int) $r['user_id'],
            'username' => $r['username'],
            'score' => (int) $r['total'],
        ];
    }
    json_out(['users' => $ranked]);
}

function route_dictionary(PDO $pdo): void {
    $dbName = env('DB_NAME');
    if ($dbName === null || $dbName === '') {
        json_out(['message' => 'Database not configured.'], 500);
    }
    $table = 'english';
    $stmt = $pdo->prepare('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION');
    $stmt->execute([$dbName, $table]);
    $columns = $stmt->fetchAll();
    $colNames = array_map(static fn($c) => $c['COLUMN_NAME'], $columns);
    $englishCol = in_array('english', $colNames) ? 'english' : 'words';
    $stmt = $pdo->prepare('SELECT `' . $englishCol . '` AS english, meaning, chinese FROM `' . $table . '` ORDER BY `' . $englishCol . '` ASC');
    $stmt->execute();
    $rows = $stmt->fetchAll();
    $items = [];
    foreach ($rows as $r) {
        $items[] = [
            'english' => $r['english'],
            'meaning' => $r['meaning'],
            'chinese' => $r['chinese'],
        ];
    }
    json_out(['items' => $items]);
}

function route_timer_quiz(PDO $pdo): void {
    $countParam = (int) ($_GET['count'] ?? 20);
    $count = min($countParam, 100);
    $dbName = env('DB_NAME');
    if ($dbName === null || $dbName === '') {
        json_out(['message' => 'Database not configured.'], 500);
    }
    $table = 'english';
    $stmt = $pdo->prepare('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION');
    $stmt->execute([$dbName, $table]);
    $columns = $stmt->fetchAll();
    $colNames = array_map(static fn($c) => $c['COLUMN_NAME'], $columns);
    $englishCol = in_array('english', $colNames) ? 'english' : 'words';
    $stmt = $pdo->prepare('SELECT `' . $englishCol . '` AS word, meaning FROM `' . $table . '` WHERE meaning IS NOT NULL AND meaning != \'\' ORDER BY RAND() LIMIT ?');
    $stmt->execute([$count]);
    $rows = $stmt->fetchAll();
    $stmt = $pdo->prepare('SELECT meaning FROM `' . $table . '` WHERE meaning IS NOT NULL AND meaning != \'\'');
    $stmt->execute();
    $allMeaningRows = $stmt->fetchAll();
    $allMeanings = array_map(static fn($r) => $r['meaning'], $allMeaningRows);
    $questions = [];
    foreach ($rows as $q) {
        $distractors = array_values(array_filter($allMeanings, static fn($m) => $m !== $q['meaning']));
        shuffle($distractors);
        $options = shuffle_array(array_merge(array_slice($distractors, 0, 3), [$q['meaning']]));
        $questions[] = [
            'id' => isset($q['id']) ? (int) $q['id'] : 0,
            'word' => $q['word'],
            'options' => array_map(static fn($opt, $i) => chr(65 + $i) . '. ' . $opt, $options, array_keys($options)),
            'answer' => $q['meaning'],
        ];
    }
    json_out(['questions' => $questions]);
}

function route_quiz_questions(PDO $pdo): void {
    $level = (int) ($_GET['level'] ?? 1);
    $limit = (int) ($_GET['limit'] ?? 25);
    $dbName = env('DB_NAME');
    if ($dbName === null || $dbName === '') {
        json_out(['message' => 'Database not configured.'], 500);
    }
    $table = 'english';
    $stmt = $pdo->prepare('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION');
    $stmt->execute([$dbName, $table]);
    $columns = $stmt->fetchAll();
    $colNames = array_map(static fn($c) => $c['COLUMN_NAME'], $columns);
    $hasId = in_array('id', $colNames);

    if ($hasId) {
        $levelStart = ($level - 1) * 25 + 1;
        $levelEnd = $level * 25;
        $stmt = $pdo->prepare('SELECT id, words AS word, meaning FROM `' . $table . '` WHERE id BETWEEN ? AND ? AND meaning IS NOT NULL AND meaning != \'\' ORDER BY RAND()');
        $stmt->execute([$levelStart, $levelEnd]);
        $rows = $stmt->fetchAll();
    } else {
        $offset = ($level - 1) * 25;
        $stmt = $pdo->prepare('SELECT word, meaning FROM (SELECT words AS word, meaning FROM `' . $table . '` WHERE meaning IS NOT NULL AND meaning != \'\' ORDER BY words ASC LIMIT ? OFFSET ?) AS lvl ORDER BY RAND()');
        $stmt->execute([$limit, $offset]);
        $rows = $stmt->fetchAll();
    }

    $stmt = $pdo->prepare('SELECT meaning FROM `' . $table . '` WHERE meaning IS NOT NULL AND meaning != \'\'');
    $stmt->execute();
    $allMeaningRows = $stmt->fetchAll();
    $allMeanings = array_map(static fn($r) => $r['meaning'], $allMeaningRows);

    $questions = [];
    $levelStart = ($level - 1) * 25 + 1;
    foreach ($rows as $idx => $q) {
        $distractors = array_values(array_filter($allMeanings, static fn($m) => $m !== $q['meaning']));
        shuffle($distractors);
        $options = shuffle_array(array_merge(array_slice($distractors, 0, 3), [$q['meaning']]));
        $questions[] = [
            'id' => $hasId ? (int) $q['id'] : $levelStart + $idx,
            'word' => $q['word'],
            'options' => array_map(static fn($opt, $i) => chr(65 + $i) . '. ' . $opt, $options, array_keys($options)),
            'answer' => $q['meaning'],
        ];
    }
    json_out(['questions' => $questions]);
}

function route_battle_create(PDO $pdo): void {
    global $input;
    $input = read_json_input();
    $tokenPayload = require_auth();
    $opponentId = isset($input['opponent_id']) ? (int) $input['opponent_id'] : 0;
    $questionCount = isset($input['question_count']) ? (int) $input['question_count'] : 10;
    $questions = isset($input['questions']) && is_array($input['questions']) ? $input['questions'] : [];
    if ($opponentId <= 0 || count($questions) === 0) {
        json_out(['message' => 'opponent_id and questions are required'], 400);
    }
    $challengerId = (int) $tokenPayload['user_id'];
    $stmt = $pdo->prepare('INSERT INTO multiplayer_battles (challenger_id, opponent_id, question_count, questions) VALUES (?, ?, ?, ?)');
    $stmt->execute([$challengerId, $opponentId, $questionCount, json_encode($questions, JSON_UNESCAPED_UNICODE)]);
    $battleId = (int) $pdo->lastInsertId();
    json_out(['battle_id' => $battleId], 201);
}

function route_battle_join(PDO $pdo): void {
    global $input;
    $input = read_json_input();
    $tokenPayload = require_auth();
    $battleId = isset($input['battle_id']) ? (int) $input['battle_id'] : 0;
    if ($battleId <= 0) {
        json_out(['message' => 'battle_id is required'], 400);
    }
    $userId = (int) $tokenPayload['user_id'];
    $stmt = $pdo->prepare('SELECT challenger_id, opponent_id FROM multiplayer_battles WHERE battle_id = ? LIMIT 1');
    $stmt->execute([$battleId]);
    $battle = $stmt->fetch();
    if (!$battle) {
        json_out(['message' => 'Battle not found'], 404);
    }
    if ((int) $battle['challenger_id'] === $userId) {
        json_out(['message' => 'Challenger cannot join their own battle'], 400);
    }
    if ((int) $battle['opponent_id'] === $userId) {
        json_out(['message' => 'Already joined'], 400);
    }
    $stmt = $pdo->prepare('UPDATE multiplayer_battles SET opponent_id = ?, status = \'in_progress\' WHERE battle_id = ? AND status = \'waiting\' AND opponent_id IS NULL');
    $rows = $stmt->execute([$userId, $battleId]);
    $ok = $stmt->rowCount() > 0;
    if (!$ok) {
        json_out(['message' => 'Battle not available'], 409);
    }
    json_out(['ok' => true]);
}

function route_battle_answer(PDO $pdo): void {
    global $input;
    $input = read_json_input();
    $tokenPayload = require_auth();
    $battleId = isset($input['battle_id']) ? (int) $input['battle_id'] : 0;
    $questionIndex = isset($input['question_index']) ? (int) $input['question_index'] : 0;
    $isCorrect = isset($input['is_correct']) ? (bool) $input['is_correct'] : false;
    $finished = isset($input['finished']) ? (bool) $input['finished'] : false;
    if ($battleId <= 0) {
        json_out(['message' => 'battle_id is required'], 400);
    }
    $userId = (int) $tokenPayload['user_id'];
    $stmt = $pdo->prepare('SELECT challenger_id, opponent_id, challenger_score, opponent_score, challenger_current_q, opponent_current_q, challenger_finished, opponent_finished, questions FROM multiplayer_battles WHERE battle_id = ? LIMIT 1');
    $stmt->execute([$battleId]);
    $battle = $stmt->fetch();
    if (!$battle) {
        json_out(['message' => 'Battle not found'], 404);
    }
    $isChallenger = $userId === (int) $battle['challenger_id'];
    if (!$isChallenger && $userId !== (int) $battle['opponent_id']) {
        json_out(['message' => 'Forbidden'], 403);
    }
    $challengerScore = (int) $battle['challenger_score'];
    $opponentScore = (int) $battle['opponent_score'];
    $nextScore = $isChallenger ? $challengerScore + ($isCorrect ? 1 : 0) : $opponentScore + ($isCorrect ? 1 : 0);
    $currentQChallenger = (int) $battle['challenger_current_q'];
    $currentQOpponent = (int) $battle['opponent_current_q'];
    $nextIndex = max($isChallenger ? $currentQChallenger : $currentQOpponent, $questionIndex + 1);
    if ($isChallenger) {
        $currentQChallenger = $nextIndex;
    } else {
        $currentQOpponent = $nextIndex;
    }
    $nextFinished = $finished ? ($isChallenger ? 1 : 2) : ($isChallenger ? (int)$battle['challenger_finished'] : (int)$battle['opponent_finished']);
    $bothFinished = false;
    if ((int)$battle['challenger_finished'] === 1 && (int)$battle['opponent_finished'] === 2) {
        $bothFinished = true;
    }
    $newStatus = $bothFinished ? 'completed' : 'in_progress';
    $stmt = $pdo->prepare('UPDATE multiplayer_battles SET ' . ($isChallenger ? 'challenger_score' : 'opponent_score') . ' = ?, ' . ($isChallenger ? 'challenger_current_q' : 'opponent_current_q') . ' = ?, ' . ($isChallenger ? 'challenger_finished' : 'opponent_finished') . ' = ?, status = ? WHERE battle_id = ?');
    $stmt->execute([$nextScore, $nextIndex, $nextFinished, $newStatus, $battleId]);
    $questions = json_decode((string) $battle['questions'], true);
    if (!is_array($questions)) {
        $questions = [];
    }
    $opponentFinished = $newStatus === 'completed';
    json_out([
        'score' => $nextScore,
        'currentQ' => $nextIndex,
        'finished' => (bool) $nextFinished,
        'opponentFinished' => $opponentFinished,
        'status' => $newStatus,
        'questions' => $questions,
    ]);
}

function route_battle_pending(PDO $pdo): void {
    $tokenPayload = require_auth();
    $userId = (int) $tokenPayload['user_id'];
    $stmt = $pdo->prepare('SELECT battle_id, challenger_id, question_count, created_at FROM multiplayer_battles WHERE opponent_id = ? AND status = \'waiting\' ORDER BY created_at ASC');
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();
    json_out(['battles' => $rows]);
}

function route_battle_get(PDO $pdo, int $battleId): void {
    $tokenPayload = require_auth();
    $userId = (int) $tokenPayload['user_id'];
    $stmt = $pdo->prepare('SELECT battle_id, challenger_id, opponent_id, question_count, challenger_score, opponent_score, challenger_current_q, opponent_current_q, challenger_finished, opponent_finished, status, questions FROM multiplayer_battles WHERE battle_id = ? LIMIT 1');
    $stmt->execute([$battleId]);
    $battle = $stmt->fetch();
    if (!$battle) {
        json_out(['message' => 'Battle not found'], 404);
    }
    if ($userId !== (int) $battle['challenger_id'] && $userId !== (int) $battle['opponent_id']) {
        json_out(['message' => 'Forbidden'], 403);
    }
    $questions = json_decode((string) $battle['questions'], true);
    if (!is_array($questions)) {
        $questions = [];
    }
    unset($battle['questions']);
    $battle['questions'] = $questions;
    json_out(['battle' => $battle]);
}

function read_json_input(): array {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return [];
    }
    return $data;
}

function shuffle_array(array $arr): array {
    shuffle($arr);
    return $arr;
}
