
-- Migration: Add approved_by to expenses
SET @dbname = DATABASE();
SET @tablename = "expenses";
SET @columnname = "approved_by";

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE expenses ADD COLUMN approved_by INT NULL, ADD FOREIGN KEY (approved_by) REFERENCES users(id)"
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
