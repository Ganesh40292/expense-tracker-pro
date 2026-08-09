-- ═══════════════════════════════════════════════════════════
-- Flyway V2 Schema Migration — Assets & Investments Tracking
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS assets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL,
    institution VARCHAR(150),
    current_value DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    purchase_value DECIMAL(15, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
