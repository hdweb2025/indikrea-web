<?php
// --- INCLUDE CONFIG ---
require_once "config.php";

function getDbConnection() {
    try {
        // Gunakan konstanta dari config.php
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        // Jangan tampilkan error detail ke user di production
        header("Content-Type: application/json");
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Database connection failed. Please try again later."
        ]);
        // Log error sebenarnya ke file log server, bukan ke output
        error_log("DB Connection Error: " . $e->getMessage());
        exit;
    }
}

// Global variable $pdo for backward compatibility
// HATI-HATI: Sebaiknya hindari penggunaan global $pdo ini jika memungkinkan,
// tapi untuk menjaga kompatibilitas dengan file lain yang mungkin me-require db.php langsung:
try {
    $pdo = getDbConnection();
} catch (Exception $e) {
    // Error handled in function
}
?>