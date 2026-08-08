"use server";

import { createClient } from "@/utils/supabase/server";

export async function getStudentPerformance(studentId: string) {
  const supabase = await createClient();
  // Fetch all test submissions for this student, joined with test titles
  const { data: submissions, error } = await supabase
    .from('test_submissions')
    .select(`
      id,
      test_id,
      score,
      time_taken_seconds,
      submitted_at,
      course_id,
      tests (
        id,
        title
      )
    `)
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: true }); // chronological order for graphs

  if (error || !submissions) {
    return { batchTests: [], courseTests: [] };
  }

  const batchTests: any[] = [];
  const courseTests: any[] = [];

  submissions.forEach((sub: any) => {
    const formattedSub = {
      id: sub.id,
      test_id: sub.test_id,
      test_title: sub.tests?.title || "Unknown Test",
      score: sub.score || 0,
      time_taken_seconds: sub.time_taken_seconds || 0,
      submitted_at: sub.submitted_at,
      course_id: sub.course_id
    };

    if (sub.course_id) {
      courseTests.push(formattedSub);
    } else {
      batchTests.push(formattedSub);
    }
  });

  return {
    batchTests,
    courseTests
  };
}
