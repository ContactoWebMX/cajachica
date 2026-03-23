-- Create Database
CREATE DATABASE IF NOT EXISTS induwell_cloud_cash;

-- Create Dedicated User (Avoids root access issues)
CREATE USER IF NOT EXISTS 'induwell_user'@'localhost' IDENTIFIED BY 'Induwell2026!';

-- Grant Permissions
GRANT ALL PRIVILEGES ON induwell_cloud_cash.* TO 'induwell_user'@'localhost';
FLUSH PRIVILEGES;
