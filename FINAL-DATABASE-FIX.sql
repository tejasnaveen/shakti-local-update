-- FINAL COMPREHENSIVE FIX - All Missing Columns
-- Execute this in your Supabase SQL Editor

-- Fix 1: Add team_id to employees
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_team_id 
ON employees(team_id);

-- Fix 2: Add tenant_id to case_call_logs (nullable to handle existing data)
ALTER TABLE case_call_logs 
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_call_logs_tenant 
ON case_call_logs(tenant_id);

-- Fix 3: Add team_id to customer_cases
ALTER TABLE customer_cases 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customer_cases_team_id 
ON customer_cases(team_id);

-- Fix 4: Add telecaller_id to customer_cases (if needed)
ALTER TABLE customer_cases 
ADD COLUMN IF NOT EXISTS telecaller_id uuid REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customer_cases_telecaller_id 
ON customer_cases(telecaller_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ ALL schema fixes applied successfully!';
  RAISE NOTICE '1. Added team_id to employees';
  RAISE NOTICE '2. Added tenant_id to case_call_logs';
  RAISE NOTICE '3. Added team_id to customer_cases';
  RAISE NOTICE '4. Added telecaller_id to customer_cases';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your database schema is now complete!';
END $$;
