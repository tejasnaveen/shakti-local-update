-- Simple fix for remaining missing columns
-- Run this if you already ran the first fix

-- Fix 1: Add team_id to employees (if not already added)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_team_id 
ON employees(team_id);

-- Fix 2: Add tenant_id to case_call_logs
-- IMPORTANT: If this fails because of NOT NULL constraint and existing data,
-- you'll need to either:
-- 1. Delete existing rows: DELETE FROM case_call_logs;
-- 2. Or make it nullable first, then update values, then make it NOT NULL

-- Try adding as NOT NULL first
DO $$ 
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'case_call_logs' AND column_name = 'tenant_id'
    ) THEN
        -- Try to add with NOT NULL
        BEGIN
            ALTER TABLE case_call_logs 
            ADD COLUMN tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE;
        EXCEPTION WHEN OTHERS THEN
            -- If it fails, add as nullable
            RAISE NOTICE 'Adding tenant_id as nullable due to existing data';
            ALTER TABLE case_call_logs 
            ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
        END;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_call_logs_tenant 
ON case_call_logs(tenant_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Remaining fixes applied!';
  RAISE NOTICE '1. Added team_id to employees';
  RAISE NOTICE '2. Added tenant_id to case_call_logs';
  RAISE NOTICE '';
  RAISE NOTICE 'If tenant_id was added as nullable, you may need to:';
  RAISE NOTICE '1. Update existing rows with proper tenant_id values';
  RAISE NOTICE '2. Then make it NOT NULL: ALTER TABLE case_call_logs ALTER COLUMN tenant_id SET NOT NULL;';
END $$;
