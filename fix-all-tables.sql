-- Comprehensive Database Schema Fixes
-- Execute all these fixes in your Supabase SQL Editor

-- Fix 1: Add product_name to column_configurations
ALTER TABLE column_configurations 
ADD COLUMN IF NOT EXISTS product_name text;

ALTER TABLE column_configurations 
DROP CONSTRAINT IF EXISTS column_configurations_tenant_id_column_name_key;

ALTER TABLE column_configurations 
ADD CONSTRAINT column_configurations_tenant_id_column_name_product_name_key 
UNIQUE (tenant_id, column_name, product_name);

CREATE INDEX IF NOT EXISTS idx_column_config_product_name 
ON column_configurations(tenant_id, product_name);

-- Fix 2: Add team_id to employees
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_team_id 
ON employees(team_id);

-- Fix 3: Add tenant_id to case_call_logs
ALTER TABLE case_call_logs 
ADD COLUMN IF NOT EXISTS tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_call_logs_tenant 
ON case_call_logs(tenant_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All schema fixes applied successfully!';
  RAISE NOTICE '1. Added product_name to column_configurations';
  RAISE NOTICE '2. Added team_id to employees';
  RAISE NOTICE '3. Added tenant_id to case_call_logs';
END $$;
