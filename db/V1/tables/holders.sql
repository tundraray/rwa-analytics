CREATE TABLE holders (
    id SERIAL PRIMARY KEY,
    token_id INT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    address VARCHAR(100) NOT NULL,
    balance BIGINT NOT NULL,
    optedInAtRound BIGINT,
    optedOutAtRound BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_holders_token_id ON holders (token_id);
CREATE UNIQUE INDEX idx_holders_address_token_id ON holders (address, token_id);
