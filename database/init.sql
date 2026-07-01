-- ═══════════════════════════════════════════════════════════
--  ExpenseTracker — MySQL Initialization Script
--  Executed only on first container start (empty data volume)
-- ═══════════════════════════════════════════════════════════

-- Create the database (if not already created by MYSQL_DATABASE env var)
CREATE DATABASE IF NOT EXISTS expense_tracker
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE expense_tracker;

-- Ensure the application user has full privileges
-- (When DB_USERNAME=root, this is redundant but harmless)
GRANT ALL PRIVILEGES ON expense_tracker.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- Log successful initialization
SELECT 'ExpenseTracker database initialized successfully.' AS status;
