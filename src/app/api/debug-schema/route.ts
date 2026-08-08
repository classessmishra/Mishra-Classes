import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) return NextResponse.json({ error: error.message });
  return NextResponse.json({ columns: data && data.length > 0 ? Object.keys(data[0]) : "empty" });
}
