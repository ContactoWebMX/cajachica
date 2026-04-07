-- SQL Sync Script --

SET FOREIGN_KEY_CHECKS = 0;

-- Data for app_settings --
TRUNCATE TABLE app_settings;
INSERT INTO app_settings (setting_key, setting_value, description, updated_at) VALUES 
('accent_color', '#1ba1da', NULL, '2026-02-26 13:23:40'),
('APPROVAL_MIN_AMOUNT', '1000', 'Monto mínimo para requerir aprobación de Dirección', '2026-02-16 12:34:46'),
('app_name', 'Induwell Caja Chica', NULL, '2026-02-27 04:44:18'),
('button_bg_color', '#3e7ee5', NULL, '2026-02-26 23:48:34'),
('button_border_color', '#3b82f6', NULL, '2026-02-26 23:33:50'),
('button_hover_color', '#2563eb', NULL, '2026-02-26 23:33:50'),
('button_text_color', '#ffffff', NULL, '2026-02-26 23:33:50'),
('DIRECTOR_USER_IDS', '[1, 35]', NULL, '2026-02-27 05:05:10'),
('logo_url', '/uploads/logo-1774365676590-207457570.png', NULL, '2026-03-24 15:21:16'),
('primary_color', '#545454', NULL, '2026-02-26 13:24:57'),
('secondary_color', '#e87d26', NULL, '2026-02-26 13:25:52'),
('sidebar_active_color', '#f49e57', NULL, '2026-02-27 00:44:55'),
('sidebar_bg_color', '#ededed', NULL, '2026-02-26 23:47:18'),
('sidebar_hover_color', '#b0b0b0', NULL, '2026-02-27 04:44:18'),
('sidebar_text_color', '#1f1f1f', NULL, '2026-02-26 23:47:35');

-- Data for roles --
TRUNCATE TABLE roles;
INSERT INTO roles (id, name, description, active, created_at) VALUES 
(1, 'Admin', 'Acceso total al sistema', 1, '2026-02-16 05:50:53'),
(2, 'Manager', 'Aprobación de gastos y gestión de equipos', 1, '2026-02-16 05:50:53'),
(3, 'Empleado', 'Registro de gastos y solicitud de anticipos', 1, '2026-02-16 05:50:53'),
(4, 'Cajero', 'Gestión de caja y arqueos', 1, '2026-02-16 05:50:53'),
(5, 'Rol prueba', 'Prueba', 0, '2026-02-18 05:47:49'),
(6, 'Test Role API', 'Created via console', 1, '2026-02-25 18:57:59'),
(7, 'Director', 'Rol de Direccion para Aprobar los pagos', 1, '2026-02-25 19:01:33');

-- Data for users --
TRUNCATE TABLE users;
INSERT INTO users (id, name, email, password_hash, role_old, reports_to, created_at, updated_at, department_id, password, active, role_id, role) VALUES 
(1, 'Admin User', 'hgonzalez@induwell.com', 'password123', 'Admin', NULL, '2026-02-16 05:13:52', '2026-03-10 15:43:09', 1, 'password123', 1, 1, 'Admin'),
(44, 'Carlos Vega Cabanas', 'director@test.com', 'director', 'Employee', NULL, '2026-03-10 15:44:08', '2026-03-10 15:44:08', 1, NULL, 1, 7, 'Employee'),
(45, 'Brenda Santos', 'cajero@test.com', 'cajero', 'Employee', NULL, '2026-03-10 15:45:34', '2026-03-10 15:45:34', 1, NULL, 1, 4, 'Employee'),
(46, 'Ricardo Barranco', 'j1@test.com', 'j1', 'Employee', NULL, '2026-03-10 15:46:36', '2026-03-10 15:46:36', 2, NULL, 1, 2, 'Employee'),
(47, 'Hector Aviles', 'j2@test.com', 'j2', 'Employee', NULL, '2026-03-10 15:55:10', '2026-03-10 15:55:10', 3, NULL, 1, 2, 'Employee'),
(48, 'Fernanda Michel Castillo', 'e1@test.com', 'e1', 'Employee', 46, '2026-03-10 15:55:48', '2026-03-10 15:55:48', 1, NULL, 1, 3, 'Employee'),
(49, 'Lizbeth Lopez', 'e2@test.com', 'e2', 'Employee', 46, '2026-03-10 15:56:40', '2026-03-10 15:56:40', 1, NULL, 1, 3, 'Employee'),
(50, 'Luis Ldezma', 'e3@test.com', 'e3', 'Employee', 47, '2026-03-10 15:57:09', '2026-03-10 15:57:09', 3, NULL, 1, 3, 'Employee'),
(51, 'Sergio Gomez', 'e4@test.com', 'e4', 'Employee', 47, '2026-03-10 15:57:58', '2026-03-10 15:57:58', 3, NULL, 1, 3, 'Employee');

-- Data for expense_categories --
TRUNCATE TABLE expense_categories;
INSERT INTO expense_categories (id, name, description, active, created_at) VALUES 
(1, 'Viaticos', 'Viaticos', 1, '2026-03-10 15:40:27'),
(2, 'Comida', 'Comida', 1, '2026-03-10 15:40:34'),
(3, 'Uber', 'Uber', 1, '2026-03-10 15:40:40'),
(4, 'Insumos', 'Insumos', 1, '2026-03-10 15:40:57');

-- Data for cost_centers --
TRUNCATE TABLE cost_centers;
INSERT INTO cost_centers (id, code, name, active, created_at) VALUES 
(1, '70000', 'Compras', 1, '2026-03-10 15:41:14'),
(2, '80000', 'Logistica', 1, '2026-03-10 15:41:21'),
(3, '90000', 'Finanzas', 1, '2026-03-10 15:41:30');

-- Data for projects --
TRUNCATE TABLE projects;
INSERT INTO projects (id, name, description, created_at, active) VALUES 
(1, 'Proyecto 1', 'Proyecto 1', '2026-03-10 15:42:40', 1),
(2, 'Proyecto 2', 'Proyecto 2', '2026-03-10 15:42:48', 1),
(3, 'Proyecto 3', 'Proyecto 3', '2026-03-10 15:42:57', 1);

-- Data for companies --
TRUNCATE TABLE companies;
INSERT INTO companies (id, name, rfc, description, active, created_at) VALUES 
(1, 'ALPHALAB', 'ALPHA', 'ALPHALAB', 1, '2026-03-10 15:00:33'),
(2, 'VELALUZ', 'VELA', 'VELALUZ', 1, '2026-03-10 15:33:04'),
(3, 'INDW', 'INDW', 'INDW', 1, '2026-03-10 15:33:13'),
(4, 'ASI', 'ASI', 'ASI', 1, '2026-03-10 15:33:23');

-- Data for departments --
TRUNCATE TABLE departments;
INSERT INTO departments (id, name, cost_center_id, active) VALUES 
(1, 'Finanzas', 3, 1),
(2, 'Compras', 1, 1),
(3, 'Logistica', 2, 1);

SET FOREIGN_KEY_CHECKS = 1;
