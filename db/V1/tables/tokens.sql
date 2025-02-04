-- Table for tokens
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,         -- Unique identifier for each token
    token_id VARCHAR(100) NOT NULL, -- Token ID (e.g., Crypto.BTC/USD)
    network VARCHAR(50) NOT NULL, -- Network (e.g., BTC)
    name VARCHAR(50) NOT NULL, -- Name (e.g., BTC)
    is_global_token BOOLEAN NOT NULL, -- TRUE for global tokens like USDT, FALSE for RWA-specific tokens
    total_supply BIGINT NOT NULL, -- Total supply of the token
    description TEXT,              -- Description of the asset
    decimals INT NOT NULL, -- Decimals of the token
    creator VARCHAR(100) NOT NULL -- Creator of the token
);


-- Unique index for symbol and asset_type_id
CREATE UNIQUE INDEX idx_tokens_unique ON tokens (token_id, network);
