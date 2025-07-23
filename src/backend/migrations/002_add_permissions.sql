ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;
UPDATE users SET permissions = '[]'::jsonb WHERE permissions IS NULL;
