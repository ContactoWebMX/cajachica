-- Migration: Financial Control (Reconciliations)

CREATE TABLE IF NOT EXISTS reconciliations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_system DECIMAL(10, 2) NOT NULL, -- Calculated theoretical balance
    total_physical DECIMAL(10, 2) NOT NULL, -- User input count
    difference DECIMAL(10, 2) NOT NULL,   -- physical - system
    denominations JSON, -- Store bill/coin counts: {"500": 3, "200": 1, ...}
    status ENUM('Pendiente', 'Cerrado', 'Auditado') DEFAULT 'Pendiente',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
