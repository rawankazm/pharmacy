-- Add missing 'total' column to orders table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total') THEN
        ALTER TABLE orders ADD COLUMN total DECIMAL(10,2) DEFAULT 0.00;
    END IF;
END $$;

-- Also check for status column just in case
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Grant permissions again just to be safe
GRANT ALL ON orders TO public;
GRANT ALL ON order_items TO public;
