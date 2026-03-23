-- 007_advanced_workflows.sql

-- 1. App Settings (for configurable Approval Min Amount)
CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default setting: Min amount for Director approval (e.g., 1000)
INSERT INTO app_settings (setting_key, setting_value, description)
VALUES ('APPROVAL_MIN_AMOUNT', '1000', 'Monto mínimo para requerir aprobación de Dirección')
ON DUPLICATE KEY UPDATE setting_key=setting_key;

-- 2. Add Project Field to Advances and Expenses
-- Check if column exists first (MariaDB/MySQL doesn't support IF NOT EXISTS in ALTER TABLE easily in one line without procedure, 
-- but we can just try adding it. If it fails, it fails, but for this env we assume it's new).
-- Actually, let's use a safe approach or just run it. The `run_migrations.js` handles errors but specific SQL errors might stop it.
-- We will just execute the ALTERs.
ALTER TABLE advances ADD COLUMN IF NOT EXISTS project VARCHAR(100) DEFAULT NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS project VARCHAR(100) DEFAULT NULL;

-- 3. Cash Flow (Replenishment)
CREATE TABLE IF NOT EXISTS cash_flows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('monto_inicial', 'reembolso', 'gasto', 'anticipo', 'ingreso') NOT NULL, -- 'ingreso' for replenishment
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    user_id INT, -- Who performed the action usually Admin/Finance
    reference_id INT, -- ID of related expense/advance if applicable
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
