import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

import { getComprehensiveTestAnalytics } from '@/actions/tests';

export async function GET() {
  try {
    const res = await getComprehensiveTestAnalytics('c31d0239-ae61-4d47-8389-7f480d3bdc17');
    return NextResponse.json({ res });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack });
  }
}


