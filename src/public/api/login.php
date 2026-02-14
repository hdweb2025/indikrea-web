<?php
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once "db.php";

$raw = file_get_contents("php://input");
$payload = json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid request body"]);
    exit;
}
$username = isset($payload["username"]) ? trim($payload["username"]) : "";
$password = isset($payload["password"]) ? $payload["password"] : "";
if ($username === "" || $password === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Username and password are required"]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, username, password, role, client_id FROM users WHERE username = :u LIMIT 1");
    $stmt->execute([":u" => $username]);
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid username or password"]);
        exit;
    }
    $hash = $row["password"];
    $valid = false;
    if (strlen($hash) > 0 && (substr($hash, 0, 4) === '$2y$' || substr($hash, 0, 4) === '$2a$')) {
        $valid = password_verify($password, $hash);
    } else {
        $valid = ($password === $hash);
    }
    if (!$valid) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid username or password"]);
        exit;
    }
    $user = [
        "id" => (int)$row["id"],
        "username" => $row["username"],
        "name" => $row["username"],
        "email" => "",
        "role" => $row["role"],
        "status" => "Active",
        "clientId" => isset($row["client_id"]) ? (int)$row["client_id"] : null
    ];
    http_response_code(200);
    echo json_encode(["success" => true, "user" => $user]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server Error: " . $e->getMessage()]);
}
