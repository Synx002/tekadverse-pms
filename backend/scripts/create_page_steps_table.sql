-- Migration: Create page_steps table
-- Purpose: Store step information for each page to auto-generate tasks

CREATE TABLE IF NOT EXISTS page_steps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  page_id INT NOT NULL,
  step_number INT NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  INDEX idx_page_id (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
