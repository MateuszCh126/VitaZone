-- Migration: Add User Roles and Granular Address Fields

-- 1. Update Users Table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS street VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS house_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS apartment_number VARCHAR(20);

-- Migrate existing TEXT 'address' to 'street' as a fallback, then we could drop it or leave it.
-- For now, let's keep it but mark as deprecated.

-- 2. Update Orders Table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS street VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS house_number VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS apartment_number VARCHAR(20);

-- 3. Update Existing Schema.sql for future clean installs
-- I will do this in another step by editing schema.sql
