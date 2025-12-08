-- Add slug column to tenants table for URL-friendly tenant identification
-- This enables path-based tenant login: /tenant-slug/login

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Update existing tenants with slugs (you'll need to set these manually in Super Admin)
-- Example: UPDATE tenants SET slug = 'acme-corp' WHERE name = 'ACME Corporation';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tenant slug column added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Go to Super Admin Dashboard';
  RAISE NOTICE '2. Edit each tenant and set a unique slug (e.g., "acme", "xyz-corp")';
  RAISE NOTICE '3. Tenants will be accessible at: https://srirenukamba.in/{slug}/login';
END $$;
