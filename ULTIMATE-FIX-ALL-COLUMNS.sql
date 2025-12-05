-- ULTIMATE COMPREHENSIVE FIX - All Missing Columns
-- Execute this COMPLETE script in your Supabase SQL Editor
-- This fixes ALL schema issues at once

-- ============================================================================
-- Fix 1: employees table - Add team_id
-- ============================================================================
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_team_id 
ON employees(team_id);

-- ============================================================================
-- Fix 2: case_call_logs table - Add missing columns
-- ============================================================================
ALTER TABLE case_call_logs 
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE case_call_logs 
ADD COLUMN IF NOT EXISTS callback_date date;

ALTER TABLE case_call_logs 
ADD COLUMN IF NOT EXISTS callback_completed boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_call_logs_tenant ON case_call_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_callback_date ON case_call_logs(callback_date);

-- ============================================================================
-- Fix 3: customer_cases table - Add missing columns
-- ============================================================================
ALTER TABLE customer_cases 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE customer_cases 
ADD COLUMN IF NOT EXISTS telecaller_id uuid REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE customer_cases 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Pending'));

ALTER TABLE customer_cases 
ADD COLUMN IF NOT EXISTS last_call_date timestamptz;

ALTER TABLE customer_cases 
ADD COLUMN IF NOT EXISTS next_action_date timestamptz;

ALTER TABLE customer_cases 
ADD COLUMN IF NOT EXISTS total_collected_amount numeric DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_customer_cases_team_id ON customer_cases(team_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_telecaller_id ON customer_cases(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_status ON customer_cases(status);
CREATE INDEX IF NOT EXISTS idx_customer_cases_next_action_date ON customer_cases(next_action_date);

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅✅✅ ALL SCHEMA FIXES APPLIED SUCCESSFULLY! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed employees table:';
  RAISE NOTICE '  - Added team_id column';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed case_call_logs table:';
  RAISE NOTICE '  - Added tenant_id column';
  RAISE NOTICE '  - Added callback_date column';
  RAISE NOTICE '  - Added callback_completed column';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed customer_cases table:';
  RAISE NOTICE '  - Added team_id column';
  RAISE NOTICE '  - Added telecaller_id column';
  RAISE NOTICE '  - Added status column';
  RAISE NOTICE '  - Added last_call_date column';
  RAISE NOTICE '  - Added next_action_date column';
  RAISE NOTICE '  - Added total_collected_amount column';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your database is now fully configured!';
  RAISE NOTICE '🚀 Refresh your application and it should work!';
END $$;
