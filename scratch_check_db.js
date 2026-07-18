const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('live_classes').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Error:", error);
  console.log("Recent live classes:");
  console.dir(data, { depth: null });
}

check();
