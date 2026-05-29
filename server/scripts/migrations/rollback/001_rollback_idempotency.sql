-- Rollback: Remove idempotency_key from orders
ALTER TABLE orders DROP COLUMN IF EXISTS idempotency_key;
