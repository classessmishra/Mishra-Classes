import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) return NextResponse.json({ error: error.message });
  return NextResponse.json({ columns: data && data.length > 0 ? Object.keys(data[0]) : "empty" });
}
