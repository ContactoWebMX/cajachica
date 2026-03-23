CREATE TABLE IF NOT EXISTS reconciliations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reconciliation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_system DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_physical DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    difference DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('Pending', 'Closed', 'Discrepancy') DEFAULT 'Pending',
    notes TEXT,
    denominations JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
