const { createClient } = require('@supabase/supabase-js');

const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env.local');
let envContent = '';
try { envContent = fs.readFileSync(envPath, 'utf-8'); } catch(e) { }

const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2];
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Wait, anon key cannot alter table.
// Supabase REST API doesn't allow DDL with anon key.
