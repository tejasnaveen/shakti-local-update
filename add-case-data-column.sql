-- FINAL FIX - Add case_data column to customer_cases
-- Execute this in your Supabase SQL Editor

ALTER TABLE customer_cases 
ADD COLUMN IF NOT EXISTS case_data jsonb DEFAULT '{}'::jsonb;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Added case_data column to customer_cases table';
  RAISE NOTICE '🎉 All schema fixes are now complete!';
END $$;
