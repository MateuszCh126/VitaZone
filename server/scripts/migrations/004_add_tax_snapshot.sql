-- Add tax_rate_snapshot column to order_items (Default to 23.00 if unknown, or can be nullable)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_rate_snapshot DECIMAL(5,2) DEFAULT 23.00;
