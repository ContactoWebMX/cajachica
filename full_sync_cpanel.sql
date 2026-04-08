-- FULL CPANEL SYNC SCRIPT (DYNAMIC) --
-- Generado para sincronizar TODA la información actual de la base de datos local --

SET FOREIGN_KEY_CHECKS = 0;

-- TABLE: advances --
DROP TABLE IF EXISTS advances;
CREATE TABLE `advances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('Adelanto','Reembolso','Devolucion') DEFAULT 'Adelanto',
  `amount_requested` decimal(10,2) NOT NULL,
  `amount_approved` decimal(10,2) DEFAULT 0.00,
  `status` enum('Pendiente','Aprobado Jefe','Aprobado Director','Pagado','Rechazado','Comprobado') DEFAULT NULL,
  `request_date` timestamp NULL DEFAULT current_timestamp(),
  `action_date` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `project` varchar(100) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `approver_name` varchar(100) DEFAULT NULL,
  `project_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `cost_center_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_advances_project` (`project_id`),
  KEY `fk_advances_category` (`category_id`),
  KEY `fk_advances_cc` (`cost_center_id`),
  KEY `fk_advances_dept` (`department_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `advances_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `advances_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  CONSTRAINT `fk_advances_category` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_advances_cc` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_advances_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_advances_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE advances;
INSERT INTO advances (id, user_id, type, amount_requested, amount_approved, status, request_date, action_date, notes, project, rejection_reason, approver_name, project_id, category_id, cost_center_id, department_id, company_id) VALUES 
(1, 49, 'Adelanto', '500.00', '500.00', 'Pagado', '2026-03-13 04:00:58', '2026-03-13 04:08:04', 'Aprobado/Pagado desde Dashboard', NULL, NULL, 'Carlos Vega Cabanas', 2, 4, 3, 1, 4),
(2, 50, 'Adelanto', '500.00', '500.00', 'Pagado', '2026-04-07 19:41:06', '2026-04-07 19:47:08', 'Aprobado/Pagado desde Dashboard', NULL, NULL, 'Carlos Vega Cabanas', 1, 1, 2, 3, 2);

-- TABLE: app_settings --
DROP TABLE IF EXISTS app_settings;
CREATE TABLE `app_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
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
('logo_url', '/uploads/logo-1775573367647-218753969.png', NULL, '2026-04-07 14:49:27'),
('primary_color', '#545454', NULL, '2026-02-26 13:24:57'),
('secondary_color', '#e87d26', NULL, '2026-02-26 13:25:52'),
('sidebar_active_color', '#f49e57', NULL, '2026-02-27 00:44:55'),
('sidebar_bg_color', '#ededed', NULL, '2026-02-26 23:47:18'),
('sidebar_hover_color', '#b0b0b0', NULL, '2026-02-27 04:44:18'),
('sidebar_text_color', '#1f1f1f', NULL, '2026-02-26 23:47:35');

-- TABLE: cash_flows --
DROP TABLE IF EXISTS cash_flows;
CREATE TABLE `cash_flows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('monto_inicial','reembolso','gasto','anticipo','ingreso') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `date` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `cash_flows_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE cash_flows;
INSERT INTO cash_flows (id, type, amount, description, user_id, reference_id, date) VALUES 
(1, 'ingreso', '10000.00', 'Ingreso de prueba', 45, NULL, '2026-03-13 03:54:43'),
(2, 'ingreso', '1000.00', 'Prueba', 1, NULL, '2026-04-07 19:39:31');

-- TABLE: companies --
DROP TABLE IF EXISTS companies;
CREATE TABLE `companies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `rfc` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE companies;
INSERT INTO companies (id, name, rfc, description, active, created_at) VALUES 
(1, 'ALPHALAB', 'ALPHA', 'ALPHALAB', 1, '2026-03-10 15:00:33'),
(2, 'VELALUZ', 'VELA', 'VELALUZ', 1, '2026-03-10 15:33:04'),
(3, 'INDW', 'INDW', 'INDW', 1, '2026-03-10 15:33:13'),
(4, 'ASI', 'ASI', 'ASI', 1, '2026-03-10 15:33:23');

-- TABLE: cost_centers --
DROP TABLE IF EXISTS cost_centers;
CREATE TABLE `cost_centers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE cost_centers;
INSERT INTO cost_centers (id, code, name, active, created_at) VALUES 
(1, '70000', 'Compras', 1, '2026-03-10 15:41:14'),
(2, '80000', 'Logistica', 1, '2026-03-10 15:41:21'),
(3, '90000', 'Finanzas', 1, '2026-03-10 15:41:30');

-- TABLE: custom_fields --
DROP TABLE IF EXISTS custom_fields;
CREATE TABLE `custom_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `label` varchar(255) NOT NULL,
  `type` enum('text','number','date','boolean','select') NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `required` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
-- No data found in custom_fields.

-- TABLE: departments --
DROP TABLE IF EXISTS departments;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `cost_center_id` int(11) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `cost_center_id` (`cost_center_id`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE departments;
INSERT INTO departments (id, name, cost_center_id, active) VALUES 
(1, 'Finanzas', 3, 1),
(2, 'Compras', 1, 1),
(3, 'Logistica', 2, 1);

-- TABLE: expense_categories --
DROP TABLE IF EXISTS expense_categories;
CREATE TABLE `expense_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE expense_categories;
INSERT INTO expense_categories (id, name, description, active, created_at) VALUES 
(1, 'Viaticos', 'Viaticos', 1, '2026-03-10 15:40:27'),
(2, 'Comida', 'Comida', 1, '2026-03-10 15:40:34'),
(3, 'Uber', 'Uber', 1, '2026-03-10 15:40:40'),
(4, 'Insumos', 'Insumos', 1, '2026-03-10 15:40:57');

-- TABLE: expenses --
DROP TABLE IF EXISTS expenses;
CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `amount_approved` decimal(10,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `date` date NOT NULL,
  `status` enum('Borrador','Pendiente','Aprobado Jefe','Aprobado Director','Pagado','Rechazado') DEFAULT NULL,
  `custom_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_data`)),
  `file_path` varchar(255) DEFAULT NULL,
  `file_hash` varchar(64) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `advance_id` int(11) DEFAULT NULL,
  `rfc` varchar(20) DEFAULT NULL,
  `folio` varchar(50) DEFAULT NULL,
  `geo_lat` decimal(10,8) DEFAULT NULL,
  `geo_long` decimal(11,8) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `cost_center_id` int(11) DEFAULT NULL,
  `project` varchar(100) DEFAULT NULL,
  `approver_name` varchar(100) DEFAULT NULL,
  `project_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `approved_by` (`approved_by`),
  KEY `advance_id` (`advance_id`),
  KEY `category_id` (`category_id`),
  KEY `cost_center_id` (`cost_center_id`),
  KEY `fk_expenses_project` (`project_id`),
  KEY `company_id` (`company_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`advance_id`) REFERENCES `advances` (`id`),
  CONSTRAINT `expenses_ibfk_4` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `expenses_ibfk_5` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `expenses_ibfk_6` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  CONSTRAINT `expenses_ibfk_7` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `fk_expenses_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE expenses;
INSERT INTO expenses (id, user_id, amount, amount_approved, description, date, status, custom_data, file_path, file_hash, rejection_reason, approved_by, created_at, updated_at, advance_id, rfc, folio, geo_lat, geo_long, category_id, cost_center_id, project, approver_name, project_id, company_id, department_id) VALUES 
(1, 48, '500.00', '500.00', 'Comida para 4 personas en el inventario', '2026-03-13 06:00:00', 'Pagado', '{}', 'uploads/expenses/1773373490696-805424097.png', NULL, NULL, 45, '2026-03-13 03:44:50', '2026-03-13 03:58:18', NULL, 'RFC102938', '10293', '19.26103040', '-99.46726400', 2, 1, NULL, 'Carlos Vega Cabanas', 1, 1, 2),
(2, 49, '300.00', '300.00', 'Gasto por comprobar', '2026-03-13 06:00:00', 'Pagado', '{}', 'uploads/expenses/1773375086655-992976030.png', NULL, NULL, 45, '2026-03-13 04:11:26', '2026-03-13 04:20:19', NULL, 'RFC09990', 'A1234', '19.26103040', '-99.46726400', 4, 3, NULL, 'Carlos Vega Cabanas', 2, 4, 1),
(3, 49, '300.00', '300.00', 'Gasto comprobado', '2026-03-13 06:00:00', 'Pagado', '{}', 'uploads/expenses/1773375741938-510597908.png', NULL, NULL, 45, '2026-03-13 04:22:21', '2026-03-13 04:35:06', 1, 'ASIQ87889', 'AS0991', '19.26103040', '-99.46726400', 3, 2, NULL, 'Carlos Vega Cabanas', 3, 3, 3),
(4, 49, '200.00', '200.00', 'gasto comprobado', '2026-03-13 06:00:00', 'Pagado', '{}', 'uploads/expenses/1773376724509-471794250.png', NULL, NULL, 45, '2026-03-13 04:38:44', '2026-03-13 04:40:29', 1, 'RFCD87677DS8', 'A18273', '19.26103040', '-99.46726400', 1, 2, NULL, 'Carlos Vega Cabanas', 3, 3, 1),
(5, 50, '500.00', '500.00', 'GASTOS DE VIATICOS', '2026-04-07 06:00:00', 'Pagado', '{}', 'uploads/expenses/1775591686112-653048898.png', NULL, NULL, 45, '2026-04-07 19:54:46', '2026-04-07 19:59:53', 2, NULL, NULL, '19.27147000', '-99.47342100', 1, 2, NULL, 'Carlos Vega Cabanas', 1, 2, 3);

-- TABLE: notification_templates --
DROP TABLE IF EXISTS notification_templates;
CREATE TABLE `notification_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_name` varchar(50) NOT NULL,
  `channel` enum('EMAIL','PUSH','BOTH') NOT NULL DEFAULT 'EMAIL',
  `subject_template` varchar(255) DEFAULT NULL,
  `body_template` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_name` (`event_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
-- No data found in notification_templates.

-- TABLE: projects --
DROP TABLE IF EXISTS projects;
CREATE TABLE `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE projects;
INSERT INTO projects (id, name, description, created_at, active) VALUES 
(1, 'Proyecto 1', 'Proyecto 1', '2026-03-10 15:42:40', 1),
(2, 'Proyecto 2', 'Proyecto 2', '2026-03-10 15:42:48', 1),
(3, 'Proyecto 3', 'Proyecto 3', '2026-03-10 15:42:57', 1);

-- TABLE: push_subscriptions --
DROP TABLE IF EXISTS push_subscriptions;
CREATE TABLE `push_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `endpoint` text NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `push_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
-- No data found in push_subscriptions.

-- TABLE: reconciliations --
DROP TABLE IF EXISTS reconciliations;
CREATE TABLE `reconciliations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` datetime DEFAULT current_timestamp(),
  `total_system` decimal(10,2) NOT NULL,
  `total_physical` decimal(10,2) NOT NULL,
  `difference` decimal(10,2) NOT NULL,
  `denominations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`denominations`)),
  `status` enum('Pendiente','Cerrado','Auditado') DEFAULT 'Pendiente',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `reconciliations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE reconciliations;
INSERT INTO reconciliations (id, user_id, date, total_system, total_physical, difference, denominations, status, notes, created_at) VALUES 
(1, 1, '2026-04-07 19:38:09', '8700.00', '8700.00', '0.00', '{"20":0,"50":0,"100":1,"200":3,"500":16,"coins":0}', 'Cerrado', 'revision con Brenda', '2026-04-07 19:38:09');

-- TABLE: roles --
DROP TABLE IF EXISTS roles;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE roles;
INSERT INTO roles (id, name, description, active, created_at) VALUES 
(1, 'Admin', 'Acceso total al sistema', 1, '2026-02-16 05:50:53'),
(2, 'Manager', 'Aprobación de gastos y gestión de equipos', 1, '2026-02-16 05:50:53'),
(3, 'Empleado', 'Registro de gastos y solicitud de anticipos', 1, '2026-02-16 05:50:53'),
(4, 'Cajero', 'Gestión de caja y arqueos', 1, '2026-02-16 05:50:53'),
(5, 'Rol prueba', 'Prueba', 0, '2026-02-18 05:47:49'),
(6, 'Test Role API', 'Created via console', 1, '2026-02-25 18:57:59'),
(7, 'Director', 'Rol de Direccion para Aprobar los pagos', 1, '2026-02-25 19:01:33');

-- TABLE: system_logs --
DROP TABLE IF EXISTS system_logs;
CREATE TABLE `system_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entity` varchar(255) NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `old_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_value`)),
  `new_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_value`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `system_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE system_logs;
INSERT INTO system_logs (id, user_id, action, entity, entity_id, old_value, new_value, ip_address, user_agent, created_at) VALUES 
(1, 48, 'CREATE', 'Expense', 1, NULL, '{"user_id":"48","amount":"500","description":"Comida para 4 personas en el inventario","date":"2026-03-13","rfc":"RFC102938","folio":"10293","category_id":"2","cost_center_id":"1","project_id":"1","company_id":"1","department_id":"2","geo_lat":"19.2610304","geo_long":"-99.467264"}', NULL, NULL, '2026-03-13 03:44:50'),
(2, 49, 'CREATE', 'Expense', 2, NULL, '{"user_id":"49","amount":"300","description":"Gasto por comprobar","date":"2026-03-13","rfc":"RFC09990","folio":"A1234","category_id":"4","cost_center_id":"3","project_id":"2","company_id":"4","department_id":"1","geo_lat":"19.2610304","geo_long":"-99.467264"}', NULL, NULL, '2026-03-13 04:11:26'),
(3, 49, 'CREATE', 'Expense', 3, NULL, '{"user_id":"49","amount":"300","description":"Gasto comprobado","date":"2026-03-13","rfc":"ASIQ87889","folio":"AS0991","category_id":"3","cost_center_id":"2","advance_id":"1","project_id":"3","company_id":"3","department_id":"3","geo_lat":"19.2610304","geo_long":"-99.467264"}', NULL, NULL, '2026-03-13 04:22:21'),
(4, 49, 'CREATE', 'Expense', 4, NULL, '{"user_id":"49","amount":"200","description":"gasto comprobado","date":"2026-03-13","rfc":"RFCD87677DS8","folio":"A18273","category_id":"1","cost_center_id":"2","advance_id":"1","project_id":"3","company_id":"3","department_id":"1","geo_lat":"19.2610304","geo_long":"-99.467264"}', NULL, NULL, '2026-03-13 04:38:44'),
(5, 50, 'CREATE', 'Expense', 5, NULL, '{"user_id":"50","amount":"500","description":"GASTOS DE VIATICOS","date":"2026-04-07","rfc":"","folio":"","category_id":"1","cost_center_id":"2","advance_id":"2","project_id":"1","company_id":"2","department_id":"3","return_amount":"","geo_lat":"19.27147","geo_long":"-99.473421"}', NULL, NULL, '2026-04-07 19:54:46');

-- TABLE: system_settings --
DROP TABLE IF EXISTS system_settings;
CREATE TABLE `system_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `is_encrypted` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE system_settings;
INSERT INTO system_settings (setting_key, setting_value, is_encrypted, updated_at) VALUES 
('smtp_host', '', 0, '2026-02-28 14:16:07'),
('smtp_pass', '', 0, '2026-02-28 14:16:07'),
('smtp_port', '', 0, '2026-02-28 14:16:07'),
('smtp_secure', 'false', 0, '2026-02-28 14:16:07'),
('smtp_user', '', 0, '2026-02-28 14:16:07');

-- TABLE: users --
DROP TABLE IF EXISTS users;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_old` enum('Admin','Manager','Employee','Cajero','Empleado') DEFAULT 'Employee',
  `reports_to` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `department_id` int(11) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `role_id` int(11) DEFAULT NULL,
  `role` enum('Admin','Manager','Employee') NOT NULL DEFAULT 'Employee',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `reports_to` (`reports_to`),
  KEY `department_id` (`department_id`),
  KEY `fk_users_role` (`role_id`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`reports_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
TRUNCATE TABLE users;
INSERT INTO users (id, name, email, password_hash, role_old, reports_to, created_at, updated_at, department_id, password, active, role_id, role) VALUES 
(1, 'Admin User', 'hgonzalez@induwell.com', 'hgonzalez', 'Admin', NULL, '2026-02-16 05:13:52', '2026-04-07 14:48:36', 1, 'password123', 1, 1, 'Admin'),
(44, 'Carlos Vega Cabanas', 'director@test.com', 'director', 'Employee', NULL, '2026-03-10 15:44:08', '2026-03-10 15:44:08', 1, NULL, 1, 7, 'Employee'),
(45, 'Brenda Santos', 'cajero@test.com', 'cajero', 'Employee', NULL, '2026-03-10 15:45:34', '2026-03-10 15:45:34', 1, NULL, 1, 4, 'Employee'),
(46, 'Ricardo Barranco', 'j1@test.com', 'j1', 'Employee', NULL, '2026-03-10 15:46:36', '2026-03-10 15:46:36', 2, NULL, 1, 2, 'Employee'),
(47, 'Hector Aviles', 'j2@test.com', 'j2', 'Employee', NULL, '2026-03-10 15:55:10', '2026-03-10 15:55:10', 3, NULL, 1, 2, 'Employee'),
(48, 'Fernanda Michel Castillo', 'e1@test.com', 'e1', 'Employee', 46, '2026-03-10 15:55:48', '2026-03-10 15:55:48', 1, NULL, 1, 3, 'Employee'),
(49, 'Lizbeth Lopez', 'e2@test.com', 'e2', 'Employee', 46, '2026-03-10 15:56:40', '2026-03-10 15:56:40', 1, NULL, 1, 3, 'Employee'),
(50, 'Luis Ldezma', 'e3@test.com', 'e3', 'Employee', 47, '2026-03-10 15:57:09', '2026-03-10 15:57:09', 3, NULL, 1, 3, 'Employee'),
(51, 'Sergio Gomez', 'e4@test.com', 'e4', 'Employee', 47, '2026-03-10 15:57:58', '2026-03-10 15:57:58', 3, NULL, 1, 3, 'Employee');

SET FOREIGN_KEY_CHECKS = 1;
