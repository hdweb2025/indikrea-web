SELECT COUNT(*) AS clients_count FROM clients;
SELECT COUNT(*) AS websites_count FROM websites;
SELECT COUNT(*) AS invoices_count FROM invoices;
SELECT setting_key, LEFT(setting_value, 64) AS preview FROM site_settings ORDER BY setting_key;
SELECT id, domain_name, inodes, expiry_date FROM websites ORDER BY inodes DESC LIMIT 10;

CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  disk_space_gb INT NOT NULL,
  inodes_limit INT NOT NULL,
  monthly_price_idr INT NOT NULL,
  features TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO packages (name, disk_space_gb, inodes_limit, monthly_price_idr, features) VALUES
('Starter', 1, 50000, 25000, JSON_ARRAY('1 GB NVMe SSD','10 GB Bandwidth','5 Email Accounts','Free SSL')),
('Personal', 5, 150000, 75000, JSON_ARRAY('5 GB NVMe SSD','50 GB Bandwidth','20 Email Accounts','Free SSL & CDN')),
('Business', 10, 300000, 150000, JSON_ARRAY('10 GB NVMe SSD','Unmetered Bandwidth','Unlimited Emails','Daily Backups')),
('Enterprise', 50, 1000000, 500000, JSON_ARRAY('50 GB NVMe SSD','Priority Support','Staging Site','Premium Security'))
ON DUPLICATE KEY UPDATE
name=VALUES(name),
disk_space_gb=VALUES(disk_space_gb),
inodes_limit=VALUES(inodes_limit),
monthly_price_idr=VALUES(monthly_price_idr),
features=VALUES(features);

SELECT name, monthly_price_idr, disk_space_gb FROM packages ORDER BY monthly_price_idr ASC;
SELECT role, COUNT(*) AS users_by_role FROM users GROUP BY role;
SELECT status, COUNT(*) AS invoices_by_status FROM invoices GROUP BY status;
SELECT invoice_number, total_amount, status FROM invoices ORDER BY created_at DESC LIMIT 10;
SELECT domain_name, wp_url FROM websites WHERE wp_url IS NOT NULL LIMIT 10;
SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('siteName','companyName','companyEmail');
EXPLAIN SELECT * FROM invoices WHERE client_id = 1;
SELECT i.invoice_number, c.name AS client, w.domain_name, i.total_amount, i.status
FROM invoices i
JOIN clients c ON i.client_id = c.id
JOIN websites w ON i.website_id = w.id
ORDER BY i.created_at DESC
LIMIT 10;
