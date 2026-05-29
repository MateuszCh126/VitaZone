-- Rollback: Remove product_name_snapshot from order_items
ALTER TABLE order_items DROP COLUMN IF EXISTS product_name_snapshot;
