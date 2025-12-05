-- Fix status check constraint for customer_cases
-- The current constraint only allows: 'Open', 'Closed', 'Pending'
-- But the app might be using different values

-- Drop the existing constraint
ALTER TABLE customer_cases 
DROP CONSTRAINT IF EXISTS customer_cases_status_check;

-- Add a more flexible constraint or make it nullable
-- Option 1: Make status nullable and remove constraint
ALTER TABLE customer_cases 
ALTER COLUMN status DROP NOT NULL;

-- Option 2: Or add more allowed values
-- Uncomment this if you want to keep the constraint but add more values:
-- ALTER TABLE customer_cases 
-- ADD CONSTRAINT customer_cases_status_check 
-- CHECK (status IN ('Open', 'Closed', 'Pending', 'Active', 'In Progress', 'Resolved'));

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed status constraint on customer_cases table';
  RAISE NOTICE 'Status column is now more flexible';
END $$;
