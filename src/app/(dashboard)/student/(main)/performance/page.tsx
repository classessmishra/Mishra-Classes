"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getStudentPerformance } from "@/actions/performance";
import { Calendar, CheckCircle } from "lucide-react";

export default function StudentPerformancePage() {
  const [activeTab, setActiveTab] = useState<"batches" | "courses">("batches");
  const [batchData, setBatchData] = useState<any[]>([]);
  const [courseData, setCourseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      let userId = null;
      const match = document.cookie.match(/(^| )user_id=([^;]+)/);
      if (match) {
        userId = match[2];
      } else {
        userId = "11111111-1111-1111-1111-111111111111"; // Fallback for dev
      }

      const { batchTests, courseTests } = await getStudentPerformance(userId);
      setBatchData(batchTests);
      setCourseData(courseTests);
      setLoading(false);
    }
    loadData();
  }, []);

  const currentData = activeTab === "batches" ? batchData : courseData;

  // Transform data for chart
  const chartData = currentData.map((test, index) => ({
    name: test.test_title.length > 15 ? test.test_title.substring(0, 15) + "..." : test.test_title,
    score: test.score,
    fullTitle: test.test_title
  }));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Performance Analytics</h1>
        <p className="text-slate-500 font-medium">Track your progress and test scores.</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100/80 backdrop-blur-md rounded-2xl w-fit border border-slate-200/60 shadow-sm">
        <button
          onClick={() => setActiveTab("batches")}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "batches"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Batches
        </button>
        <button
          onClick={() => setActiveTab("courses")}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "courses"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Courses
        </button>
      </div>

      {currentData.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <CheckCircle size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium text-lg">Analytics will appear here after you attempt your first test.</p>
        </div>
      ) : (
        <>
          {/* Chart Section */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
              Score Trajectory
            </h3>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: any) => [`${value} Marks`, 'Score']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        return payload[0].payload.fullTitle;
                      }
                      return label;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4f46e5" 
                    strokeWidth={4}
                    dot={{ fill: '#4f46e5', strokeWidth: 2, r: 5, stroke: '#ffffff' }}
                    activeDot={{ r: 7, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Test History Table */}
          <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                Test History
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="py-4 px-6 md:px-8 font-bold text-slate-500 text-xs uppercase tracking-wider">Test Name</th>
                    <th className="py-4 px-6 md:px-8 font-bold text-slate-500 text-xs uppercase tracking-wider">Submitted On</th>
                    <th className="py-4 px-6 md:px-8 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Marks Scored</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentData.map((test) => (
                    <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 md:px-8">
                        <div className="font-bold text-slate-800">{test.test_title}</div>
                      </td>
                      <td className="py-4 px-6 md:px-8">
                        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(test.submitted_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-6 md:px-8 text-right">
                        <div className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 font-black px-4 py-1.5 rounded-lg text-sm border border-indigo-100/50">
                          {test.score}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
