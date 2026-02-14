<?php
require_once "db.php";

// SECURITY CHECK: This file should NOT be accessible publicly without protection in production
// For now, we'll allow it but add a warning or maybe a simple token check?
// Better yet, just comment out the whole execution block after initial setup.
// OR, check if user is admin (requires session/token logic which might be complex here)

// SIMPLE PROTECTION: Only allow if explicitly confirmed via query param ?confirm=yes
if (!isset($_GET['confirm']) || $_GET['confirm'] !== 'yes') {
    die("Setup script locked. To run, append ?confirm=yes to the URL. WARNING: This will RESET invoice data.");
}

try {
    $pdo = getDbConnection(); // Use the function from db.php

    // 1. Create Table
    // Use LONGTEXT for payment_proof_url to allow base64 images
    $sql = "CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        client_id INT NOT NULL,
        website_id INT NOT NULL,
        hosting_amount DECIMAL(10, 2) NOT NULL,
        domain_amount DECIMAL(10, 2) NOT NULL,
        tax_amount DECIMAL(10, 2) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        due_date DATE NOT NULL,
        status ENUM('Paid', 'Unpaid', 'Pending') DEFAULT 'Unpaid',
        payment_proof_url LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql);
    echo "Table 'invoices' created or already exists.<br>";

    // 2. Clear existing invoices (to allow reseeding with correct logic)
    $pdo->exec("TRUNCATE TABLE invoices");
    echo "Invoices table cleared.<br>";

    // 3. Seed from websites
    echo "Seeding invoices from websites...<br>";
    
    $sitesStmt = $pdo->query("SELECT * FROM websites");
    $websites = $sitesStmt->fetchAll(PDO::FETCH_ASSOC); // Ensure assoc fetch
    
    $DOMAIN_YEARLY_PRICE_IDR = 150000;
    $TAX_RATE = 0.11;
    
    // Pricing logic (simplified from get_data.php)
    $packages = [
        1 => 25000, 2 => 75000, 3 => 150000, 4 => 500000
    ];

    $stmtInsert = $pdo->prepare("INSERT INTO invoices (invoice_number, client_id, website_id, hosting_amount, domain_amount, tax_amount, total_amount, due_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");

    foreach ($websites as $index => $site) {
        // --- LOGIC FILTER ---
        $parentId = isset($site["parentId"]) ? $site["parentId"] : null;
        // Treat 0 as null
        if ($parentId === 0) $parentId = null;
        // Treat string "0" or "NULL" as null just in case
        if ($parentId === "0" || $parentId === "NULL") $parentId = null;

        $domainName = strtolower($site["domain_name"]);
        
        // Skip subdomains (where parentId is NOT null)
        // EXCEPTION: rapor.mawikebarongan.com is treated as a main domain (has its own package)
        if (!empty($parentId) && $domainName !== 'rapor.mawikebarongan.com') {
            echo "Skipping invoice for subdomain: $domainName (Parent ID: $parentId)<br>";
            continue;
        }
        // --------------------

         // Calculate package
            $disk_parts = explode(" ", $site["disk_usage"]);
            $disk_val = (float)$disk_parts[0];
            $disk_unit = $disk_parts[1] ?? "MiB";
            $disk_usage_mb = ($disk_unit === "GiB") ? $disk_val * 1024 : (($disk_unit === "KiB") ? $disk_val / 1024 : $disk_val);
            
            $package_id = 1;
            if ($disk_usage_mb > 10 * 1024) $package_id = 4;
            else if ($disk_usage_mb >= 5 * 1024) $package_id = 3;
            else if ($disk_usage_mb >= 1 * 1024) $package_id = 2;

            $monthlyPrice = $packages[$package_id] ?? 25000;
            $hostingAmount = $monthlyPrice * 12;
            $domainAmount = $DOMAIN_YEARLY_PRICE_IDR;
            $subtotal = $hostingAmount + $domainAmount;
            $taxAmount = $subtotal * $TAX_RATE;
            $totalAmount = $subtotal + $taxAmount;

            $dueDateRaw = $site["expiry_date"];
            if (!$dueDateRaw || $dueDateRaw == '0000-00-00') {
                $dueDateRaw = date('Y-m-d', strtotime('+1 year')); // Fallback
            }
            $dueDate = date("Y-m-d", strtotime($dueDateRaw . " -30 days"));
            
            $invDate = new DateTime($dueDate);
            $month = $invDate->format("m");
            $year = $invDate->format("Y");
            $sequence = str_pad($index + 1, 4, "0", STR_PAD_LEFT);
            $invoiceNumber = "INV-IH/{$month}/{$year}/{$sequence}";
            
            // Random status for initial seed
            $status = (rand(1, 10) > 3) ? "Paid" : "Unpaid";

            $stmtInsert->execute([
                $invoiceNumber,
                $site['client_id'],
                $site['id'],
                $hostingAmount,
                $domainAmount,
                $taxAmount,
                $totalAmount,
                $dueDate,
                $status
            ]);
            echo "Created invoice $invoiceNumber for {$site['domain_name']}<br>";
    } // End foreach
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
