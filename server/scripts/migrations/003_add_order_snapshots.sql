-- Add product_name_snapshot column to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name_snapshot VARCHAR(255);

-- Optional: Backfill existing items with current product name as best effort
UPDATE order_items 
SET product_name_snapshot = products.name
FROM products 
WHERE order_items.product_id = products.id 
AND order_items.product_name_snapshot IS NULL;
