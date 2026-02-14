<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);

// HARDCODED DATABASE CONFIG - AGAR TIDAK TERGANTUNG FILE LAIN
$host = "localhost";
$dbname = "u573188607_hosting";
$user_db = "u573188607_hosting"; // Sesuaikan dengan user hosting
$pass_db = "ObB2^5rW"; // Sesuaikan dengan password hosting

echo "<h1>Reset Password Tool</h1>";

try {
    // 1. KONEKSI
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user_db, $pass_db);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Koneksi Database Berhasil.<br>";

    // 2. USER YANG AKAN DIRESET
    $username_target = "superadmin";
    $password_baru = "admin123";

    // 3. CEK USER
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username_target]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // 4. RESET PASSWORD
        $hash = password_hash($password_baru, PASSWORD_BCRYPT);
        $update = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $update->execute([$hash, $user["id"]]);
        
        echo "<h2 style=\"color:green\">BERHASIL!</h2>";
        echo "Password user <strong>$username_target</strong> telah diubah menjadi: <strong>$password_baru</strong>";
    } else {
        echo "<h2 style=\"color:red\">GAGAL!</h2>";
        echo "User <strong>$username_target</strong> tidak ditemukan di database.<br>";
        
        // Tampilkan semua user yang ada untuk debug
        echo "User yang tersedia:<br><ul>";
        $all = $pdo->query("SELECT username FROM users");
        while($row = $all->fetch(PDO::FETCH_ASSOC)) {
            echo "<li>" . htmlspecialchars($row["username"]) . "</li>";
        }
        echo "</ul>";
    }

} catch (PDOException $e) {
    echo "<h2 style=\"color:red\">ERROR DATABASE</h2>";
    echo "Pesan: " . $e->getMessage();
} catch (Exception $e) {
    echo "<h2 style=\"color:red\">ERROR LAIN</h2>";
    echo "Pesan: " . $e->getMessage();
}
?>
