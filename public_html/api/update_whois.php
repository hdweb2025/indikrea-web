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
    echo json_encode(["success" => false, "message" => "Invalid JSON body"]);
    exit;
}

$domain = isset($payload["domain"]) ? trim($payload["domain"]) : "";
$expiry = isset($payload["expiry"]) ? trim($payload["expiry"]) : null;
$rawWhois = isset($payload["raw"]) ? $payload["raw"] : null;

if ($domain === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing domain"]);
    exit;
}

function parse_last_updated($raw) {
    if (!$raw) return null;
    $patterns = [
        "/Updated Date:\s*(.+)/i",
        "/Last Updated On:\s*(.+)/i",
        "/Last Update Date:\s*(.+)/i",
        "/last-modified:\s*(.+)/i",
        "/changed:\s*(.+)/i"
    ];
    foreach ($patterns as $p) {
        if (preg_match($p, $raw, $m)) {
            return trim($m[1]);
        }
    }
    return null;
}

try {
    // Ensure last_updated column exists
    $checkStmt = $pdo->prepare("SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'websites' AND COLUMN_NAME = 'last_updated'");
    $checkStmt->execute([":db" => DB_NAME]);
    $exists = (int)$checkStmt->fetch()["cnt"] > 0;
    if (!$exists) {
        $pdo->exec("ALTER TABLE websites ADD COLUMN last_updated VARCHAR(64) NULL");
    }

    $lastUpdated = parse_last_updated($rawWhois);
    if (!$lastUpdated) {
        $lastUpdated = date("Y-m-d H:i:s");
    }

    // If expiry is a full datetime string, try normalizing to date
    if ($expiry) {
        $time = strtotime($expiry);
        if ($time !== false) {
            $expiry = date("Y-m-d", $time);
        }
    }

    $updateSql = "UPDATE websites SET " .
        ($expiry ? "expiry_date = :expiry, " : "") .
        "last_updated = :lastUpdated WHERE domain_name = :domain";
    $stmt = $pdo->prepare($updateSql);
    $params = [
        ":lastUpdated" => $lastUpdated,
        ":domain" => $domain
    ];
    if ($expiry) {
        $params[":expiry"] = $expiry;
    }
    $stmt->execute($params);

    // --- NEW LOGIC: Update Children (Subdomains) ---
    // Find the ID of the domain we just updated
    $idStmt = $pdo->prepare("SELECT id FROM websites WHERE domain_name = :domain");
    $idStmt->execute([":domain" => $domain]);
    $mainId = $idStmt->fetchColumn();

    if ($mainId) {
        // Ensure parentId column exists before using it
        $colCheck = $pdo->prepare("SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'websites' AND COLUMN_NAME = 'parentId'");
        $colCheck->execute([":db" => DB_NAME]);
        if ((int)$colCheck->fetch()["cnt"] > 0) {
            // Update all websites where parentId matches this domain's ID
            $childSql = "UPDATE websites SET " .
                ($expiry ? "expiry_date = :expiry, " : "") .
                "last_updated = :lastUpdated WHERE parentId = :parentId";
            
            $childParams = [
                ":lastUpdated" => $lastUpdated,
                ":parentId" => $mainId
            ];
            if ($expiry) {
                $childParams[":expiry"] = $expiry;
            }
            
            $childStmt = $pdo->prepare($childSql);
            $childStmt->execute($childParams);
        }
    }
    // -----------------------------------------------

    if ($stmt->rowCount() === 0 && $expiry) {
        // Check if data is already same
        $checkSame = $pdo->prepare("SELECT expiry_date FROM websites WHERE domain_name = :domain");
        $checkSame->execute([":domain" => $domain]);
        $currExpiry = $checkSame->fetchColumn();
        
        // If current expiry matches new expiry, it's not an error, just no change needed
        if ($currExpiry === $expiry) {
             echo json_encode(["success" => true, "domain" => $domain, "expiry" => $expiry, "last_updated" => $lastUpdated, "message" => "No changes needed"]);
             exit;
        }
        
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Domain not found or no changes made"]);
        exit;
    }

    echo json_encode(["success" => true, "domain" => $domain, "expiry" => $expiry, "last_updated" => $lastUpdated]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Update failed: " . $e->getMessage()]);
}
