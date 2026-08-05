"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

import { sendMultiplePushNotifications } from "@/lib/notifications";

export async function assignTest(testId: string, assignmentData: { batch_id?: string, student_id?: string, course_id?: string, start_time?: string, end_time?: string }) {
  // Check if assignment already exists for this batch or student
  let query = supabase.from('test_assignments').select('*').eq('test_id', testId);
  if (assignmentData.batch_id) {
    query = query.eq('batch_id', assignmentData.batch_id);
  } else if (assignmentData.student_id) {
    query = query.eq('student_id', assignmentData.student_id);
  } else if (assignmentData.course_id) {
    query = query.eq('course_id', assignmentData.course_id);
  }

  const { data: existing } = await query;
  
  if (existing && existing.length > 0) {
    // Update existing assignment
    const { error } = await supabase.from('test_assignments').update({
      start_time: assignmentData.start_time,
      end_time: assignmentData.end_time
    }).eq('id', existing[0].id);
    if (error) throw new Error(error.message);
  } else {
    // Insert new assignment
    const { error } = await supabase.from('test_assignments').insert([{
      test_id: testId,
      ...assignmentData
    }]);
    if (error) throw new Error(error.message);
  }

  // Send Push Notification
  try {
    const { data: testData } = await supabase.from('tests').select('title').eq('id', testId).single();
    if (testData?.title) {
      let studentIds: string[] = [];

      if (assignmentData.batch_id) {
        const { data: students } = await supabase
          .from('batch_students')
          .select('student_id')
          .eq('batch_id', assignmentData.batch_id);
        if (students && students.length > 0) {
          studentIds = students.map((s: any) => s.student_id);
        }
      } else if (assignmentData.course_id) {
        const { data: purchases } = await supabase
          .from('purchases')
          .select('student_id')
          .eq('course_id', assignmentData.course_id);
        if (purchases && purchases.length > 0) {
          studentIds = purchases.map((p: any) => p.student_id);
        }
      }

      if (studentIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('expo_push_token')
          .in('id', studentIds);

        if (users) {
          const tokens = Array.from(new Set(users.map((u: any) => u.expo_push_token).filter(Boolean))) as string[];
          if (tokens.length > 0) {
            const scope = assignmentData.batch_id ? "Batch" : "Course";
            const durationText = testData.duration_minutes ? `Duration: ${testData.duration_minutes} mins.` : '';
            await sendMultiplePushNotifications(
              tokens, 
              `📝 New Test: ${testData.title}`, 
              `A new test "${testData.title}" is now available for your ${scope}. ${durationText} Tap to attempt now!`, 
              { 
                type: 'TEST', 
                testId,
                path: `/test/${testId}`
              }
            );
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to send test push notification:", err);
  }

  revalidatePath('/admin/tests');
  return { success: true };
}

export async function getTests() {
  const { data, error } = await supabase.from('tests').select('*').order('start_date', { ascending: false });
  if (error) return [];
  return data;
}

export async function getBatchTests(batchId: string) {
  const { data, error } = await supabase
    .from('test_assignments')
    .select('*, tests(*)')
    .eq('batch_id', batchId)
    .order('assigned_at', { ascending: false }); // get newest first
  
  if (error) return [];
  
  const formattedTests = data.map(item => ({
    ...item.tests,
    assignment_id: item.id,
    assignment_start_time: item.start_time,
    assignment_end_time: item.end_time
  })).filter(test => test.id);

  // Deduplicate by test.id in case of old duplicate assignments
  const uniqueTests = [];
  const seenIds = new Set();
  for (const test of formattedTests) {
    if (!seenIds.has(test.id)) {
      seenIds.add(test.id);
      uniqueTests.push(test);
    }
  }
  
  return uniqueTests;
}

export async function getTestById(testId: string) {
  const { data, error } = await supabase.from('tests').select('*').eq('id', testId).single();
  if (error) return null;
  return data;
}

export async function createTest(payload: any) {
  // Ensure default structure
  const testData = {
    test_title: payload.test_title,
    title: payload.test_title || "Untitled Test",
    duration_minutes: payload.duration_minutes || 60,
    start_date: payload.start_date || new Date().toISOString(),
    batch_id: payload.batch_id || null,
    scramble_enabled: payload.scramble_enabled || false,
    questions: payload.questions || [],
  };

  const { data, error } = await supabase.from('tests').insert([testData]).select();
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/tests');
  return data[0];
}

export async function submitTest(testId: string, studentId: string, submissionData: { score: number, time_taken_seconds: number, answers: any, time_spent: any, course_id?: string }) {
  console.log("submitTest called with:", testId, studentId, JSON.stringify(submissionData).substring(0, 100));
  const { course_id, ...dataToInsert } = submissionData;
  
  if (!course_id) {
    // Legacy behavior: Delete existing submission to allow retakes for batch-assigned tests and prevent duplicate rows
    await supabase.from('test_submissions').delete().eq('test_id', testId).eq('student_id', studentId).is('course_id', null);
  }
  
  const { error } = await supabase.from('test_submissions').insert([{
    test_id: testId,
    student_id: studentId,
    course_id: course_id || null,
    ...dataToInsert
  }]);
  
  if (error) throw new Error(error.message);
  revalidatePath('/student/tests');
  if (course_id) {
    revalidatePath(`/student/courses/${course_id}`);
  }
  return { success: true };
}

export async function getStudentSubmissions(studentId: string) {
  const { data, error } = await supabase.from('test_submissions').select('*').eq('student_id', studentId);
  if (error) return [];
  return data;
}

export async function getSubmission(testId: string, studentId: string) {
  const { data, error } = await supabase.from('test_submissions').select('*').eq('test_id', testId).eq('student_id', studentId).single();
  if (error) return null;
  return data;
}

export async function reportQuestion(testId: string, studentId: string, questionIndex: number, reason: string) {
  const { error } = await supabase.from('question_reports').insert([{
    test_id: testId,
    student_id: studentId,
    question_index: questionIndex,
    reason: reason
  }]);
  
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getReportedQuestions() {
  const { data, error } = await supabase
    .from('question_reports')
    .select('*, tests(*), users(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
    
  if (error) return [];
  return data;
}

export async function getReportedQuestionsByTest(testId: string) {
  const { data, error } = await supabase
    .from('question_reports')
    .select('*, tests(*), users(*)')
    .eq('status', 'pending')
    .eq('test_id', testId)
    .order('created_at', { ascending: false });
    
  if (error) return [];
  return data;
}

export async function updateTestQuestions(testId: string, questions: any[]) {
  const { error } = await supabase.from('tests').update({ questions }).eq('id', testId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tests');
  return { success: true };
}

export async function unassignTest(assignmentId: string) {
  const { error } = await supabase.from('test_assignments').delete().eq('id', assignmentId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tests');
  return { success: true };
}

export async function deleteTest(testId: string) {
  // Delete dependent records first to avoid foreign key constraint errors
  await supabase.from('question_reports').delete().eq('test_id', testId);
  await supabase.from('test_submissions').delete().eq('test_id', testId);
  await supabase.from('test_assignments').delete().eq('test_id', testId);

  const { error } = await supabase.from('tests').delete().eq('id', testId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tests');
  return { success: true };
}

export async function getTestLeaderboard(testId: string) {
  const { data, error } = await supabase
    .from('test_submissions')
    .select('*, users(full_name, id)')
    .eq('test_id', testId);

  if (error || !data) return [];

  // Sort by score DESC, then time_taken ASC
  const sorted = data.sort((a, b) => {
    if (b.score !== a.score) return (b.score || 0) - (a.score || 0);
    return (a.time_taken_seconds || 0) - (b.time_taken_seconds || 0);
  });

  return sorted.map((sub, index) => ({
    rank: index + 1,
    student_id: sub.student_id,
    student_name: sub.users?.full_name || "Unknown Student",
    score: sub.score,
    time_taken_seconds: sub.time_taken_seconds
  }));
}

export async function getComprehensiveTestAnalytics(testId: string) {
  // 1. Get test info to know max score & questions
  const { data: testInfo } = await supabase.from('tests').select('*').eq('id', testId).single();
  if (!testInfo) throw new Error("Test not found");

  const maxScore = testInfo.questions?.reduce((acc: number, q: any) => acc + (q.positive_marks || 0), 0) || 0;

  // 2. Get all assignments
  const { data: assignments } = await supabase.from('test_assignments').select('*').eq('test_id', testId);
  const batchIds = assignments?.filter(a => a.batch_id).map(a => a.batch_id) || [];
  const assignedStudentIds = assignments?.filter(a => a.student_id).map(a => a.student_id) || [];

  // 3. Get students from batches
  const studentMap = new Map<string, { id: string, name: string, email: string }>();
  
  if (batchIds.length > 0) {
    const { data: batchStudents } = await supabase
      .from('batch_students')
      .select('student_id, users(id, full_name, email)')
      .in('batch_id', batchIds);
      
    if (batchStudents) {
      batchStudents.forEach((bs: any) => {
        if (bs.users) {
          studentMap.set(bs.users.id, { id: bs.users.id, name: bs.users.full_name || "Unknown", email: bs.users.email || "" });
        }
      });
    }
  }

  // 4. Get direct students
  if (assignedStudentIds.length > 0) {
    const { data: directStudents } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', assignedStudentIds);
      
    if (directStudents) {
      directStudents.forEach((user: any) => {
         studentMap.set(user.id, { id: user.id, name: user.full_name || "Unknown", email: user.email || "" });
      });
    }
  }

  // 5. Get submissions
  const { data: submissions } = await supabase
    .from('test_submissions')
    .select('*, users(id, full_name)')
    .eq('test_id', testId)
    .order('submitted_at', { ascending: false }); // Get newest first in case of existing duplicates

  const subs = submissions || [];
  
  const questions = testInfo?.questions || [];
  
  // Also add any student who submitted but wasn't in the explicit assignment map
  subs.forEach((sub: any) => {
    if (sub.users && !studentMap.has(sub.users.id)) {
      studentMap.set(sub.users.id, { id: sub.users.id, name: sub.users.full_name || "Unknown", email: "" });
    }
  });

  const totalAssigned = studentMap.size;
  const totalSubmitted = subs.length;
  
  // 6. Build leaderboard list
  const fullList = Array.from(studentMap.values()).map(student => {
    const submission = subs.find(s => s.student_id === student.id);
    
    let calculatedScore = 0;
    if (submission && submission.answers) {
      questions.forEach((q: any, idx: number) => {
        const ans = submission.answers[idx];
        if (ans !== null && ans !== undefined) {
          if (ans === q.correct_option_index) {
            calculatedScore += (q.positive_marks || 0);
          } else {
            calculatedScore -= (q.negative_marks || 0);
          }
        }
      });
    }

    return {
      student_id: student.id,
      student_name: student.name,
      has_submitted: !!submission,
      score: submission ? calculatedScore : 0,
      time_taken_seconds: submission ? submission.time_taken_seconds : 0,
      answers: submission ? submission.answers : []
    };
  });

  // Sort: Submitted first (by score desc, time asc), then unsubmitted by name
  fullList.sort((a, b) => {
    if (a.has_submitted && !b.has_submitted) return -1;
    if (!a.has_submitted && b.has_submitted) return 1;
    if (!a.has_submitted && !b.has_submitted) return a.student_name.localeCompare(b.student_name);
    
    if (b.score !== a.score) return (b.score || 0) - (a.score || 0);
    return (a.time_taken_seconds || 0) - (b.time_taken_seconds || 0);
  });

  // Assign ranks only to submitted
  let currentRank = 1;
  let prevScore: number | null = null;
  let prevTime: number | null = null;
  
  const leaderboard = fullList.map((item, index) => {
    if (!item.has_submitted) {
      return { ...item, rank: null };
    }
    
    if (prevScore !== null && (item.score !== prevScore || item.time_taken_seconds !== prevTime)) {
      currentRank = index + 1;
    }
    prevScore = item.score;
    prevTime = item.time_taken_seconds;
    
    return { ...item, rank: currentRank };
  });

  // 7. Calculate Analytics
  let passCount = 0;
  const passThreshold = maxScore * 0.4;
  const scoreDistribution = { '0-20%': 0, '20-40%': 0, '40-60%': 0, '60-80%': 0, '80-100%': 0 };
  
  const questionStats = testInfo.questions?.map(() => ({ correct: 0, total_attempts: 0 })) || [];

  subs.forEach((sub: any) => {
    if (sub.score >= passThreshold) passCount++;
    
    // Distribution
    const pct = maxScore > 0 ? (sub.score / maxScore) * 100 : 0;
    if (pct < 20) scoreDistribution['0-20%']++;
    else if (pct < 40) scoreDistribution['20-40%']++;
    else if (pct < 60) scoreDistribution['40-60%']++;
    else if (pct < 80) scoreDistribution['60-80%']++;
    else scoreDistribution['80-100%']++;
    
    // Question Stats
    if (sub.answers && Array.isArray(sub.answers)) {
      sub.answers.forEach((ans: any, qIdx: number) => {
        if (ans !== null && questionStats[qIdx]) {
           questionStats[qIdx].total_attempts++;
           if (ans === testInfo.questions[qIdx].correct_option_index) {
             questionStats[qIdx].correct++;
           }
        }
      });
    }
  });

  let toughestQuestionIndex = -1;
  let lowestCorrectRate = 101;
  questionStats.forEach((stat: {correct: number, total_attempts: number}, idx: number) => {
    if (stat.total_attempts > 0) {
      const rate = (stat.correct / stat.total_attempts) * 100;
      if (rate < lowestCorrectRate) {
        lowestCorrectRate = rate;
        toughestQuestionIndex = idx;
      }
    }
  });

  const averageScore = subs.length > 0 ? Math.round(subs.reduce((acc, sub) => acc + (sub.score || 0), 0) / subs.length) : 0;
  const highestScore = subs.length > 0 ? Math.max(...subs.map(s => s.score || 0)) : 0;

  return {
    leaderboard,
    analytics: {
      totalAssigned,
      totalSubmitted,
      attendanceRate: totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 0,
      passRate: totalSubmitted > 0 ? Math.round((passCount / totalSubmitted) * 100) : 0,
      averageScore,
      highestScore,
      maxScore,
      scoreDistribution,
      toughestQuestionIndex,
      lowestCorrectRate: lowestCorrectRate <= 100 ? Math.round(lowestCorrectRate) : null
    }
  };
}

export async function resolveReport(reportId: string, testId: string, newCorrectOption: number, questionIndex: number) {
  // 1. Mark report as resolved
  await supabase.from('question_reports').update({ status: 'resolved' }).eq('id', reportId);
  
  // 2. We assume the admin has updated the correct option via updateTestQuestions separately or we can do it here.
  // We'll leave the test update to be explicitly handled by the UI calling updateTestQuestions before resolveReport.
  
  // 3. Recalculate all submissions for this test
  const { data: testInfo } = await supabase.from('tests').select('*').eq('id', testId).single();
  const { data: submissions } = await supabase.from('test_submissions').select('*').eq('test_id', testId);
  
  if (testInfo && submissions) {
    const q = testInfo.questions[questionIndex];
    if (!q) return { success: true };
    
    for (const sub of submissions) {
      if (!sub.answers || sub.answers[questionIndex] === undefined || sub.answers[questionIndex] === null) continue;
      
      let newScore = 0;
      const newAnswers = [...sub.answers]; // same
      
      testInfo.questions.forEach((question: any, idx: number) => {
        const a = newAnswers[idx];
        if (a === null || a === undefined) return;
        if (a === question.correct_option_index) {
          newScore += question.positive_marks;
        } else {
          newScore -= question.negative_marks;
        }
      });
      
      await supabase.from('test_submissions').update({ score: newScore }).eq('id', sub.id);
    }
  }
  
  revalidatePath('/admin/reports');
  return { success: true };
}
