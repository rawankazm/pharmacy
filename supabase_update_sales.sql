-- Add cashier tracking columns to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cashier_id BIGINT REFERENCES cashiers(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cashier_name TEXT;
