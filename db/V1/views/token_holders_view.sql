CREATE VIEW token_holders_view AS
SELECT 
    h.id AS holder_id,
    h.address AS holder_address,
    h.balance,
    h.url AS holder_url,
    h.last_synced_at AS holder_last_synced,
    t.id AS token_id,
    t.token_address,
    t.network,
    t.name AS token_name,
    t.symbol,
    t.total_supply,
    t.decimals,
    t.creator AS token_creator,
    t.is_global_token,
    t.description AS token_description,
    a.id AS application_id,
    a.name AS application_name,
    a.description AS application_description
FROM 
    holders h
    INNER JOIN tokens t ON h.token_id = t.id
    INNER JOIN applications a ON t.application_id = a.id
WHERE 
    h.deleted = FALSE;
