"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import TestPlayer from "@/components/TestPlayer";
import { getSubmission, getTestLeaderboard } from "@/actions/tests";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AdminTestAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;
  const studentId = params.studentId as string;
  
  const [testData, setTestData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTest() {
      try {
        // Load test details
        const { data: testInfo, error: testErr } = await supabase
          .from("tests")
          .select("*")
          .eq("id", testId)
          .single();
        
        if (testErr) throw new Error(testErr.message);
        if (!testInfo) throw new Error("Test not found");

        // Load submission
        const submission = await getSubmission(testId, studentId);
        if (!submission) {
           throw new Error("This student has not submitted this test yet.");
        }

        // Load Leaderboard
        const lbData = await getTestLeaderboard(testId);
        setLeaderboard(lbData);

        setTestData({
          id: testInfo.id,
          test_title: testInfo.title || testInfo.test_title || "Mock Test",
          duration_minutes: testInfo.duration_minutes || 60,
          scramble_enabled: false, 
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
    
    if (testId && studentId) loadTest();
  }, [testId, studentId]);

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
          <Link href={`/admin/tests/${testId}/submissions`} className="bg-slate-200 text-slate-700 font-bold px-6 py-2 rounded-lg">Go Back</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-4 left-4 z-[201]">
        <Link href={`/admin/tests/${testId}/submissions`} className="flex items-center gap-2 bg-white/80 backdrop-blur border border-slate-200 px-4 py-2 rounded-lg shadow-sm text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
          <ArrowLeft size={16} /> Back to Submissions
        </Link>
      </div>
      <TestPlayer testData={testData} studentId={studentId} initialMode={true} leaderboard={leaderboard} />
    </>
  );
}
