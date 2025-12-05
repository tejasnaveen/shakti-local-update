-- Add missing product_name column to column_configurations table
-- This column is required for multi-product support

ALTER TABLE column_configurations 
ADD COLUMN IF NOT EXISTS product_name text;

-- Update the unique constraint to include product_name
ALTER TABLE column_configurations 
DROP CONSTRAINT IF EXISTS column_configurations_tenant_id_column_name_key;

ALTER TABLE column_configurations 
ADD CONSTRAINT column_configurations_tenant_id_column_name_product_name_key 
UNIQUE (tenant_id, column_name, product_name);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_column_config_product_name 
ON column_configurations(tenant_id, product_name);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added product_name column to column_configurations table';
  RAISE NOTICE 'Updated unique constraint to include product_name';
  RAISE NOTICE 'Created index for product_name queries';
END $$;
