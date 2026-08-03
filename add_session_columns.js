const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const sql = `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS current_app_session_id UUID;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS current_web_session_id UUID;
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.log("Error running RPC (may not exist):", error.message);
  } else {
    console.log("Columns added successfully.");
  }
}
run();
