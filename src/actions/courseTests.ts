"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

export async function getCourseTests(courseId: string, studentId?: string) {
  noStore();
  // Fetch tests assigned to this course
  const { data: assignments, error: assignError } = await supabase
    .from('course_tests')
    .select(`
      id,
      max_attempts,
      tests (
        id, title, duration_minutes, total_marks
      )
    `)
    .eq('course_id', courseId);
    
  if (assignError) {
    console.error("Error fetching course tests:", assignError);
    return [];
  }

  // If studentId is provided, fetch their submissions for these tests in this course
  if (studentId && assignments) {
    const testIds = assignments.map(a => (a.tests as any).id);
    
    if (testIds.length > 0) {
      const { data: submissions, error: subError } = await supabase
        .from('test_submissions')
        .select('id, test_id, score, submitted_at')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .in('test_id', testIds);
        
      if (!subError && submissions) {
        // Map submissions to assignments
        return assignments.map(a => {
          const testId = (a.tests as any).id;
          const mySubmissions = submissions.filter(s => s.test_id === testId);
          return {
            ...a,
            attempts_count: mySubmissions.length,
            submissions: mySubmissions
          };
        });
      }
    }
  }

  return assignments.map(a => ({ ...a, attempts_count: 0, submissions: [] }));
}

export async function getAllTests() {
  // For the bank, we fetch all tests. 
  // Ideally, tests meant for courses might have batch_id as NULL
  const { data, error } = await supabase
    .from('tests')
    .select('id, title, duration_minutes, total_marks')
    .order('title', { ascending: true });
    
  if (error) {
    console.error("Error fetching all tests:", error);
    return [];
  }
  return data;
}

export async function assignTestToCourse(courseId: string, testId: string, maxAttempts: number) {
  const { error } = await supabase.from('course_tests').insert([{
    course_id: courseId,
    test_id: testId,
    max_attempts: maxAttempts
  }]);
  
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  return { success: true };
}

export async function removeTestFromCourse(id: string, courseId: string) {
  const { error } = await supabase.from('course_tests').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  return { success: true };
}
