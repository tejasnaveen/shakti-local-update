// Health Check Script for Shakti CRM
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://srv1176671.hstgr.cloud';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0ODUxNjQ4LCJleHAiOjIwODAyMTE2NDh9.U2x0u8PPD7Ki_B_DdN7rD_KBb4q3DJAGlG0XpV7zE2g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const requiredTables = [
    'super_admins',
    'tenants',
    'tenant_databases',
    'company_admins',
    'tenant_migrations',
    'audit_logs',
    'employees',
    'teams',
    'team_telecallers',
    'column_configurations',
    'customer_cases',
    'case_call_logs',
    'telecaller_targets',
    'notifications',
    'user_activity',
    'case_views'
];

async function checkHealth() {
    console.log('🏥 SHAKTI CRM - HEALTH CHECK');
    console.log('='.repeat(50));
    console.log(`\n📍 Supabase URL: ${supabaseUrl}`);
    console.log(`⏰ Check Time: ${new Date().toLocaleString()}\n`);

    let healthScore = 0;
    const totalChecks = requiredTables.length + 1; // tables + super admin

    // Check 1: Supabase Connection
    console.log('1️⃣  Checking Supabase Connection...');
    try {
        const { data, error } = await supabase.from('super_admins').select('count').limit(1);
        if (error && error.code !== 'PGRST116') {
            console.log('   ❌ Connection failed:', error.message);
        } else {
            console.log('   ✅ Connection successful');
            healthScore++;
        }
    } catch (err) {
        console.log('   ❌ Connection error:', err.message);
    }

    // Check 2: All Required Tables
    console.log('\n2️⃣  Checking Database Tables...');
    for (const table of requiredTables) {
        try {
            const { error } = await supabase.from(table).select('count').limit(1);
            if (error) {
                console.log(`   ❌ ${table.padEnd(25)} - Missing or inaccessible`);
            } else {
                console.log(`   ✅ ${table.padEnd(25)} - OK`);
                healthScore++;
            }
        } catch (err) {
            console.log(`   ❌ ${table.padEnd(25)} - Error: ${err.message}`);
        }
    }

    // Check 3: Super Admin Status
    console.log('\n3️⃣  Checking Super Admin...');
    try {
        const { data, error } = await supabase
            .from('super_admins')
            .select('id, username, created_at')
            .limit(5);

        if (error) {
            console.log('   ❌ Error querying super admins:', error.message);
        } else if (data.length === 0) {
            console.log('   ⚠️  No super admins found');
        } else {
            console.log(`   ✅ Found ${data.length} super admin(s)`);
            data.forEach(admin => {
                console.log(`      - ${admin.username} (ID: ${admin.id.substring(0, 8)}...)`);
            });
        }
    } catch (err) {
        console.log('   ❌ Error:', err.message);
    }

    // Check 4: Data Summary
    console.log('\n4️⃣  Data Summary...');
    const dataTables = ['tenants', 'employees', 'teams', 'customer_cases'];
    for (const table of dataTables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`   ❌ ${table.padEnd(20)} - Error`);
            } else {
                console.log(`   📊 ${table.padEnd(20)} - ${count || 0} records`);
            }
        } catch (err) {
            console.log(`   ❌ ${table.padEnd(20)} - Error`);
        }
    }

    // Final Health Score
    console.log('\n' + '='.repeat(50));
    const percentage = ((healthScore / totalChecks) * 100).toFixed(1);
    console.log(`\n🎯 HEALTH SCORE: ${healthScore}/${totalChecks} (${percentage}%)`);

    if (percentage >= 90) {
        console.log('✅ Status: HEALTHY - All systems operational');
    } else if (percentage >= 70) {
        console.log('⚠️  Status: DEGRADED - Some issues detected');
    } else {
        console.log('❌ Status: CRITICAL - Major issues detected');
    }

    console.log('\n' + '='.repeat(50));
}

checkHealth().catch(err => {
    console.error('❌ Health check failed:', err);
    process.exit(1);
});
