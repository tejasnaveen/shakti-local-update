-- Fix status constraint issue
-- There are two status-related columns causing conflicts

-- Drop the 'status' column constraint that was added later
ALTER TABLE customer_cases 
DROP CONSTRAINT IF EXISTS customer_cases_status_check;

-- Remove the 'status' column entirely since 'case_status' already exists
ALTER TABLE customer_cases 
DROP COLUMN IF EXISTS status;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed status constraint issue';
  RAISE NOTICE 'Removed duplicate status column';
  RAISE NOTICE 'Using case_status column instead';
END $$;
