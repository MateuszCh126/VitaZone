-- Dodanie dynamicznych stawek VAT dla każdego produktu
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 23.00;
