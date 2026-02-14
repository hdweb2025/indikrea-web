<?php
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$domain = isset($_GET["domain"]) ? trim($_GET["domain"]) : "";
if ($domain === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing domain parameter"]);
    exit;
}

function whois_server_for_domain($domain) {
    $parts = explode(".", strtolower($domain));
    $tld = end($parts);
    if ($tld === 'id') {
        // Handle .id specific: try to strip subdomains if more than 2 parts
        if (count($parts) > 2) {
             // e.g. blog.indikrea.id -> indikrea.id
             // e.g. sub.blog.indikrea.id -> indikrea.id
             // This assumes direct registration under .id. 
             // If user has co.id, or.id etc, we need different logic.
             // But whois.id usually handles SLD queries fine.
             // Let's try to query the "registered domain" level if possible.
             // For now, let's just use the domain as is, but handle errors gracefully.
        }
    }

    $map = [
        "com" => "whois.verisign-grs.com",
        "net" => "whois.verisign-grs.com",
        "org" => "whois.pir.org",
        "id" => "whois.id",
        "co" => "whois.corenic.org",
        "io" => "whois.nic.io",
        "xyz" => "whois.nic.xyz"
    ];
    return $map[$tld] ?? "whois.verisign-grs.com";
}

function whois_query($server, $domain) {
    $fp = @fsockopen($server, 43, $errno, $errstr, 10);
    if (!$fp) {
        throw new Exception("WHOIS connection failed: {$errstr} ({$errno})");
    }
    fwrite($fp, $domain . "\r\n");
    $response = "";
    while (!feof($fp)) {
        $response .= fgets($fp, 128);
    }
    fclose($fp);
    return $response;
}

function parse_expiry_date($raw) {
    $patterns = [
        "/Registry Expiry Date:\s*(.+)/i",
        "/Registrar Registration Expiration Date:\s*(.+)/i",
        "/Expiration Date:\s*(.+)/i",
        "/Expiry Date:\s*(.+)/i",
        "/paid-till:\s*(.+)/i"
    ];
    foreach ($patterns as $p) {
        if (preg_match($p, $raw, $m)) {
            return trim($m[1]);
        }
    }
    return null;
}

try {
    $server = whois_server_for_domain($domain);
    $raw = whois_query($server, $domain);
    $expiry = parse_expiry_date($raw);
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "domain" => $domain,
        "whois_server" => $server,
        "expiry" => $expiry,
        "raw" => $raw
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
