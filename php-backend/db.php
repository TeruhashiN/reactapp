<?php
declare(strict_types=1);

function create_tables(PDO $pdo): void {
    $sql = <<<SQL
CREATE TABLE IF NOT EXISTS level_scores (
    user_id INT NOT NULL,
    level INT NOT NULL,
    best_score INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL;
    $pdo->exec($sql);

    $sql = <<<SQL
CREATE TABLE IF NOT EXISTS multiplayer_battles (
    battle_id INT AUTO_INCREMENT PRIMARY KEY,
    challenger_id INT NOT NULL,
    opponent_id INT NULL,
    question_count INT NOT NULL,
    questions JSON NOT NULL,
    challenger_score INT NOT NULL DEFAULT 0,
    opponent_score INT NOT NULL DEFAULT 0,
    challenger_current_q INT NOT NULL DEFAULT 0,
    opponent_current_q INT NOT NULL DEFAULT 0,
    challenger_finished TINYINT NOT NULL DEFAULT 0,
    opponent_finished TINYINT NOT NULL DEFAULT 0,
    status ENUM('waiting','in_progress','completed') NOT NULL DEFAULT 'waiting',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL;
    $pdo->exec($sql);
}

function table_users(): string {
    global $table_users_cache;
    static $table_users_cache = null;
    if ($table_users_cache === null) {
        $table_users_cache = (string) (env('DB_TABLE') ?: 'user');
    }
    return $table_users_cache;
}

function db_connect(): PDO {
    $host = env('DB_HOST');
    $db = env('DB_NAME');
    $user = env('DB_USER');
    $pass = env('DB_PASSWORD');
    $dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    return new PDO($dsn, $user, $pass, $options);
}

function get_user_by_username(PDO $pdo, string $username): ?array {
    $stmt = $pdo->prepare('SELECT user_id, username, password, score, role FROM `' . table_users() . '` WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function get_user_by_id(PDO $pdo, int $userId): ?array {
    $stmt = $pdo->prepare('SELECT user_id, username, password, score, role FROM `' . table_users() . '` WHERE user_id = ? LIMIT 1');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function get_level_scores(PDO $pdo, int $userId): array {
    $stmt = $pdo->prepare('SELECT level, best_score FROM level_scores WHERE user_id = ? ORDER BY level ASC');
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();
    return array_map(static fn($r) => ['level' => (int)$r['level'], 'best_score' => (int)$r['best_score']], $rows);
}

function set_level_score(PDO $pdo, int $userId, int $level, int $score): void {
    $stmt = $pdo->prepare('SELECT best_score FROM level_scores WHERE user_id = ? AND level = ? LIMIT 1');
    $stmt->execute([$userId, $level]);
    $existing = $stmt->fetch();
    $existingScore = isset($existing['best_score']) ? (int)$existing['best_score'] : 0;
    if ($score <= $existingScore) {
        return;
    }
    $stmt = $pdo->prepare('INSERT INTO level_scores (user_id, level, best_score) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE best_score = GREATEST(best_score, VALUES(best_score))');
    $stmt->execute([$userId, $level, $score]);

    $total = get_total_score($pdo, $userId);
    $stmt = $pdo->prepare('UPDATE `' . table_users() . '` SET score = ? WHERE user_id = ?');
    $stmt->execute([$total, $userId]);
}

function get_total_score(PDO $pdo, int $userId): int {
    $stmt = $pdo->prepare('SELECT SUM(best_score) AS total FROM level_scores WHERE user_id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    $total = isset($row['total']) ? (int)$row['total'] : 0;
    return $total;
}
