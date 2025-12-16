
import { supabase } from './src/lib/supabase';

async function checkSchema() {
    const { data, error } = await supabase
        .from('customer_cases')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Keys:', Object.keys(data[0] || {}));
        console.log('Sample:', data[0]);
    }
}

checkSchema();
