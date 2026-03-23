-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT IGNORE INTO roles (name, description) VALUES 
('Admin', 'Acceso total al sistema'),
('Manager', 'Aprobación de gastos y gestión de equipos'),
('Empleado', 'Registro de gastos y solicitud de anticipos'),
('Cajero', 'Gestión de caja y arqueos');

-- Add role_id to users
ALTER TABLE users ADD COLUMN role_id INT DEFAULT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Migrate existing roles (mapping string to ID)
UPDATE users u JOIN roles r ON u.role = 'Admin' AND r.name = 'Admin' SET u.role_id = r.id;
UPDATE users u JOIN roles r ON u.role = 'Manager' AND r.name = 'Manager' SET u.role_id = r.id;
UPDATE users u JOIN roles r ON u.role = 'Employee' AND r.name = 'Empleado' SET u.role_id = r.id;
UPDATE users u JOIN roles r ON u.role = 'Empleado' AND r.name = 'Empleado' SET u.role_id = r.id;

-- Fallback for any unmapped
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Empleado') WHERE role_id IS NULL;

-- Drop old role column (Safe to keep for backup, but user wants clean transition. Let's rename to role_old for safety)
ALTER TABLE users CHANGE COLUMN role role_old ENUM('Admin', 'Manager', 'Employee', 'Cajero', 'Empleado') DEFAULT 'Employee';
