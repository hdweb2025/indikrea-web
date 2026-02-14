<?php
// domain_check.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['domain']) || !isset($input['tlds'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing domain or tlds']);
    exit;
}

$domainName = $input['domain'];
$tlds = $input['tlds']; // Expecting array e.g. ['com', 'id']

// Tarif Indikrea (dalam IDR)
$pricing = [
    'com' => 250000,
    'net' => 300000,
    'id' => 300000,
    'co.id' => 300000, // Asumsi sama dengan .id jika tidak spesifik
    'web.id' => 300000, // Asumsi sama
    'my.id' => 300000, // Asumsi sama
    'co' => 600000,
    'io' => 1150000,
    'asia' => 225000,
    'xyz' => 30000 // Default fallback dari kode frontend sebelumnya
];

// Helper function untuk mendapatkan WHOIS server
function get_whois_server($tld) {
    $servers = [
        "com" => "whois.verisign-grs.com",
        "net" => "whois.verisign-grs.com",
        "org" => "whois.pir.org",
        "id" => "whois.id",
        "co.id" => "whois.id",
        "web.id" => "whois.id",
        "my.id" => "whois.id",
        "co" => "whois.corenic.org",
        "io" => "whois.nic.io",
        "asia" => "whois.nic.asia",
        "xyz" => "whois.nic.xyz"
    ];
    return $servers[$tld] ?? "whois.verisign-grs.com";
}

// Helper function untuk cek ketersediaan via WHOIS
function check_availability_via_whois($domain, $tld) {
    $server = get_whois_server($tld);
    $fullDomain = $domain . '.' . $tld;
    
    $fp = @fsockopen($server, 43, $errno, $errstr, 10);
    if (!$fp) {
        return ['status' => 'error', 'message' => "Connection failed to $server"];
    }
    
    fwrite($fp, $fullDomain . "\r\n");
    $response = "";
    while (!feof($fp)) {
        $response .= fgets($fp, 128);
    }
    fclose($fp);

    // Analisa response WHOIS untuk menentukan ketersediaan
    // Pola umum: "No match", "NOT FOUND", "is available" menandakan domain tersedia
    $availablePatterns = [
        "No match for", 
        "NOT FOUND", 
        "is available", 
        "No Data Found", 
        "has not been registered",
        "DOMAIN NOT FOUND"
    ];

    foreach ($availablePatterns as $pattern) {
        if (stripos($response, $pattern) !== false) {
            return ['status' => 'available'];
        }
    }

    return ['status' => 'taken'];
}

$results = [];

foreach ($tlds as $tld) {
    $check = check_availability_via_whois($domainName, $tld);
    
    if ($check['status'] === 'available') {
        $price = $pricing[$tld] ?? 0;
        // Format respons agar mirip dengan struktur Hostinger API yang diharapkan frontend
        // atau kita sesuaikan frontend untuk menerima format ini.
        // Frontend saat ini mengharapkan: result.data.data[0].status === 'available'
        $results[] = [
            'domain' => $domainName . '.' . $tld,
            'status' => 'available',
            'price' => $price,
            'currency' => 'IDR'
        ];
    } else if ($check['status'] === 'taken') {
        $results[] = [
            'domain' => $domainName . '.' . $tld,
            'status' => 'taken'
        ];
    } else {
         $results[] = [
            'domain' => $domainName . '.' . $tld,
            'status' => 'error',
            'message' => $check['message'] ?? 'Unknown error'
        ];
    }
}

// Kembalikan respons sukses dengan data hasil pengecekan manual
echo json_encode([
    'success' => true, 
    'data' => [
        'data' => $results
    ]
]);

?>
