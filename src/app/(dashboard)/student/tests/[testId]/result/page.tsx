"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import TestPlayer from "@/components/TestPlayer";
import { getSubmission, getComprehensiveTestAnalytics } from "@/actions/tests";

function TestResultContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = params.testId as string;
  const targetStudentId = searchParams.get("studentId");
  const [testData, setTestData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTest() {
      try {
        const match = document.cookie.match(/(^| )user_id=([^;]+)/);
        const loggedInUserId = match ? match[2] : null;
        const userId = targetStudentId || loggedInUserId;
        setActiveUserId(userId);
        if (!userId) throw new Error("Unauthorized");
        
        // Load test details
        const { data: testInfo, error: testErr } = await supabase
          .from("tests")
          .select("*")
          .eq("id", testId)
          .single();
        
        if (testErr) throw new Error(testErr.message);
        if (!testInfo) throw new Error("Test not found");

        // Load submission
        const submission = await getSubmission(testId, userId);
        if (!submission) {
           router.push(`/student/tests/${testId}/take`);
           return;
        }

        // Load Leaderboard & Analytics
        const { leaderboard: lbData } = await getComprehensiveTestAnalytics(testId);
        setLeaderboard(lbData);

        setTestData({
          id: testInfo.id,
          test_title: testInfo.title || testInfo.test_title || "Mock Test",
          duration_minutes: testInfo.duration_minutes || 60,
          scramble_enabled: false, // Turn off scramble in review mode so it matches submission exactly
          questions: testInfo.questions || [],
          initial_answers: submission.answers || [],
          initial_time_spent: submission.time_spent || []
        });
      } catch (err: any) {
        setError(err.message || "Failed to load test results");
      } finally {
        setLoading(false);
      }
    }
    
    if (testId) loadTest();
  }, [testId, router, targetStudentId]);

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
          <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to load result</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button onClick={() => window.location.href = "/student/tests"} className="bg-slate-200 text-slate-700 font-bold px-6 py-2 rounded-lg">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <TestPlayer testData={testData} studentId={activeUserId || undefined} initialMode={true} leaderboard={leaderboard} />
    </>
  );
}

export default function TestResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 absolute inset-0 z-[200]"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
      <TestResultContent />
    </Suspense>
  );
}
