-- Table for tokens
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,         -- Unique identifier for each token
    application_id INT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    token_address VARCHAR(100) NOT NULL, -- Token address (e.g., Crypto.BTC/USD)
    network VARCHAR(50) NOT NULL, -- Network (e.g., BTC)
    name VARCHAR(255) NOT NULL, -- Name (e.g., BTC)
    symbol VARCHAR(100) NULL, -- Symbol (e.g., BTC)
    is_global_token BOOLEAN NOT NULL, -- TRUE for global tokens like USDT, FALSE for RWA-specific tokens
    total_supply BIGINT NOT NULL, -- Total supply of the token
    description TEXT,              -- Description of the asset
    decimals INT NOT NULL, -- Decimals of the token
    creator VARCHAR(100) NULL, -- Creator of the token
    token_additional_info TEXT NULL, -- Additional information about the token in json
    last_synced_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, -- Last time the token was synced
    last_transaction_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, -- Last time the token was transacted
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Unique index for symbol and asset_type_id
CREATE UNIQUE INDEX idx_tokens_unique ON tokens (token_address, network);
