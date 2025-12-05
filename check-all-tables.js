// Check all tables for missing columns
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://srv1176671.hstgr.cloud';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0ODUxNjQ4LCJleHAiOjIwODAyMTE2NDh9.U2x0u8PPD7Ki_B_DdN7rD_KBb4q3DJAGlG0XpV7zE2g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllTables() {
    console.log('🔍 Checking All Tables for Missing Columns\n');

    const tablesToCheck = [
        { name: 'employees', expectedColumns: ['id', 'tenant_id', 'name', 'emp_id', 'mobile', 'password_hash', 'role', 'status', 'team_id'] },
        { name: 'column_configurations', expectedColumns: ['id', 'tenant_id', 'column_name', 'display_name', 'is_active', 'is_custom', 'column_order', 'data_type', 'product_name'] },
        { name: 'case_call_logs', expectedColumns: ['id', 'tenant_id', 'case_id', 'employee_id', 'call_status', 'created_at'] },
        { name: 'customer_cases', expectedColumns: ['id', 'tenant_id', 'customer_name', 'loan_id', 'mobile_no'] },
    ];

    for (const table of tablesToCheck) {
        console.log(`\n📋 Checking table: ${table.name}`);

        try {
            const { data, error } = await supabase
                .from(table.name)
                .select('*')
                .limit(0);

            if (error) {
                console.log(`   ❌ Error accessing table: ${error.message}`);
                console.log(`   Code: ${error.code}`);
                if (error.hint) console.log(`   Hint: ${error.hint}`);
            } else {
                console.log(`   ✅ Table accessible`);
            }

            // Try to query with expected columns
            const selectQuery = table.expectedColumns.join(',');
            const { error: columnError } = await supabase
                .from(table.name)
                .select(selectQuery)
                .limit(1);

            if (columnError) {
                console.log(`   ⚠️  Column issue: ${columnError.message}`);

                // Extract missing column from error message
                const match = columnError.message.match(/column [\w.]+\.(\w+) does not exist/);
                if (match) {
                    console.log(`   ❌ Missing column: ${match[1]}`);
                }
            } else {
                console.log(`   ✅ All expected columns present`);
            }

        } catch (err) {
            console.log(`   ❌ Exception: ${err.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
}

checkAllTables();
