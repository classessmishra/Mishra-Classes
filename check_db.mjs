import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('messages')
    .select('*, reply_to:messages(id, content, sender_id)')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log("Error:", error);
  console.log("Messages:", JSON.stringify(data, null, 2));
}
check();
