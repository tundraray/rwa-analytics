CREATE TABLE token_price (
    id SERIAL PRIMARY KEY,
    token_id INT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
);  

CREATE UNIQUE INDEX idx_token_price_token_id_date ON token_price (token_id, created_at);
