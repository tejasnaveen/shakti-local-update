// Apply Column Configuration Fix
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://srv1176671.hstgr.cloud';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0ODUxNjQ4LCJleHAiOjIwODAyMTE2NDh9.U2x0u8PPD7Ki_B_DdN7rD_KBb4q3DJAGlG0XpV7zE2g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyFix() {
    console.log('🔧 Applying Column Configuration Fix\n');

    const sql = `
ALTER TABLE column_configurations 
ADD COLUMN IF NOT EXISTS product_name text;

ALTER TABLE column_configurations 
DROP CONSTRAINT IF EXISTS column_configurations_tenant_id_column_name_key;

ALTER TABLE column_configurations 
ADD CONSTRAINT column_configurations_tenant_id_column_name_product_name_key 
UNIQUE (tenant_id, column_name, product_name);

CREATE INDEX IF NOT EXISTS idx_column_config_product_name 
ON column_configurations(tenant_id, product_name);
  `;

    console.log('📝 SQL to execute:');
    console.log(sql);
    console.log('\n⚠️  Please execute this SQL in your Supabase SQL Editor');
    console.log('   URL: https://srv1176671.hstgr.cloud/project/default/sql/new\n');

    // Test after fix (you'll need to run this after executing the SQL)
    console.log('After executing the SQL, run this script again to verify...');
}

applyFix();
