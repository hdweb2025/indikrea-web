<?php
header("Content-Type: application/json; charset=UTF-8");
require_once 'db.php';

$input = json_decode(file_get_contents("php://input"));

if (!$input || !isset($input->user) || !isset($input->action) || !isset($input->payload)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request structure.']);
    exit;
}

// Security Check: Only superadmins can update data.
if ($input->user->role !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Permission denied.']);
    exit;
}

$pdo = getDbConnection();
$action = $input->action;
$payload = $input->payload;

try {
    switch ($action) {
        case 'update_client':
            updateClient($pdo, $payload);
            break;
        case 'update_site_settings':
            updateSiteSettings($pdo, $payload);
            break;
        case 'update_invoice_status':
            updateInvoiceStatus($pdo, $payload);
            break;
        case 'update_package':
            updatePackage($pdo, $payload);
            break;
        case 'update_registration':
            updateRegistration($pdo, $payload);
            break;
        case 'update_settings':
            // Re-use updateSiteSettings logic but check payload structure
            updateSiteSettings($pdo, $payload);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred: ' . $e->getMessage()]);
}

function updateClient($pdo, $clientData) {
    $sql = "UPDATE clients SET 
                name = :name, 
                contact_person = :contact_person, 
                email = :email, 
                phone = :phone, 
                address = :address, 
                company_reg_no = :company_reg_no, 
                join_date = :join_date, 
                status = :status 
            WHERE id = :id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $clientData->id,
        ':name' => $clientData->name,
        ':contact_person' => $clientData->contact_person,
        ':email' => $clientData->email,
        ':phone' => $clientData->phone,
        ':address' => $clientData->address,
        ':company_reg_no' => $clientData->company_reg_no,
        ':join_date' => $clientData->join_date,
        ':status' => $clientData->status
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Client updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'No changes were made to the client.']);
    }
}

function updateSiteSettings($pdo, $settings) {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES (:key, :value) ON DUPLICATE KEY UPDATE setting_value = :value");

    foreach ($settings as $key => $value) {
        if ($key === 'companyLogo' && strpos($value, 'data:image') === 0) {
            // Handle logo upload
            $value = saveBase64Image($value, 'logo');
        }

        // For array/object values, convert to JSON string
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value);
        }

        // --- NEW LOGIC: Handle specific keys to match DB dump ---
        
        // 1. Rename 'headerLinks' -> 'headerLinks' (no change needed if names match, but check logic)
        // 2. Rename 'footer.linkColumns' -> 'footerLinks'
        if ($key === 'footerLinks' && is_array($value)) {
             // If payload sends raw array, json_encode it. 
             // But wait, line 86 already does json_encode for ALL arrays. 
             // So $value is already a string here.
        }

        $stmt->execute([':key' => $key, ':value' => $value]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Site settings updated successfully.']);
}

function saveBase64Image($base64Image, $fileNamePrefix) {
    $uploadDir = 'uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    list($type, $data) = explode(';', $base64Image);
    list(, $data)      = explode(',', $data);
    $data = base64_decode($data);

    $type_parts = explode('/', $type);
    $extension = $type_parts[1] ?? 'png';
    $fileName = $fileNamePrefix . '_' . time() . '.' . $extension;
    $filePath = $uploadDir . $fileName;

    file_put_contents($filePath, $data);

    // Return the public path to the file
    return '/api/' . $filePath;
}

function updateInvoiceStatus($pdo, $payload) {
    if (!isset($payload->id) || !isset($payload->status)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing invoice ID or status.']);
        return;
    }

    $sql = "UPDATE invoices SET status = :status WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':status' => $payload->status,
        ':id' => $payload->id
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Invoice status updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'No changes made or invoice not found.']);
    }
}

function updatePackage($pdo, $payload) {
    // 1. Check if 'packages' table exists, if not create it (Simple Migration)
    // Note: In a real app, use migration scripts.
    $checkTable = $pdo->query("SHOW TABLES LIKE 'packages'");
    if ($checkTable->rowCount() == 0) {
        $pdo->exec("CREATE TABLE packages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            disk_space_gb INT NOT NULL,
            inodes_limit INT NOT NULL,
            monthly_price_idr DECIMAL(10,2) NOT NULL,
            features TEXT, -- JSON Array
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        
        // Seed initial data if empty
        $pdo->exec("INSERT INTO packages (id, name, disk_space_gb, inodes_limit, monthly_price_idr, features) VALUES 
        (1, 'Starter', 1, 50000, 25000, '[\"1 GB NVMe SSD\", \"10 GB Bandwidth\"]'),
        (2, 'Personal', 5, 150000, 75000, '[\"5 GB NVMe SSD\", \"50 GB Bandwidth\"]'),
        (3, 'Business', 10, 300000, 150000, '[\"10 GB NVMe SSD\", \"Unmetered Bandwidth\"]'),
        (4, 'Enterprise', 50, 1000000, 500000, '[\"50 GB NVMe SSD\", \"Priority Support\"]')");
    }

    if (!isset($payload->id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing package ID.']);
        return;
    }

    $sql = "UPDATE packages SET 
                name = :name,
                disk_space_gb = :disk_space_gb,
                inodes_limit = :inodes_limit,
                monthly_price_idr = :monthly_price_idr,
                features = :features
            WHERE id = :id";
            
    $stmt = $pdo->prepare($sql);
    $featuresJson = isset($payload->features) ? json_encode($payload->features) : '[]';
    
    $stmt->execute([
        ':name' => $payload->name,
        ':disk_space_gb' => $payload->disk_space_gb,
        ':inodes_limit' => $payload->inodes_limit,
        ':monthly_price_idr' => $payload->monthly_price_idr,
        ':features' => $featuresJson,
        ':id' => $payload->id
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Package updated successfully.']);
    } else {
        // If values are same, rowCount is 0, but it's not strictly an error.
        echo json_encode(['success' => true, 'message' => 'Package updated (or no changes needed).']);
    }
}

function updateRegistration($pdo, $payload) {
    if (!isset($payload->id) || !isset($payload->status)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing registration ID or status.']);
        return;
    }

    $sql = "UPDATE registrations SET status = :status WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':status' => $payload->status,
        ':id' => $payload->id
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Registration status updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'No changes made or registration not found.']);
    }
}
?>
