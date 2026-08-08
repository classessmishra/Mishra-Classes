import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

import { getComprehensiveTestAnalytics } from '@/actions/tests';

export async function GET() {
  try {
    const res = await getComprehensiveTestAnalytics('c31d0239-ae61-4d47-8389-7f480d3bdc17');
    return NextResponse.json({ res });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack });
  }
}


