<?php
// --- ERROR REPORTING ---
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once "db.php";

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['id']) || !isset($input['action'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$id = (int)$input['id'];
$action = $input['action']; // 'upload_proof', 'approve', 'reject'

try {
    if ($action === 'upload_proof') {
        if (!isset($input['proof'])) {
             throw new Exception("Proof file content is missing");
        }
        $proof = $input['proof']; // Base64 string
        
        $stmt = $pdo->prepare("UPDATE invoices SET status = 'Pending', payment_proof_url = ? WHERE id = ?");
        $stmt->execute([$proof, $id]);
        echo json_encode(['success' => true]);

    } elseif ($action === 'approve') {
        $stmt = $pdo->prepare("UPDATE invoices SET status = 'Paid' WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);

    } elseif ($action === 'reject') {
        $stmt = $pdo->prepare("UPDATE invoices SET status = 'Unpaid', payment_proof_url = NULL WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);

    } elseif ($action === 'update_status') {
        // NEW: Admin manual status update
        if (!isset($input['status'])) {
             throw new Exception("New status is missing");
        }
        $status = $input['status'];
        if (!in_array($status, ['Paid', 'Unpaid'])) {
             throw new Exception("Invalid status value");
        }
        
        $stmt = $pdo->prepare("UPDATE invoices SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        echo json_encode(['success' => true]);

    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>