import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const env: any = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function upgradeSchema() {
  const { error } = await supabase.rpc('exec_sql', { query: `
    ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS stream_muted BOOLEAN DEFAULT false;
    ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS stream_hidden BOOLEAN DEFAULT false;
  `});
  
  if (error) {
    console.log("RPC exec_sql failed, trying direct REST or alternative if we had it, but we can't easily run arbitrary DDL without RPC unless we use a hack.");
    // Supabase JS doesn't have raw SQL execution unless via RPC. 
    // Wait, earlier I did this using RPC and it worked! But wait, does 'exec_sql' exist? No, earlier I asked the user to run it in the Supabase SQL Editor.
  }
}

upgradeSchema();
