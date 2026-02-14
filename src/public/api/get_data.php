<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once 'db.php';
try {
    $userData = json_decode(file_get_contents("php://input"));
    $isPublicRequest = isset($userData->public) && $userData->public === true;
    if (!$isPublicRequest && (empty($userData->id) || empty($userData->role))) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required.']);
        exit;
    }
    $pdo = getDbConnection();
    $response = [];
    $isAdmin = !$isPublicRequest && in_array($userData->role, ['superadmin', 'admin', 'support']);

// --- 1. FETCH SITE SETTINGS ---
$settingsStmt = $pdo->query("SELECT * FROM site_settings");
$settingsFromDb = $settingsStmt->fetchAll(PDO::FETCH_KEY_PAIR);

$response['settings'] = [
    'general' => [
        'siteName' => $settingsFromDb['siteName'] ?? 'Indikrea',
        'heroTitle' => $settingsFromDb['heroTitle'] ?? 'Title',
        'heroSubtitle' => $settingsFromDb['heroSubtitle'] ?? 'Subtitle',
        'heroButtonText' => $settingsFromDb['heroButtonText'] ?? 'Button',
    ],
    'navigation' => [
        'headerLinks' => json_decode($settingsFromDb['headerLinks'] ?? '[]', true),
    ],
    'contact' => [
        'whatsappNumber' => $settingsFromDb['whatsappNumber'] ?? '',
        'whatsappDefaultMessage' => $settingsFromDb['whatsappDefaultMessage'] ?? '',
    ],
    'footer' => [
        'slogan' => $settingsFromDb['footerSlogan'] ?? '',
        'copyrightName' => $settingsFromDb['copyrightName'] ?? 'Indikrea',
        'linkColumns' => json_decode($settingsFromDb['footerLinks'] ?? '[]', true),
    ],
    'packagesPage' => [
        'title' => $settingsFromDb['packagesPageTitle'] ?? 'Choose The Perfect Plan',
        'subtitle' => $settingsFromDb['packagesPageSubtitle'] ?? 'Scalable plans that grow with your business.',
        'faq' => json_decode($settingsFromDb['packagesFaq'] ?? '[]', true)
    ],
    'company' => [
        'companyLogo' => $settingsFromDb['companyLogo'] ?? '/logo.svg',
    ]
];


// --- 2. FETCH HOSTING PACKAGES (DINAMIS DARI DB) ---
// Cek apakah tabel packages ada
$checkPkgTable = $pdo->query("SHOW TABLES LIKE 'packages'");
if ($checkPkgTable->rowCount() > 0) {
    $pkgStmt = $pdo->query("SELECT * FROM packages");
    $hostingPackages = $pkgStmt->fetchAll();
    // Decode features JSON
    foreach ($hostingPackages as &$pkg) {
        $pkg['features'] = json_decode($pkg['features'] ?? '[]', true);
        // Cast types for frontend consistency
        $pkg['id'] = (int)$pkg['id'];
        $pkg['disk_space_gb'] = (int)$pkg['disk_space_gb'];
        $pkg['inodes_limit'] = (int)$pkg['inodes_limit'];
        $pkg['monthly_price_idr'] = (float)$pkg['monthly_price_idr'];
    }
} else {
    // Fallback ke data statis jika tabel belum ada (akan dibuat saat update pertama)
    $hostingPackages = [
        ['id' => 1, 'name' => 'Starter', 'disk_space_gb' => 1, 'inodes_limit' => 50000, 'monthly_price_idr' => 25000, 'features' => ['1 GB NVMe SSD', '10 GB Bandwidth', '5 Email Accounts', 'Free SSL']],
        ['id' => 2, 'name' => 'Personal', 'disk_space_gb' => 5, 'inodes_limit' => 150000, 'monthly_price_idr' => 75000, 'features' => ['5 GB NVMe SSD', '50 GB Bandwidth', '20 Email Accounts', 'Free SSL & CDN']],
        ['id' => 3, 'name' => 'Business', 'disk_space_gb' => 10, 'inodes_limit' => 300000, 'monthly_price_idr' => 150000, 'features' => ['10 GB NVMe SSD', 'Unmetered Bandwidth', 'Unlimited Emails', 'Daily Backups']],
        ['id' => 4, 'name' => 'Enterprise', 'disk_space_gb' => 50, 'inodes_limit' => 1000000, 'monthly_price_idr' => 500000, 'features' => ['50 GB NVMe SSD', 'Priority Support', 'Staging Site', 'Premium Security']],
    ];
}
$response['hostingPackages'] = $hostingPackages;

if ($isPublicRequest) {
    http_response_code(200);
    echo json_encode(['success' => true, 'data' => [
        'settings' => $response['settings'],
        'hostingPackages' => $response['hostingPackages']
    ]]);
    exit;
}

// --- AUTHENTICATED-ONLY DATA BELOW ---

// --- 3. FETCH CLIENTS ---
$allClientsStmt = $pdo->query("SELECT * FROM clients");
$allClients = $allClientsStmt->fetchAll();
$response['clients'] = $isAdmin ? $allClients : array_filter($allClients, fn($c) => $c['id'] == $userData->clientId);

