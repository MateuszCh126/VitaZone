-- Rollback: Remove discount system components

-- 1. Remove columns from orders
ALTER TABLE orders DROP COLUMN IF EXISTS discount_code_id;
ALTER TABLE orders DROP COLUMN IF EXISTS discount_amount_cents;

-- 2. Drop discount_codes table
DROP TABLE IF EXISTS discount_codes;
