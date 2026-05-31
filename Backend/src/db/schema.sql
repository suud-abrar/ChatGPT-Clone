CREATE TABLE IF NOT EXISTS conversations(
    id BigInt UNSIGNED AUTO_INCREMENT PRIMARY Key,
    role ENUM('user','assistant') NOT NULL,
    content TEXT NOT NULL,
    token_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);






