// --- 4. FETCH WEBSITES ---
$websitesQuery = "SELECT w.*, c.id as parentId FROM websites w LEFT JOIN websites c ON w.domain_name LIKE CONCAT('%.', c.domain_name) WHERE c.id IS NULL OR w.id != c.id";
if (!$isAdmin) {
    $websitesQuery = "SELECT * FROM websites WHERE client_id = " . (int)$userData->clientId;
}
$websitesStmt = $pdo->query($websitesQuery);
$allWebsitesFromDb = $websitesStmt->fetchAll();

// --- 5. PROSES WEBSITES ---
$processedWebsites = [];
foreach ($allWebsitesFromDb as $site) {
    $disk_parts = explode(' ', $site['disk_usage']);
    $disk_val = (float)$disk_parts[0];
    $disk_unit = $disk_parts[1] ?? 'MiB';
    $disk_usage_mb = ($disk_unit === 'GiB') ? $disk_val * 1024 : (($disk_unit === 'KiB') ? $disk_val / 1024 : $disk_val);

    $package_id = 1;
    if ($disk_usage_mb > 10 * 1024) $package_id = 4;
    else if ($disk_usage_mb >= 5 * 1024) $package_id = 3;
    else if ($disk_usage_mb >= 1 * 1024) $package_id = 2;

    $processedWebsites[] = [
        'id' => (int)$site['id'],
        'client_id' => (int)$site['client_id'],
        'domain_name' => $site['domain_name'],
        'disk_usage_mb' => round($disk_usage_mb, 2),
        'inodes' => (int)$site['inodes'],
        'expiry_date' => $site['expiry_date'],
        'wp_url' => $site['wp_url'],
        'wp_user' => $site['wp_user'],
        'wp_pass_encrypted' => $site['wp_pass'],
        'parentId' => isset($site['parentId']) ? (int)$site['parentId'] : null,
        'package_id' => $package_id,
        'last_modified' => 'N/A',
    ];
}
$response['websites'] = $processedWebsites;

// --- 6. FETCH INVOICES (Real Data from DB) ---
$invoices = [];
$invoicesQuery = "SELECT * FROM invoices";
if (!$isAdmin) {
    $invoicesQuery .= " WHERE client_id = " . (int)$userData->clientId;
}
$invoicesStmt = $pdo->query($invoicesQuery);
$allInvoices = $invoicesStmt->fetchAll();

foreach ($allInvoices as $inv) {
    // Find domain name from processed websites or raw DB query if needed
    // Optimization: create a map of website_id -> domain_name
    $domain_name = 'Unknown Domain';
    foreach ($processedWebsites as $w) {
        if ($w['id'] == $inv['website_id']) {
            $domain_name = $w['domain_name'];
            break;
        }
    }

    $invoices[] = [
        'id' => (int)$inv['id'],
        'invoice_number' => $inv['invoice_number'],
        'website_id' => (int)$inv['website_id'],
        'client_id' => (int)$inv['client_id'],
        'domain_name' => $domain_name,
        'hosting_amount' => (float)$inv['hosting_amount'],
        'domain_amount' => (float)$inv['domain_amount'],
        'tax_amount' => (float)$inv['tax_amount'],
        'total_amount' => (float)$inv['total_amount'],
        'due_date' => $inv['due_date'],
        'status' => $inv['status'],
        'payment_proof_url' => $inv['payment_proof_url']
    ];
}
$response['invoices'] = $invoices;

// --- 7. REGISTRATIONS (Real Data from DB) ---
// Cek tabel registrations, jika belum ada buat (self-migration)
$checkRegTable = $pdo->query("SHOW TABLES LIKE 'registrations'");

// FIX: Variable name typo checkPkgTable -> checkRegTable
if ($checkRegTable->rowCount() == 0) {
    $pdo->exec("CREATE TABLE registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullName VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        desiredDomain VARCHAR(255) NOT NULL,
        packageId INT NOT NULL,
        registrationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        status ENUM('Pending Review', 'Contacted', 'Approved', 'Rejected') DEFAULT 'Pending Review'
    )");
    
    // Seed initial data
    $pdo->exec("INSERT INTO registrations (fullName, email, desiredDomain, packageId, registrationDate, status) VALUES 
    ('Budi Darmawan', 'budi.darmawan@example.com', 'budicorp.com', 3, '2024-07-20 10:00:00', 'Pending Review'),
    ('Citra Kirana', 'citra.kirana@example.com', 'citraphotography.id', 2, '2024-07-19 15:30:00', 'Contacted')");
}

$regStmt = $pdo->query("SELECT * FROM registrations ORDER BY registrationDate DESC");
$registrations = $regStmt->fetchAll();
// Format data
$formattedRegistrations = [];
foreach ($registrations as $reg) {
    $formattedRegistrations[] = [
        'id' => (int)$reg['id'],
        'fullName' => $reg['fullName'],
        'email' => $reg['email'],
        'desiredDomain' => $reg['desiredDomain'],
        'packageId' => (int)$reg['packageId'],
        'registrationDate' => $reg['registrationDate'], // Keep original format or convert to ISO 8601
        'status' => $reg['status']
    ];
}
    $response['registrations'] = $formattedRegistrations;
    http_response_code(200);
    echo json_encode(['success' => true, 'data' => $response]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
}
?>
