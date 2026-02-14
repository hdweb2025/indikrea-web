<?php
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");

$input = file_get_contents("php://input");
$body = json_decode($input, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    $body = null;
}
$password = isset($_GET["p"]) ? $_GET["p"] : (isset($_POST["password"]) ? $_POST["password"] : ($body["password"] ?? null));
$costRaw = isset($_GET["cost"]) ? $_GET["cost"] : ($body["cost"] ?? null);
$cost = is_numeric($costRaw) ? max(4, min(15, (int)$costRaw)) : 10;

if (!$password || trim($password) === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Masukkan password melalui query ?p=... atau body JSON {\"password\":\"...\"}",
        "example" => "/api/password_hash.php?p=PasswordKuatAnda&cost=10"
    ]);
    exit;
}

try {
    $hash = password_hash($password, PASSWORD_BCRYPT, ["cost" => $cost]);
    echo json_encode([
        "success" => true,
        "algorithm" => "bcrypt",
        "cost" => $cost,
        "hash" => $hash
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Gagal membuat hash: " . $e->getMessage()]);
}
