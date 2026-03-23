-- Migration: Admin Features (Notifications, Settings, Push)

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'EXPENSE_CREATED', 'ADVANCE_APPROVED'
    channel ENUM('EMAIL', 'PUSH', 'BOTH') NOT NULL DEFAULT 'EMAIL',
    subject_template VARCHAR(255),
    body_template TEXT, -- Rich text / HTML
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- System Settings (Key-Value Store for SMTP, etc.)
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Push Subscriptions (Web Push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh VARCHAR(255) NOT NULL,
    auth VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed Default Templates
INSERT IGNORE INTO notification_templates (event_name, subject_template, body_template) VALUES 
('EXPENSE_CREATED', 'Nuevo Gasto: {{folio}}', 'El usuario {{user}} ha registrado un gasto de ${{amount}}.'),
('ADVANCE_APPROVED', 'Anticipo Aprobado', 'Tu anticipo de ${{amount}} ha sido aprobado.'),
('LOW_FUNDS_ALERT', 'Alerta: Fondos Bajos', 'El fondo de caja chica está por debajo del límite.'),
('EXPENSE_REJECTED', 'Gasto Rechazado: {{folio}}', 'Gasto rechazado por: {{reason}}');

-- Seed Default Settings Keys (Empty values)
INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES 
('smtp_host', ''),
('smtp_port', '587'),
('smtp_user', ''),
('smtp_pass', ''), -- Encrypted later
('smtp_secure', 'false');
