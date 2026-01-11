import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jforwngnlqyvlpqzuqpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb3J3bmdubHF5dmxwcXp1cXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjY0NTksImV4cCI6MjA4Mjk0MjQ1OX0.f3WXFI972q4P-PKD_vWQo6fKzh9bedoQ6FzIgpJxU8M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
    console.log('Checking table names...');

    try {
        // Try to query share_codes
        const { data: shareData, error: shareError } = await supabase
            .from('share_codes')
            .select('id')
            .limit(1);

        if (shareError) {
            console.log('share_codes table error:', shareError.message);
        } else {
            console.log('share_codes table exists');
        }

        // Try to query admission_share_codes
        const { data: admissionData, error: admissionError } = await supabase
            .from('admission_share_codes')
            .select('id')
            .limit(1);

        if (admissionError) {
            console.log('admission_share_codes table error:', admissionError.message);
        } else {
            console.log('admission_share_codes table exists');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkTable();
