-- Add product_name column to customer_cases
-- Execute this in your Supabase SQL Editor

ALTER TABLE customer_cases 
ADD COLUMN IF NOT EXISTS product_name text;

CREATE INDEX IF NOT EXISTS idx_customer_cases_product_name 
ON customer_cases(product_name);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Added product_name column to customer_cases table';
  RAISE NOTICE '🎉 Upload should now work!';
END $$;
