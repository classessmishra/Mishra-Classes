"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getComprehensiveTestAnalytics } from "@/actions/tests";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Trophy, ArrowLeft, Clock, Target, BarChart2, AlertTriangle, Users, CheckCircle, XCircle } from "lucide-react";

export default function TestSubmissionsPage() {
  const params = useParams();
  const testId = params.testId as string;
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [testInfo, setTestInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [{ leaderboard: lbData, analytics: anData }, { data: tInfo }] = await Promise.all([
        getComprehensiveTestAnalytics(testId),
        supabase.from('tests').select('*').eq('id', testId).single()
      ]);
      setLeaderboard(lbData || []);
      setAnalytics(anData);
      setTestInfo(tInfo);
      setLoading(false);
    }
    loadData();
  }, [testId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/tests" className="text-slate-500 hover:text-blue-600 flex items-center gap-2 mb-2 font-medium text-sm transition-colors">
            <ArrowLeft size={16} /> Back to Tests
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">{testInfo?.title || testInfo?.test_title || "Test"} - Submissions</h1>
        </div>
        <div className="flex gap-4">
          <Link href={`/admin/tests/${testId}/reports`} className="flex flex-col items-center justify-center bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-center shadow-sm hover:bg-amber-100 transition-colors">
            <div className="text-xs text-amber-700 font-bold uppercase tracking-wider mb-1">Reports</div>
            <AlertTriangle size={24} className="text-amber-500" />
          </Link>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Attendance</h3>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-800">{analytics.attendanceRate}%</span>
              <span className="text-sm font-medium text-slate-400 mb-1">({analytics.totalSubmitted}/{analytics.totalAssigned})</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={20} /></div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pass Rate</h3>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-800">{analytics.passRate}%</span>
              <span className="text-sm font-medium text-slate-400 mb-1">(&gt;40% Score)</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BarChart2 size={20} /></div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Avg Score</h3>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-800">{analytics.averageScore}</span>
              <span className="text-sm font-medium text-slate-400 mb-1">/ {analytics.maxScore}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Trophy size={20} /></div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">High Score</h3>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-800">{analytics.highestScore}</span>
              <span className="text-sm font-medium text-slate-400 mb-1">/ {analytics.maxScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Analytics Row */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart2 size={18} className="text-blue-500" /> Score Distribution</h3>
            <div className="flex items-end justify-between h-40 gap-2 px-2">
              {Object.entries(analytics.scoreDistribution).map(([label, count]: [string, any]) => {
                const maxCount = Math.max(...Object.values(analytics.scoreDistribution as Record<string, number>), 1);
                const heightPct = count > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={label} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{count}</div>
                    <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden h-full flex items-end justify-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t-lg transition-all duration-1000 group-hover:bg-blue-600" 
                        style={{ height: `${heightPct}%` }}
                      ></div>
                    </div>
                    <div className="text-xs font-medium text-slate-500">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Toughest Question */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Target size={18} className="text-red-500" /> Toughest Question</h3>
            {analytics.toughestQuestionIndex !== -1 ? (
              <div className="text-center bg-red-50 p-8 rounded-xl border border-red-100 flex-1 flex flex-col items-center justify-center">
                <div className="text-sm font-bold text-red-500 uppercase tracking-widest mb-2">Question {analytics.toughestQuestionIndex + 1}</div>
                <div className="text-4xl font-black text-red-700 mb-2">{analytics.lowestCorrectRate}%</div>
                <div className="text-sm font-medium text-red-600/80">of students got this right</div>
                <Link href={`/admin/tests/${testId}/edit`} className="mt-4 text-sm font-bold bg-white text-red-600 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
                  Review Question
                </Link>
              </div>
            ) : (
              <div className="text-center bg-slate-50 p-8 rounded-xl border border-slate-100 flex-1 flex flex-col items-center justify-center">
                <p className="text-slate-500">Not enough data to determine.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-center">Time Taken</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((l, i) => (
                  <tr key={l.student_id} className={`hover:bg-slate-50 transition-colors group ${!l.has_submitted ? 'opacity-60 bg-slate-50' : ''}`}>
                    <td className="px-6 py-4">
                      {l.has_submitted ? (
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${l.rank === 1 ? 'bg-yellow-100 text-yellow-700' : l.rank === 2 ? 'bg-slate-200 text-slate-700' : l.rank === 3 ? 'bg-amber-100 text-amber-700' : 'text-slate-600 bg-white border border-slate-200 shadow-sm'}`}>
                          {l.rank}
                        </span>
                      ) : (
                        <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {l.student_name}
                      {!l.has_submitted && <span className="ml-2 bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Absent</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {l.has_submitted ? (
                        <>
                          <span className="font-bold text-blue-600 text-lg">{l.score}</span>
                          <span className="text-slate-400 text-xs ml-1">/ {analytics?.maxScore}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 font-medium">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500 font-medium">
                      {l.has_submitted ? `${Math.floor(l.time_taken_seconds / 60)}m ${l.time_taken_seconds % 60}s` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {l.has_submitted ? (
                        <Link 
                          href={`/student/tests/${testId}/result?studentId=${l.student_id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-3 py-1.5 rounded-lg"
                        >
                          View Result
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">No submission</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500">
            <Trophy size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Students Assigned</h3>
            <p>Assign this test to a batch or students to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
