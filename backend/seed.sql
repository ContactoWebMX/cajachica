-- Seed Initial Users
INSERT INTO users (name, email, password_hash, role) VALUES 
('Carlos Finanzas', 'carlos@induwell.com', 'hash_placeholder', 'Admin'),
('Empleado Demo', 'empleado@induwell.com', 'hash_placeholder', 'Empleado');

-- Seed Basic Custom Settings if not exists (Already in 002 but ensuring)
INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES 
('company_name', 'Induwell S.A. de C.V.');
