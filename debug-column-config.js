// Debug Column Configurations Issue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://srv1176671.hstgr.cloud';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0ODUxNjQ4LCJleHAiOjIwODAyMTE2NDh9.U2x0u8PPD7Ki_B_DdN7rD_KBb4q3DJAGlG0XpV7zE2g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugColumnConfigs() {
    console.log('🔍 Debugging Column Configurations Table\n');

    // Test 1: Check if table exists and is accessible
    console.log('1️⃣  Testing basic table access...');
    try {
        const { data, error } = await supabase
            .from('column_configurations')
            .select('*')
            .limit(1);

        if (error) {
            console.log('   ❌ Error:', error);
            console.log('   Code:', error.code);
            console.log('   Message:', error.message);
            console.log('   Details:', error.details);
            console.log('   Hint:', error.hint);
        } else {
            console.log('   ✅ Table accessible');
            console.log('   Data:', data);
        }
    } catch (err) {
        console.log('   ❌ Exception:', err);
    }

    // Test 2: Try the exact query that's failing
    console.log('\n2️⃣  Testing query with tenant_id and product_name...');
    const testTenantId = '057e0b19-1661-4ee0-a19b-4e7bfa49ad84';
    const testProductName = 'IDFC';

    try {
        const { data, error } = await supabase
            .from('column_configurations')
            .select('*')
            .eq('tenant_id', testTenantId)
            .eq('product_name', testProductName)
            .order('column_order', { ascending: true });

        if (error) {
            console.log('   ❌ Error:', error);
            console.log('   Code:', error.code);
            console.log('   Message:', error.message);
        } else {
            console.log('   ✅ Query successful');
            console.log('   Records found:', data.length);
        }
    } catch (err) {
        console.log('   ❌ Exception:', err);
    }

    // Test 3: Check table structure
    console.log('\n3️⃣  Checking table structure...');
    try {
        const { data, error } = await supabase
            .from('column_configurations')
            .select('*')
            .limit(0);

        if (error) {
            console.log('   ❌ Error checking structure:', error.message);
        } else {
            console.log('   ✅ Table structure check passed');
        }
    } catch (err) {
        console.log('   ❌ Exception:', err);
    }

    // Test 4: Try inserting a test record
    console.log('\n4️⃣  Testing insert operation...');
    try {
        const testRecord = {
            tenant_id: testTenantId,
            product_name: 'TEST',
            column_name: 'test_column',
            display_name: 'Test Column',
            is_active: true,
            is_custom: false,
            column_order: 1,
            data_type: 'text'
        };

        const { data, error } = await supabase
            .from('column_configurations')
            .insert([testRecord])
            .select();

        if (error) {
            console.log('   ❌ Insert error:', error);
            console.log('   Code:', error.code);
            console.log('   Message:', error.message);
            console.log('   Details:', error.details);
        } else {
            console.log('   ✅ Insert successful');
            console.log('   Inserted:', data);

            // Clean up test record
            await supabase
                .from('column_configurations')
                .delete()
                .eq('product_name', 'TEST');
            console.log('   🧹 Test record cleaned up');
        }
    } catch (err) {
        console.log('   ❌ Exception:', err);
    }
}

debugColumnConfigs();
