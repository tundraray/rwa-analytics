CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL,
    date TIMESTAMP NOT NULL,
    is_swap BOOLEAN NOT NULL DEFAULT FALSE,
    token_id INT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    from_address VARCHAR(100) NOT NULL,
    to_address VARCHAR(100) NOT NULL,
    amount BIGINT NOT NULL,
    swap_amount BIGINT NULL,
    swap_token_id INT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_transactions_token_id_transaction_id ON transactions (token_id, transaction_id);

