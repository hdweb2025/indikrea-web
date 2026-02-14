<?php
// --- PENGATURAN DATABASE ---
// Gunakan variabel environment jika tersedia (untuk keamanan di production)
// atau fallback ke nilai hardcoded jika tidak.
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'u573188607_hosting');
define('DB_PASS', getenv('DB_PASS') ?: 'ObB2^5rW');
define('DB_NAME', getenv('DB_NAME') ?: 'u573188607_hosting');
?>
