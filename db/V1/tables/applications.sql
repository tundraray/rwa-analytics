CREATE TABLE applications (
    id int PRIMARY KEY, 
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO applications (id, name, description) VALUES (1, 'global', 'Global');
INSERT INTO applications (id, name, description) VALUES (2, 'lofty', 'Lofty.ai');
INSERT INTO applications (id, name, description) VALUES (3, 'realt', 'realt.co');
INSERT INTO applications (id, name, description) VALUES (4, 'oceanpoint', 'oceanpoint.fi');
INSERT INTO applications (id, name, description) VALUES (5, 'equito', 'equito.app');
INSERT INTO applications (id, name, description) VALUES (6, 'reental', 'reental.co');
INSERT INTO applications (id, name, description) VALUES (7, 'estateprotocol', 'estateprotocol.com');
INSERT INTO applications (id, name, description) VALUES (8, 'binaryx', 'binaryx.com');
INSERT INTO applications (id, name, description) VALUES (9, 'redswan', 'redswan.io');
