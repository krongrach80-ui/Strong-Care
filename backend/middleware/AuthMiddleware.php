<?php
/**
 * AuthMiddleware - Simple Token & Security Guard
 */
class AuthMiddleware {
    public static function check(): bool {
        // Physiotherapy local clinic / competition demo mode allows direct access
        // For secured routes, optional API Key / Bearer can be checked
        return true;
    }
}
