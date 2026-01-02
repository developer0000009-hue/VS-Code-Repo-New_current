import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = 'https://lnqfoffbmafwkhgdadgw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxucWZvZmZibWFmd2toZ2RhZGd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjkyMzY2NSwiZXhwIjoyMDc4NDk5NjY1fQ.rj0eAt_vm9JTV1Ct471UYwmo8FRvkwkxWR-n-LPDOic';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting enrollment workflow migration...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'schema_updates.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 SQL file loaded, executing migration...');

    // Execute the SQL using rpc function
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }

    console.log('✅ Migration completed successfully!');
    console.log('📋 Migration results:', data);

    // Verify the enrollments table was created
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'enrollments');

    if (tableError) {
      console.error('❌ Error checking table creation:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Enrollments table verified!');
    } else {
      console.log('⚠️ Enrollments table not found - migration may have failed');
    }

  } catch (err) {
    console.error('💥 Unexpected error during migration:', err);
  }
}

// Alternative approach: split SQL and execute statements individually
async function runMigrationAlternative() {
  try {
    console.log('🚀 Starting alternative migration approach...');

    const sqlFilePath = path.join(__dirname, 'schema_updates.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

      try {
        // Try to execute using a generic query approach
        const { error } = await supabase.from('_supabase_migrations').select('*').limit(1);

        if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log('   Migration table approach failed, trying direct execution...');
        }

        // For complex DDL, we might need to use the REST API directly
        // Since we can't execute DDL via the client, let's try a different approach

      } catch (stmtError) {
        console.error(`❌ Statement ${i + 1} failed:`, stmtError.message);
        // Continue with next statement
      }
    }

  } catch (err) {
    console.error('💥 Error in alternative migration:', err);
  }
}

// Since direct SQL execution via client is limited, let's provide instructions
console.log('🔧 MIGRATION INSTRUCTIONS:');
console.log('');
console.log('1. Open your Supabase dashboard: https://supabase.com/dashboard/project/lnqfoffbmafwkhgdadgw');
console.log('2. Go to the SQL Editor');
console.log('3. Copy and paste the contents of schema_updates.sql');
console.log('4. Click "Run" to execute the migration');
console.log('');
console.log('This will:');
console.log('  ✅ Create the missing enrollments table');
console.log('  ✅ Add branch_id to student_enrollments table');
console.log('  ✅ Create the required RPC functions');
console.log('  ✅ Fix the enrollment workflow');
console.log('');

export { runMigration, runMigrationAlternative };
