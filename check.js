const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('messages').select('*').limit(5);
  console.log('Error:', error);
  console.log('Data:', data);
  
  const { data: users, error: uError } = await supabase.from('users').select('*').limit(5);
  console.log('Users Error:', uError);
  console.log('Users:', users.map(u => u.id));
}

run();
