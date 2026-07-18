const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: "ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'live';"
  });
  if(error) {
    console.log("Error running RPC (may not exist):", error.message);
  } else {
    console.log("Column added or already exists.");
  }
}
run();
