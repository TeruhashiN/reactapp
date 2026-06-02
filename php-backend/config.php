<?php
declare(strict_types=1);

function env(string $key, ?string $default = null): ?string {
    static $loaded = false;
    static $map = [];
    if (!$loaded) {
        $path = dirname(__DIR__) . '/.env';
        if (is_file($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if (is_array($lines)) {
                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || str_starts_with($line, '#')) {
                        continue;
                    }
                    $pos = strpos($line, '=');
                    if ($pos === false) {
                        continue;
                    }
                    $k = trim(substr($line, 0, $pos));
                    $v = ltrim(substr($line, $pos + 1), ' ');
                    $v = trim($v);
                    if ($v !== '' && ($v[0] === '"' || $v[0] === "'")) {
                        $q = $v[0];
                        $v = substr($v, 1, -1);
                    }
                    $map[$k] = $v;
                }
            }
        }
        $loaded = true;
    }
    return array_key_exists($key, $map) ? $map[$key] : $default;
}

function json_out(array $data, int $status = 200): void {
    if ($status !== 200) {
        http_response_code($status);
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
