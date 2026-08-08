"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import TestPlayer from "@/components/TestPlayer";

function TakeTestContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const testId = params.testId as string;
  const courseId = searchParams.get('courseId');
  const [testData, setTestData] = useState<any>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  const [studentPhoto, setStudentPhoto] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTest() {
      try {
        const match = document.cookie.match(/(^| )user_id=([^;]+)/);
        const userId = match ? match[2] : null;
        if (!userId) throw new Error("Unauthorized");
        setStudentId(userId);

        const { data: userData } = await supabase.from('users').select('full_name, profile_photo_url').eq('id', userId).single();
        if (userData) {
            setStudentName(userData.full_name || "");
            setStudentPhoto(userData.profile_photo_url || "");
        }
        
        // 1. Check if user has already submitted (only for non-course attempts to maintain legacy behavior. Course tests allow multiple attempts as managed by course study room UI)
        if (!courseId) {
          const { data: submission } = await supabase.from('test_submissions').select('id').eq('test_id', testId).eq('student_id', userId).is('course_id', null).single();
          if (submission) {
            throw new Error("You have already attempted this test.");
          }
        }

        // 2. Validate time window or course limits
        if (!courseId) {
          const { data: assignments } = await supabase.from('test_assignments').select('start_time, end_time').eq('test_id', testId);
          
          if (assignments && assignments.length > 0) {
            // If there are assignments, find if ANY assignment allows this user right now (simplification)
            const now = new Date();
            let canTake = false;
            let latestEnd = new Date(0);
            
            for (const a of assignments) {
              const st = a.start_time ? new Date(a.start_time) : new Date(0);
              const et = a.end_time ? new Date(a.end_time) : new Date(8640000000000000);
              if (et > latestEnd) latestEnd = et;
              if (now >= st && now <= et) {
                canTake = true;
                break;
              }
            }
            
            if (!canTake) {
              if (now > latestEnd) {
                 throw new Error("This test has expired. You are marked as Absent.");
              } else {
                 throw new Error("This test is not available yet.");
              }
            }
          }
        } else {
          // Validate course assignment limits
          const { data: courseTest } = await supabase.from('course_tests').select('id, max_attempts').eq('test_id', testId).eq('course_id', courseId).single();
          if (!courseTest) throw new Error("This test is not assigned to this course.");
          
          const { count } = await supabase.from('test_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('test_id', testId)
            .eq('student_id', userId)
            .eq('course_id', courseId);
            
          if (count !== null && count >= courseTest.max_attempts) {
            throw new Error(`You have reached the maximum number of attempts (${courseTest.max_attempts}) for this test.`);
          }
        }

        // 3. Fetch test
        const { data, error } = await supabase
          .from("tests")
          .select("*")
          .eq("id", testId)
          .single();
        
        if (error) throw new Error(error.message);
        if (!data) throw new Error("Test not found");

        setTestData({
          id: data.id,
          test_title: data.title || data.test_title || "Mock Test",
          duration_minutes: data.duration_minutes || 60,
          scramble_enabled: data.scramble_enabled || false,
          questions: data.questions || []
        });
      } catch (err: any) {
        setError(err.message || "Failed to load test");
      } finally {
        setLoading(false);
      }
    }
    
    if (testId) loadTest();
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 absolute inset-0 z-[200]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !testData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 absolute inset-0 z-[200]">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to load test</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button onClick={() => window.location.href = "/student/tests"} className="bg-slate-200 text-slate-700 font-bold px-6 py-2 rounded-lg">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <TestPlayer testData={testData} studentId={studentId} studentName={studentName} studentPhoto={studentPhoto} courseId={courseId || undefined} />
    </>
  );
}

export default function TakeTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 absolute inset-0 z-[200]"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
      <TakeTestContent />
    </Suspense>
  );
}
