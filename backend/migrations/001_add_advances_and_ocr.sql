-- Migration: Add Advances and Update Expenses for OCR/Geo

-- Create Advances Table
CREATE TABLE IF NOT EXISTS advances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount_requested DECIMAL(10, 2) NOT NULL,
    amount_approved DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('Pendiente', 'Aprobado', 'Comprobado', 'Liquidado', 'Rechazado') NOT NULL DEFAULT 'Pendiente',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_date TIMESTAMP NULL, -- When it was approved/rejected
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Update Expenses Table
-- We use a stored procedure to check if columns exist before adding them to avoid errors on re-runs
SET @dbname = DATABASE();
SET @tablename = "expenses";

-- Add advance_id
SET @columnname = "advance_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE expenses ADD COLUMN advance_id INT, ADD FOREIGN KEY (advance_id) REFERENCES advances(id)"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add rfc
SET @columnname = "rfc";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE expenses ADD COLUMN rfc VARCHAR(20)"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add folio
SET @columnname = "folio";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE expenses ADD COLUMN folio VARCHAR(50)"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add geo_lat
SET @columnname = "geo_lat";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE expenses ADD COLUMN geo_lat DECIMAL(10, 8)"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add geo_long
SET @columnname = "geo_long";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE expenses ADD COLUMN geo_long DECIMAL(11, 8)"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add Unique Constraint for Duplicate Detection (RFC + Folio)
-- Note: managing this via SQL constraint might be strict, but ensures data integrity.
-- We wrap in a block to handle potential "Duplicate key name" error gracefully if run multiple times.
-- For simplicity in this migration script, we will just try to add it.
-- ideally checks should be done, but 'ADD UNIQUE' usually fails safely if data violates it.
-- Let's rely on application logic for now to avoid complex SQL migration logic, 
-- or add it if we are sure table is empty/clean.
-- ALTER TABLE expenses ADD UNIQUE INDEX unique_receipt (rfc, folio);
