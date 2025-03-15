-- Add migration script here
ALTER TABLE users ALTER COLUMN verification_code TYPE VARCHAR(100);
