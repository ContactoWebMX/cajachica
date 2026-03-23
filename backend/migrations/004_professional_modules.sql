-- Migration: Professional Modules (Catalogs, Users, Workflows)

-- 1. Create Expense Categories Table
CREATE TABLE IF NOT EXISTS expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Cost Centers Table
CREATE TABLE IF NOT EXISTS cost_centers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE, -- e.g. "CC-001"
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    cost_center_id INT,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL
);

-- 4. Update Users Table (Roles & Hierarchy)
-- Using stored procedure to safely add columns if they don't exist
SET @dbname = DATABASE();
SET @tablename = "users";

-- Add role
SET @columnname = "role";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN role ENUM('Admin', 'Manager', 'Employee') NOT NULL DEFAULT 'Employee'"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add department_id
SET @columnname = "department_id";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN department_id INT, ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add reports_to (Manager)
SET @columnname = "reports_to";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN reports_to INT, ADD FOREIGN KEY (reports_to) REFERENCES users(id) ON DELETE SET NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 5. Update Expenses Table (Link to Catalogs)
SET @tablename = "expenses";

-- Add category_id
SET @columnname = "category_id";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE expenses ADD COLUMN category_id INT, ADD FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add cost_center_id
SET @columnname = "cost_center_id";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE expenses ADD COLUMN cost_center_id INT, ADD FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 6. Insert Default Data (Seeding)
-- Default Categories
INSERT IGNORE INTO expense_categories (name, description) VALUES 
('Viáticos', 'Gastos de viaje, hospedaje y alimentación'),
('Material de Oficina', 'Papelería y suministros'),
('Mantenimiento', 'Reparaciones y mantenimiento de equipos'),
('Combustible', 'Gasolina y diésel para vehículos utilitarios'),
('Otros', 'Gastos generales no clasificados');

-- Default Cost Centers
INSERT IGNORE INTO cost_centers (code, name) VALUES 
('CC-GRL', 'General / Administrativo'),
('CC-OPS', 'Operaciones'),
('CC-VTAS', 'Ventas');

-- Default Departments
INSERT IGNORE INTO departments (name, cost_center_id) VALUES 
('Administración', 1),
('Sistemas', 1),
('Producción', 2),
('Logística', 2),
('Comercial', 3);
