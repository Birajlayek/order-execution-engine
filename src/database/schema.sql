DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS dex_quotes CASCADE;
DROP TABLE IF EXISTS execution_logs CASCADE;

CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    token_in VARCHAR(255) NOT NULL,
    token_out VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    side VARCHAR(10),
    limit_price DECIMAL(20, 8),
    executed_price DECIMAL(20, 8),
    dex_used VARCHAR(50),
    tx_hash VARCHAR(255),
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dex_quotes (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(36) REFERENCES orders(id),
    dex VARCHAR(50) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    fee DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_id ON orders(user_id);
