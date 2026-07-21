"use client";

import { useEffect, useState } from "react";
import { getTests, assignTest } from "@/actions/tests";
import { getBatches } from "@/actions/batches";
import { getAllUsers } from "@/actions/users";
import Link from "next/link";
import { Archive, Clock, MoreVertical, X, Calendar, ChevronDown, ChevronUp } from "lucide-react";

export default function TestBankPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [assignType, setAssignType] = useState<"batch" | "student">("batch");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Group expansion state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      const [testsData, batchesData, usersData] = await Promise.all([
        getTests(),
        getBatches(),
        getAllUsers()
      ]);
      setTests(testsData || []);
      setBatches(batchesData || []);
      setStudents((usersData || []).filter((u: any) => u.role === 'student'));
      setLoading(false);
    }
    loadData();
  }, []);

  const openAssignModal = (test: any) => {
    setSelectedTest(test);
    setIsModalOpen(true);
    setSelectedTargetId("");
    setStartTime("");
    setEndTime("");
  };

  const handleAssign = async () => {
    if (!selectedTargetId) return alert("Please select a batch or student.");
    setAssigning(true);
    try {
      const payload: any = {};
      if (assignType === "batch") payload.batch_id = selectedTargetId;
      else payload.student_id = selectedTargetId;
      
      if (startTime) payload.start_time = new Date(startTime).toISOString();
      if (endTime) payload.end_time = new Date(endTime).toISOString();

      await assignTest(selectedTest.id, payload);
      alert("Test assigned successfully!");
      setIsModalOpen(false);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setAssigning(false);
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Group tests by Month and Year
  const groupedTests = tests.reduce((acc, test) => {
    // We use start_date or fallback to created_at if exists, else "Unknown Date"
    const dateStr = test.start_date || test.created_at;
    let monthYear = "Unknown Date";
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        monthYear = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      }
    }
    
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(test);
    return acc;
  }, {} as Record<string, any[]>);

  // Auto-expand all groups by default on first render
  useEffect(() => {
    if (Object.keys(groupedTests).length > 0 && Object.keys(expandedGroups).length === 0) {
      const initial: Record<string, boolean> = {};
      Object.keys(groupedTests).forEach(k => initial[k] = true);
      setExpandedGroups(initial);
    }
  }, [tests]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Archive className="text-blue-600" />
            Test Bank Archive
          </h1>
          <p className="text-muted-foreground text-sm">View and reassign past tests sorted by month.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : Object.keys(groupedTests).length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center">
          <Archive size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">No tests in archive</h3>
          <p className="text-slate-500 mb-6">Tests you create will appear here.</p>
          <Link href="/admin/tests/create" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold inline-block">
            Create First Test
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTests).map(([monthYear, monthTests]: [string, any]) => (
            <div key={monthYear} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button 
                onClick={() => toggleGroup(monthYear)}
                className="w-full bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-bold text-slate-800">{monthYear}</h2>
                    <p className="text-sm text-slate-500 font-medium">{monthTests.length} Tests created</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {expandedGroups[monthYear] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </button>

              {expandedGroups[monthYear] && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                  {monthTests.map((test: any) => (
                    <div key={test.id} className="border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all flex flex-col group relative">
                      
                      <div className="absolute top-4 right-4">
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === test.id ? null : test.id)} 
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Test Options"
                        >
                          <MoreVertical size={20} />
                        </button>
                        
                        {openDropdownId === test.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)}></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                              <Link 
                                href={`/admin/tests/${test.id}/duplicate`}
                                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                              >
                                Duplicate & Assign
                              </Link>
                              <Link 
                                href={`/admin/tests/${test.id}/submissions`}
                                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                              >
                                View Submissions
                              </Link>
                            </div>
                          </>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-800 text-base mb-1 pr-8">{test.title || test.test_title}</h3>
                      <div className="flex items-center text-xs text-slate-500 gap-2 mb-4">
                        <Clock size={14} className="text-slate-400" /> {test.duration_minutes || 60} Mins
                      </div>

                      <Link 
                        href={`/admin/tests/${test.id}/duplicate`}
                        className="mt-auto block w-full py-2 text-center rounded-lg bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        Duplicate & Reassign
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {isModalOpen && selectedTest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Reassign Test</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Selected Test</p>
                <p className="text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{selectedTest.title || selectedTest.test_title}</p>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${assignType === 'batch' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => { setAssignType('batch'); setSelectedTargetId(""); }}
                >
                  To Batch
                </button>
                <button
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${assignType === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => { setAssignType('student'); setSelectedTargetId(""); }}
                >
                  To Student
                </button>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Select {assignType === 'batch' ? 'Batch' : 'Student'}
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose {assignType === 'batch' ? 'a Batch' : 'a Student'} --</option>
                  {assignType === 'batch' ? (
                    batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))
                  ) : (
                    students.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name || s.phone || "Unknown User"}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm text-slate-700"
                  />
                </div>
              </div>

              <button 
                onClick={handleAssign}
                disabled={assigning || !selectedTargetId}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-lg font-bold transition-all"
              >
                {assigning ? "Assigning..." : "Confirm Reassignment"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
