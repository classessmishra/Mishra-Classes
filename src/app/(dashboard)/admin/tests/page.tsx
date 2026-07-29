"use client";

import { useEffect, useState } from "react";
import { getTests, assignTest, deleteTest } from "@/actions/tests";
import { getBatches } from "@/actions/batches";
import { getAllUsers } from "@/actions/users";
import { getCourses } from "@/actions/courses";
import Link from "next/link";
import { Plus, Clock, Users, BookOpen, MoreVertical, X } from "lucide-react";
import { DateTimePicker } from "@/components/DateTimePicker";

export default function TestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [assignType, setAssignType] = useState<"batch" | "student" | "course">("batch");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [testsData, batchesData, usersData, coursesData] = await Promise.all([
        getTests(),
        getBatches(),
        getAllUsers(),
        getCourses()
      ]);
      setTests(testsData || []);
      setBatches(batchesData || []);
      setStudents((usersData || []).filter((u: any) => u.role === 'student'));
      setCourses(coursesData || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const openAssignModal = (test: any) => {
    setSelectedTest(test);
    setIsModalOpen(true);
    setSelectedTargetId("");
    
    const now = new Date();
    const dStr = now.toISOString().split("T")[0];
    const hStr = now.getHours().toString().padStart(2, '0');
    const mStr = now.getMinutes().toString().padStart(2, '0');
    
    const endNow = new Date(now.getTime() + (test.duration_minutes || 60) * 60000);
    const edStr = endNow.toISOString().split("T")[0];
    const ehStr = endNow.getHours().toString().padStart(2, '0');
    const emStr = endNow.getMinutes().toString().padStart(2, '0');
    
    setStartDate(dStr);
    setStartTime(`${hStr}:${mStr}`);
    setEndDate(edStr);
    setEndTime(`${ehStr}:${emStr}`);
  };

  const handleAssign = async () => {
    if (!selectedTargetId) return alert("Please select a target to assign to.");
    setAssigning(true);
    try {
      const payload: any = {};
      if (assignType === "batch") payload.batch_id = selectedTargetId;
      else if (assignType === "student") payload.student_id = selectedTargetId;
      else payload.course_id = selectedTargetId;
      
      if (startDate && startTime) payload.start_time = new Date(startDate + "T" + startTime).toISOString();
      if (endDate && endTime) payload.end_time = new Date(endDate + "T" + endTime).toISOString();

      await assignTest(selectedTest.id, payload);
      alert("Test assigned successfully!");
      setIsModalOpen(false);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setAssigning(false);
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test? This action cannot be undone.")) return;
    try {
      await deleteTest(testId);
      setTests(tests.filter(t => t.id !== testId));
      setOpenDropdownId(null);
    } catch (e: any) {
      alert("Error deleting test: " + e.message);
    }
  };

  const handleDownloadJson = (test: any) => {
    try {
      // Remove db specific metadata that's not needed for import
      const { id, created_at, batch_id, ...testDataToExport } = test;
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(testDataToExport, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${test.title || test.test_title || 'test'}_export.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      setOpenDropdownId(null);
    } catch (e) {
      alert("Error downloading JSON.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Assessments & Tests</h1>
          <p className="text-muted-foreground text-sm">Manage and create tests for your batches.</p>
        </div>
        <Link 
          href="/admin/tests/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Create New Test
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">No tests created yet</h3>
          <p className="text-slate-500 mb-6">Create your first test to assess your students.</p>
          <Link href="/admin/tests/create" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold inline-block">
            Create First Test
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map(test => (
            <div key={test.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col relative group">
              
              {/* 3 Dots Menu Button */}
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
                      <button 
                        onClick={() => handleDownloadJson(test)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        Download JSON
                      </button>
                      <button 
                        onClick={() => handleDeleteTest(test.id)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete Test
                      </button>
                    </div>
                  </>
                )}
              </div>

              <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 pr-6">{test.title || test.test_title}</h3>
              
              <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock size={16} /> {test.duration_minutes || 60} Mins
                  </div>
                  
                  <div className="flex gap-2">
                    {/* View Results Button */}
                    <Link 
                      href={`/admin/tests/${test.id}/submissions`}
                      className="text-purple-600 font-semibold text-xs bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Results
                    </Link>
                    {/* Edit Test Button */}
                    <Link 
                      href={`/admin/tests/${test.id}/edit`}
                      className="text-slate-600 font-semibold text-xs bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Edit
                    </Link>
                    {/* Tap to Assign Button */}
                    <button 
                      onClick={() => openAssignModal(test)} 
                      className="text-blue-600 font-semibold text-xs bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {isModalOpen && selectedTest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Assign Test</h2>
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
                <button
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${assignType === 'course' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => { setAssignType('course'); setSelectedTargetId(""); }}
                >
                  To Course
                </button>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Select {assignType === 'batch' ? 'Batch' : assignType === 'student' ? 'Student' : 'Course'}
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose {assignType === 'batch' ? 'a Batch' : assignType === 'student' ? 'a Student' : 'a Course'} --</option>
                  {assignType === 'batch' ? (
                    batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))
                  ) : assignType === 'student' ? (
                    students.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name || s.phone || "Unknown User"}</option>
                    ))
                  ) : (
                    courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Start Date & Time
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm text-slate-700"
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm text-slate-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    End Date & Time
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm text-slate-700"
                    />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleAssign}
                disabled={assigning || !selectedTargetId}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-lg font-bold transition-all"
              >
                {assigning ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
