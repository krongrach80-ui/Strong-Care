<?php
/**
 * Strong Care - IP-based Rate Limiter
 * Locks out IP temporarily after consecutive failed biometric/login attempts
 */
class RateLimiter {
    private static string $cacheDir = __DIR__ . '/../cache/ratelimit';

    public static function check(string $action, string $ip, int $maxAttempts = 5, int $decaySeconds = 300): bool {
        if (!is_dir(self::$cacheDir)) {
            @mkdir(self::$cacheDir, 0755, true);
        }

        $key = md5("{$action}_{$ip}");
        $file = self::$cacheDir . "/{$key}.json";

        if (!file_exists($file)) {
            return true;
        }

        $data = json_decode(file_get_contents($file), true);
        if (!$data || !isset($data['attempts'], $data['last_attempt'])) {
            return true;
        }

        $now = time();
        if ($now - $data['last_attempt'] > $decaySeconds) {
            @unlink($file);
            return true;
        }

        return $data['attempts'] < $maxAttempts;
    }

    public static function recordFailure(string $action, string $ip, int $decaySeconds = 300): int {
        if (!is_dir(self::$cacheDir)) {
            @mkdir(self::$cacheDir, 0755, true);
        }

        $key = md5("{$action}_{$ip}");
        $file = self::$cacheDir . "/{$key}.json";
        $now = time();

        $data = ['attempts' => 1, 'first_attempt' => $now, 'last_attempt' => $now];
        if (file_exists($file)) {
            $existing = json_decode(file_get_contents($file), true);
            if ($existing && ($now - $existing['last_attempt'] <= $decaySeconds)) {
                $data['attempts'] = ($existing['attempts'] ?? 0) + 1;
                $data['first_attempt'] = $existing['first_attempt'] ?? $now;
            }
        }

        file_put_contents($file, json_encode($data));
        return $data['attempts'];
    }

    public static function reset(string $action, string $ip): void {
        $key = md5("{$action}_{$ip}");
        $file = self::$cacheDir . "/{$key}.json";
        if (file_exists($file)) {
            @unlink($file);
        }
    }
}
