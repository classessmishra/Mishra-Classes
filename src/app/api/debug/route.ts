import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('advertisements').select('*').eq('section_type', 'bento');
  return NextResponse.json({ data, error });
}
