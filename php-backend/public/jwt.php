<?php
declare(strict_types=1);

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
}

function jwt_encode(array $payload, string $secret): string {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $segments = base64url_encode(json_encode($header)) . '.' . base64url_encode(json_encode($payload));
    $signature = hash_hmac('sha256', $segments, $secret, true);
    return $segments . '.' . base64url_encode($signature);
}

function jwt_decode(string $token, string $secret): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    [$headerB64, $payloadB64, $sigB64] = $parts;
    $signature = base64url_decode($sigB64);
    if ($signature === false) {
        return null;
    }
    $expected = hash_hmac('sha256', $headerB64 . '.' . $payloadB64, $secret, true);
    if (!hash_equals($expected, $signature)) {
        return null;
    }
    $payload = json_decode((string) base64url_decode($payloadB64), true);
    if (!is_array($payload)) {
        return null;
    }
    if (isset($payload['exp']) && time() >= (int)$payload['exp']) {
        return null;
    }
    return $payload;
}

function require_auth(): array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if ($authHeader === '') {
        json_out(['message' => 'Missing Authorization header'], 401);
    }
    $parts = explode(' ', $authHeader);
    if (count($parts) !== 2 || $parts[0] !== 'Bearer' || $parts[1] === '') {
        json_out(['message' => 'Invalid Authorization header format'], 401);
    }
    $token = $parts[1];
    $secret = env('JWT_SECRET');
    if ($secret === null || $secret === '') {
        json_out(['message' => 'JWT secret not configured'], 500);
    }
    $payload = jwt_decode($token, $secret);
    if ($payload === null) {
        json_out(['message' => 'Invalid or expired token'], 401);
    }
    return $payload;
}
