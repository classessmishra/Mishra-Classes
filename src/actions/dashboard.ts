"use server";

import { createClient } from "@/utils/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();
  try {
    const [
      { count: activeStudents },
      { count: totalBatches },
      { count: upcomingTests },
      { count: totalCourses },
      { data: recentEnrollments }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('batches').select('*', { count: 'exact', head: true }),
      supabase.from('tests').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('users')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(4)
    ]);

    return {
      activeStudents: activeStudents || 0,
      totalBatches: totalBatches || 0,
      upcomingTests: upcomingTests || 0,
      totalCourses: totalCourses || 0,
      recentEnrollments: recentEnrollments || []
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      activeStudents: 0,
      totalBatches: 0,
      upcomingTests: 0,
      totalCourses: 0,
      recentEnrollments: []
    };
  }
}
