import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load environment variables manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} else {
    console.log('No .env file found at', envPath);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
    console.log('Checking user_activity table...');

    try {
        // Try to select from the table
        const { data, error } = await supabase
            .from('user_activity')
            .select('count')
            .limit(1);

        if (error) {
            console.error('Error accessing table:', error.message);
            if (error.code === '42P01') {
                console.error('Table does not exist');
            }
        } else {
            console.log('Table exists and is accessible!');
            console.log('Query result:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkTable();
