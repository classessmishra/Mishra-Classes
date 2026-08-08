"use client";

import { useEffect, useState } from "react";
import { getTests, getStudentSubmissions } from "@/actions/tests";
import Link from "next/link";
import { Clock, PlayCircle, CheckCircle2, LayoutDashboard, FileText } from "lucide-react";

export default function StudentTestsPage() {
  const [tests, setTests] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
  const [tests, setTests] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const cachedTests = localStorage.getItem('cached_student_tests');
      const cachedSubmissions = localStorage.getItem('cached_student_submissions');
      if (cachedTests) setTests(JSON.parse(cachedTests));
      if (cachedSubmissions) setSubmissions(JSON.parse(cachedSubmissions));
      if (cachedTests) setLoading(false);
    } catch(e) {}

    async function loadTests() {
      // 1. Get user ID from cookies
      let userId = null;
      const match = document.cookie.match(/(^| )user_id=([^;]+)/);
      if (match) {
        userId = match[2];
      } else {
        userId = "11111111-1111-1111-1111-111111111111"; // Fallback
      }

      // 2. Fetch tests and submissions
      const [testData, subData] = await Promise.all([
        getTests(),
        getStudentSubmissions(userId)
      ]);

      const subMap: Record<string, any> = {};
      subData.forEach((s: any) => {
        subMap[s.test_id] = s;
      });

      if (testData) {
        setTests(testData);
        try { localStorage.setItem('cached_student_tests', JSON.stringify(testData)); } catch(e) {}
      }
      setSubmissions(subMap);
      try { localStorage.setItem('cached_student_submissions', JSON.stringify(subMap)); } catch(e) {}
      setLoading(false);
    }
    loadTests();
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 pt-20 pb-28 md:py-2 px-2 md:px-0">
      <div className="flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-4 mb-6 md:mb-8 text-center md:text-left">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Tests & Assessments</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-0">View and attempt your assigned tests here.</p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-slate-50 p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <FileText size={32} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No tests available</h3>
          <p className="text-slate-500">You don't have any upcoming tests assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tests.map(test => {
            const hasSubmitted = !!submissions[test.id];
            
            return (
              <div key={test.id} className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden group">
                {hasSubmitted && (
                  <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider uppercase flex items-center gap-1 shadow-sm">
                    <CheckCircle2 size={12} /> Attempted
                  </div>
                )}
                
                <h3 className="font-bold text-slate-800 text-lg md:text-xl mb-3 line-clamp-2 mt-2 md:mt-1 group-hover:text-blue-600 transition-colors pr-20">{test.title || test.test_title}</h3>
                
                {(() => {
                  const calculatedMarks = test.questions ? test.questions.reduce((acc: number, q: any) => acc + (Number(q.positive_marks) || 0), 0) : 0;
                  const displayMarks = calculatedMarks > 0 ? calculatedMarks : (test.total_marks || test.marks || 100);
                  
                  return (
                    <div className="flex items-center text-xs md:text-sm text-slate-500 gap-3 md:gap-4 mb-5 md:mb-6 bg-slate-50 p-2 md:p-2.5 rounded-lg border border-slate-100 w-max">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Clock size={14} className="text-slate-400" /> 
                        <span className="font-medium">{test.duration_minutes || 60} Mins</span>
                      </div>
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <span className="font-medium">{displayMarks} Marks</span>
                    </div>
                  );
                })()}
                
                {hasSubmitted ? (
                  <Link 
                    href={`/student/tests/${test.id}/result`}
                    className="mt-auto bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-600 hover:text-white px-4 py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <LayoutDashboard size={18} /> Review
                  </Link>
                ) : (
                  <Link 
                    href={`/student/tests/${test.id}/take`}
                    className="mt-auto bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 px-4 py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base transition-colors flex items-center justify-center gap-2"
                  >
                    <PlayCircle size={18} /> Start Test
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
