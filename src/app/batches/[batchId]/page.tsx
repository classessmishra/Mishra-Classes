"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Megaphone, ArrowLeft, Clock, 
  List, Award, UserCheck, Calendar, BookOpen, Hash, Paperclip, ExternalLink, UserCircle, Trash, Edit2, UserX
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { getBatchTests, getStudentSubmissions, assignTest, unassignTest } from "@/actions/tests";
import { getBatchAnnouncements, deleteBatchAnnouncement } from "@/actions/announcements";
import { getStudentAttendance, getBatchAttendanceHistory } from "@/actions/batches";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function BatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;
  const [activeTab, setActiveTab] = useState<"overview" | "test" | "announcement" | "attendance">("overview");

  // Mock data based on batchId
  const batchName = "Loading Batch Details...";

  // Data fetching
  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [batchTimings, setBatchTimings] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("student");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  
  useEffect(() => {
    async function loadBatchData() {
      const matchRole = document.cookie.match(/(^| )auth_role=([^;]+)/);
      if (matchRole) setUserRole(matchRole[2]);

      const matchUser = document.cookie.match(/(^| )user_id=([^;]+)/);
      if (matchUser) setCurrentUserId(matchUser[2]);

      if (batchId) {
        const { data } = await supabase.from('batches').select('*, batch_students(*, users(*))').eq('id', batchId).single();
        if (data) setBatchDetails(data);
        
        const { data: timingsData } = await supabase.from('batch_timings').select('*').eq('batch_id', batchId).order('start_time', { ascending: true });
        if (timingsData) setBatchTimings(timingsData);
      }
    }
    loadBatchData();
  }, [batchId]);

  useEffect(() => {
    async function loadTestData() {
      if (batchId) {
        const testsData = await getBatchTests(batchId);
        setTests(testsData || []);
        
        const match = document.cookie.match(/(^| )user_id=([^;]+)/);
        const userId = match ? match[2] : null;
        if (userId) {
          const subsData = await getStudentSubmissions(userId);
          setSubmissions(subsData || []);
        }
      }
    }
    loadTestData();
  }, [batchId]);

  useEffect(() => {
    async function loadExtraData() {
      if (batchId) {
        const anns = await getBatchAnnouncements(batchId);
        setAnnouncements(anns || []);

        const match = document.cookie.match(/(^| )user_id=([^;]+)/);
        const userId = match ? match[2] : null;
        
        const matchRole = document.cookie.match(/(^| )auth_role=([^;]+)/);
        const role = matchRole ? matchRole[2] : null;

        if (role === 'admin') {
          const att = await getBatchAttendanceHistory(batchId);
          setAttendanceRecords(att || []);
        } else if (userId) {
          const att = await getStudentAttendance(batchId, userId);
          setAttendanceRecords(att || []);
        }
      }
    }
    loadExtraData();
  }, [batchId]);
  
  const sidebarNav = [
    { id: "overview", label: "Overview", icon: List },
    { id: "test", label: "Tests", icon: Award },
    { id: "announcement", label: "Announcements", icon: Megaphone },
    { id: "attendance", label: "Attendance", icon: UserCheck },
  ] as const;

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [activeDay, setActiveDay] = useState("Sunday");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Admin Modals
  const [isEditBatchOpen, setIsEditBatchOpen] = useState(false);
  const [editBatchForm, setEditBatchForm] = useState({ name: "", description: "", course: "", subject: "" });
  
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [addClassForm, setAddClassForm] = useState({ 
    startHour: "12", startMin: "00", startAmPm: "PM", 
    endHour: "01", endMin: "00", endAmPm: "PM", 
    subject: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditBatchSave = async () => {
    setIsSubmitting(true);
    try {
      const { updateBatch } = await import('@/actions/batches');
      await updateBatch(batchId, editBatchForm);
      setBatchDetails({ ...batchDetails, ...editBatchForm });
      setIsEditBatchOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTo24Hr = (hour: string, min: string, ampm: string) => {
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${min}:00`;
  };

  const formatTo12HrDisplay = (time24: string) => {
    if (!time24) return "";
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, "0")}:${mStr} ${ampm}`;
  };

  const handleAddClassSave = async () => {
    if (!addClassForm.startHour || !addClassForm.endHour) return alert("Start and End times are required");
    setIsSubmitting(true);
    try {
      const startTime24 = formatTo24Hr(addClassForm.startHour, addClassForm.startMin, addClassForm.startAmPm);
      const endTime24 = formatTo24Hr(addClassForm.endHour, addClassForm.endMin, addClassForm.endAmPm);

      const { addBatchTiming } = await import('@/actions/batches');
      await addBatchTiming(batchId, activeDay, startTime24, endTime24, addClassForm.subject);
      
      // Reload timings
      const { data: timingsData } = await supabase.from('batch_timings').select('*').eq('batch_id', batchId).order('start_time', { ascending: true });
      if (timingsData) setBatchTimings(timingsData);
      
      setIsAddClassOpen(false);
      setAddClassForm({ 
        startHour: "12", startMin: "00", startAmPm: "PM", 
        endHour: "01", endMin: "00", endAmPm: "PM", 
        subject: "" 
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveClass = async (timingId: string) => {
    if (!confirm("Are you sure you want to remove this class?")) return;
    try {
      const { removeBatchTiming } = await import('@/actions/batches');
      await removeBatchTiming(timingId);
      setBatchTimings(batchTimings.filter(t => t.id !== timingId));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      try {
        await deleteBatchAnnouncement(id);
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      } catch (err: any) {
        alert("Failed to delete announcement: " + err.message);
      }
    }
  };

  const [isEditTestOpen, setIsEditTestOpen] = useState(false);
  const [editTestForm, setEditTestForm] = useState({ testId: "", start: "", end: "" });

  const handleEditTestSave = async () => {
    setIsSubmitting(true);
    try {
      await assignTest(editTestForm.testId, {
        batch_id: batchId,
        start_time: editTestForm.start ? new Date(editTestForm.start).toISOString() : undefined,
        end_time: editTestForm.end ? new Date(editTestForm.end).toISOString() : undefined
      });
      const testsData = await getBatchTests(batchId);
      setTests(testsData || []);
      setIsEditTestOpen(false);
    } catch (err: any) {
      alert("Failed to update test: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignTest = async (assignmentId: string) => {
    if (confirm("Are you sure you want to unassign this test from the batch?")) {
      try {
        await unassignTest(assignmentId);
        setTests(prev => prev.filter(t => t.assignment_id !== assignmentId));
      } catch (err: any) {
        alert("Failed to unassign test: " + err.message);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link href={userRole === 'admin' ? "/admin/batches" : "/batches"} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Batches
      </Link>
      
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-white border-r md:border border-border md:rounded-xl md:p-2 h-fit md:sticky md:top-24 shadow-sm">
          <nav className="flex flex-row md:flex-col overflow-x-auto pb-2 md:pb-0 gap-1 md:gap-2 no-scrollbar">
            {sidebarNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 md:border-l-4 md:border-transparent md:bg-blue-50' 
                      : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent hover:text-slate-900'}
                    ${isActive && 'md:border-l-blue-600' /* Emulate screenshot's left blue border */}
                  `}
                >
                  <Icon size={18} className={isActive ? "text-blue-600" : "text-slate-400"} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (Batch Details & Timings) */}
                <div className={`space-y-6 ${userRole === 'admin' ? 'lg:col-span-3 max-w-4xl mx-auto w-full' : 'lg:col-span-2'}`}>
                  
                  {/* Batch Details Card */}
                  <div className="bg-white border border-border p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start mb-8">
                      <h2 className="text-xl md:text-2xl font-semibold text-slate-800">{batchDetails ? batchDetails.name : "Loading Batch Details..."}</h2>
                      {userRole === 'admin' && (
                        <button 
                          onClick={() => {
                            setEditBatchForm({
                              name: batchDetails?.name || "",
                              description: batchDetails?.description || "",
                              course: batchDetails?.course || "",
                              subject: batchDetails?.subject || ""
                            });
                            setIsEditBatchOpen(true);
                          }}
                          className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Edit Details
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-4">
                      <div className="flex gap-3">
                        <div className="mt-1"><Calendar size={20} className="text-slate-400" /></div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Batch Created Date</p>
                          <p className="text-sm font-semibold text-slate-800">{batchDetails ? new Date(batchDetails.created_at).toLocaleDateString() : "-"}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="mt-1"><Hash size={20} className="text-slate-400" /></div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Batch Description</p>
                          <p className="text-sm font-semibold text-slate-800">{batchDetails ? batchDetails.description || "N/A" : "-"}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="mt-1"><BookOpen size={20} className="text-slate-400" /></div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Course</p>
                          <p className="text-sm font-semibold text-slate-800 truncate pr-4">{batchDetails ? batchDetails.course || "-" : "-"}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="mt-1"><FileText size={20} className="text-slate-400" /></div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Subject</p>
                          <p className="text-sm font-semibold text-slate-800 truncate pr-4">{batchDetails ? batchDetails.subject || "-" : "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Batch Timings Card */}
                  <div className="bg-white border border-border p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-semibold text-slate-800">Batch Timings</h3>
                      {userRole === 'admin' && (
                        <button 
                          onClick={() => setIsAddClassOpen(true)}
                          className="text-xs font-semibold text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          + Add Class
                        </button>
                      )}
                    </div>
                    
                    <div className="flex overflow-x-auto border-b border-border no-scrollbar">
                      {days.map(day => (
                        <button 
                          key={day}
                          onClick={() => setActiveDay(day)}
                          className={`pb-3 px-4 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${activeDay === day ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    
                    <div className="pt-6 min-h-[120px]">
                      {batchTimings.filter(t => t.day_of_week === activeDay).length > 0 ? (
                        <div className="space-y-3">
                          {batchTimings.filter(t => t.day_of_week === activeDay).map(timing => (
                            <div key={timing.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Clock size={18} className="text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{timing.subject || "General Class"}</p>
                                  <p className="text-xs font-medium text-slate-500">{formatTo12HrDisplay(timing.start_time)} - {formatTo12HrDisplay(timing.end_time)}</p>
                                </div>
                              </div>
                              {userRole === 'admin' && (
                                <button onClick={() => handleRemoveClass(timing.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Calendar size={32} className="text-blue-400" />
                          </div>
                          <p className="text-sm font-bold text-slate-800">No classes</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column (Recent Announcements) */}
                {userRole !== 'admin' && (
                <div className="lg:col-span-1">
                  <div className="bg-white border border-border p-6 rounded-xl shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Recent Announcements</h3>
                    
                    <div className="space-y-4">
                      {announcements.length > 0 ? announcements.map((ann, idx) => (
                        <div key={ann.id} className={`flex gap-3 pb-4 ${idx !== announcements.length - 1 ? 'border-b border-border' : ''}`}>
                          <div className="w-10 h-10 bg-blue-50 rounded-lg shrink-0 flex flex-col items-center justify-center text-blue-600">
                            <Megaphone size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-slate-800 truncate pr-2">{ann.title}</h4>
                              <Paperclip size={12} className="text-blue-500 shrink-0" />
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{ann.subtitle}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-500 text-center py-4">No recent announcements</p>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setActiveTab("announcement")}
                      className="w-full text-center mt-4 text-sm font-semibold text-blue-500 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                </div>
                )}

                {userRole === 'admin' && (
                <div className="lg:col-span-1">
                  <div className="bg-white border border-border p-6 rounded-xl shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4 flex justify-between items-center">
                      <span>Enrolled Students</span>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                        {batchDetails?.batch_students?.length || 0} Total
                      </span>
                    </h3>
                    
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {batchDetails?.batch_students?.length > 0 ? batchDetails.batch_students.map((bs: any, idx: number) => (
                        <div key={idx} className="flex gap-3 items-center p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                          <div className="w-8 h-8 bg-blue-50 rounded-full shrink-0 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                            {bs.users?.full_name?.charAt(0) || <UserCircle size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-800 truncate">{bs.users?.full_name || "Unknown Student"}</h4>
                            <p className="text-xs text-slate-500 truncate">{bs.users?.phone || "No phone number"}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-6 flex flex-col items-center">
                          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                            <UserCheck size={24} className="text-slate-300" />
                          </div>
                          <p className="text-sm text-slate-500 font-medium">No students enrolled</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}

            {/* TESTS TAB */}
            {activeTab === "test" && (
              <div className="bg-white border border-border p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">Tests</h2>
                <div className="space-y-4">
                  {(() => {
                    const currentStudentEnrollment = batchDetails?.batch_students?.find((bs: any) => bs.student_id === currentUserId);
                    const userCreatedAt = currentStudentEnrollment?.users?.created_at;
                    const enrolledAt = userCreatedAt ? new Date(userCreatedAt) : new Date(0);

                    const visibleTests = tests.filter(test => {
                      if (!test.assignment_end_time) return true;
                      const endTime = new Date(test.assignment_end_time);
                      return endTime >= enrolledAt;
                    });

                    if (visibleTests.length === 0) {
                      return (
                        <div className="text-center py-10 border border-dashed border-border rounded-xl">
                          <Award size={48} className="mx-auto text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">No tests available right now.</p>
                        </div>
                      );
                    }

                    return visibleTests.map(test => {
                    const now = new Date();
                    let status = test.status || "Active";
                    let statusBadgeClass = "bg-green-100 text-green-700";
                    let btnClass = "bg-blue-600 text-white hover:bg-blue-700 shadow-sm";
                    let btnText = "Start Test";
                    let hasSubmitted: any = null;

                    if (userRole === 'admin') {
                      if (test.assignment_start_time || test.assignment_end_time) {
                        const startTime = test.assignment_start_time ? new Date(test.assignment_start_time) : new Date(0);
                        const endTime = test.assignment_end_time ? new Date(test.assignment_end_time) : new Date(8640000000000000);
                        if (now < startTime) {
                          status = "Upcoming";
                          statusBadgeClass = "bg-blue-100 text-blue-700";
                        } else if (now > endTime) {
                          status = "Expired";
                          statusBadgeClass = "bg-red-100 text-red-700";
                        } else {
                          status = "Active";
                          statusBadgeClass = "bg-green-100 text-green-700";
                        }
                      } else {
                        status = "Active";
                        statusBadgeClass = "bg-green-100 text-green-700";
                      }
                    } else {
                      if (test.assignment_start_time || test.assignment_end_time) {
                        const startTime = test.assignment_start_time ? new Date(test.assignment_start_time) : new Date(0);
                        const endTime = test.assignment_end_time ? new Date(test.assignment_end_time) : new Date(8640000000000000);

                        if (now < startTime) {
                          status = "Upcoming";
                          statusBadgeClass = "bg-blue-100 text-blue-700";
                          btnClass = "bg-slate-100 text-slate-400 cursor-not-allowed";
                          btnText = "Upcoming";
                        } else if (now > endTime) {
                          status = "Absent";
                          statusBadgeClass = "bg-red-100 text-red-700";
                          btnClass = "bg-slate-100 text-slate-400 cursor-not-allowed";
                          btnText = "Missed";
                        } else {
                          status = "Active";
                          statusBadgeClass = "bg-green-100 text-green-700";
                          btnClass = "bg-blue-600 text-white hover:bg-blue-700 shadow-sm";
                          btnText = "Start Test";
                        }
                      } else if (test.status === "Upcoming") {
                         status = "Upcoming";
                         statusBadgeClass = "bg-orange-100 text-orange-700";
                         btnClass = "bg-slate-100 text-slate-400 cursor-not-allowed";
                         btnText = "Upcoming";
                      }
                      
                      hasSubmitted = submissions.find((s: any) => s.test_id === test.id);
                      if (hasSubmitted) {
                        status = "Attempted";
                        statusBadgeClass = "bg-purple-100 text-purple-700";
                        btnClass = "bg-purple-600 text-white hover:bg-purple-700 shadow-sm";
                        btnText = "Review";
                      }
                    }

                    const calculatedMarks = test.questions ? test.questions.reduce((acc: number, q: any) => acc + (Number(q.positive_marks) || 0), 0) : 0;
                    const displayMarks = calculatedMarks > 0 ? calculatedMarks : (test.total_marks || test.marks || 100);

                    return (
                    <div key={test.assignment_id || test.id} className="border border-border p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-200 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusBadgeClass}`}>
                            {status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800">{test.title || test.test_title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1"><Clock size={14} /> {test.duration_minutes || test.duration || 60} Mins</span>
                          <span>{displayMarks} Marks</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4 sm:mt-0">
                        {userRole === 'admin' ? (
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <div className="text-xs text-slate-500 mr-2 flex flex-col items-end hidden md:flex">
                              <div><span className="font-semibold text-slate-700">Start:</span> {test.assignment_start_time ? new Date(test.assignment_start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Now'}</div>
                              <div><span className="font-semibold text-slate-700">End:</span> {test.assignment_end_time ? new Date(test.assignment_end_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}</div>
                            </div>
                            <button 
                              onClick={() => {
                                setEditTestForm({
                                  testId: test.id,
                                  start: test.assignment_start_time ? new Date(new Date(test.assignment_start_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
                                  end: test.assignment_end_time ? new Date(new Date(test.assignment_end_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""
                                });
                                setIsEditTestOpen(true);
                              }}
                              className="px-3 py-2 rounded-lg font-bold text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all flex items-center gap-2"
                            >
                              <Edit2 size={16} /> Edit Access
                            </button>
                            <button 
                              onClick={() => handleUnassignTest(test.assignment_id)}
                              className="px-3 py-2 rounded-lg font-bold text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-2"
                            >
                              <UserX size={16} /> Unassign
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              if (hasSubmitted) {
                                router.push(`/student/tests/${test.id}/result`);
                              } else if (status === 'Active') {
                                router.push(`/student/tests/${test.id}/take`);
                              }
                            }}
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${btnClass}`}
                          >
                            {btnText}
                          </button>
                        )}
                      </div>
                    </div>
                    )
                  });
                  })()}
                </div>
              </div>
            )}

            {/* ANNOUNCEMENTS TAB */}
            {activeTab === "announcement" && (
              <div className="bg-white border border-border p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">All Announcements</h2>
                <div className="space-y-4">
                  {announcements.length > 0 ? announcements.map(ann => (
                    <div key={ann.id} className="border border-border p-5 rounded-xl hover:border-blue-200 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg shrink-0 flex flex-col items-center justify-center text-blue-600">
                            <Megaphone size={18} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-800">{ann.title}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-md">{new Date(ann.created_at).toLocaleDateString()}</span>
                          {userRole === 'admin' && (
                            <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                              <Trash size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm mt-3 pt-3 border-t border-slate-100 leading-relaxed whitespace-pre-wrap">{ann.message}</p>
                      
                      {ann.link_url && (
                        <div className="mt-4">
                          <a 
                            href={ann.link_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <ExternalLink size={16} />
                            Open Attachment
                          </a>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-10 border border-dashed border-border rounded-xl">
                      <Megaphone size={48} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">No announcements yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === "attendance" && (
              <div className="bg-white border border-border p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">Attendance Record</h2>
                
                {(() => {
                  const isAdminOverview = userRole === 'admin' && !selectedStudentId;
                  
                  const displayedRecords = userRole === 'admin' && selectedStudentId 
                    ? attendanceRecords.filter((r: any) => r.student_id === selectedStudentId) 
                    : attendanceRecords;

                  const total = displayedRecords.length;
                  const present = displayedRecords.filter((r: any) => r.status === 'present').length;
                  const absent = displayedRecords.filter((r: any) => r.status === 'absent').length;
                  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                  
                  const uniqueClassDates = Array.from(new Set(attendanceRecords.map((r: any) => r.date)));
                  
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
                        {isAdminOverview ? (
                          <div className="bg-blue-50 p-2 sm:p-4 rounded-xl border border-blue-100 flex flex-col items-center text-center col-span-3">
                            <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total Classes Held</p>
                            <p className="text-xl sm:text-3xl font-extrabold text-blue-700">{uniqueClassDates.length}</p>
                          </div>
                        ) : (
                          <>
                            <div className="bg-slate-50 p-2 sm:p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 leading-tight">Total Classes</p>
                              <p className="text-xl sm:text-3xl font-extrabold text-slate-800">{total}</p>
                            </div>
                            <div className="bg-green-50 p-2 sm:p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center text-center">
                              <p className="text-[10px] sm:text-xs font-bold text-green-600 uppercase tracking-wider mb-1 leading-tight">Attended</p>
                              <p className="text-xl sm:text-3xl font-extrabold text-green-700">{present}</p>
                            </div>
                            <div className="bg-red-50 p-2 sm:p-4 rounded-xl border border-red-100 flex flex-col items-center justify-center text-center">
                              <p className="text-[10px] sm:text-xs font-bold text-red-600 uppercase tracking-wider mb-1 leading-tight">Absent</p>
                              <p className="text-xl sm:text-3xl font-extrabold text-red-700">{absent}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {total === 0 ? (
                        <div className="border border-border rounded-xl p-6 text-center text-slate-500">
                          <UserCheck size={48} className="mx-auto text-slate-300 mb-4" />
                          <p className="text-sm font-medium">No attendance records yet.</p>
                          <p className="text-xs mt-1">Attendance data will appear here.</p>
                        </div>
                      ) : (
                        <div>
                           {userRole === 'admin' ? (
                             <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                               <div className="flex flex-col gap-1">
                                 <p className="text-sm font-medium">
                                   {selectedStudentId 
                                     ? <span>Student attendance is <span className={`font-bold ${percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>{percentage}%</span></span>
                                     : <span>Overview of <span className="font-bold text-slate-800">{uniqueClassDates.length} Classes</span></span>
                                   }
                                 </p>
                                 {selectedStudentId && (
                                   <button 
                                     onClick={() => setSelectedStudentId(null)}
                                     className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 w-max"
                                   >
                                     <ArrowLeft size={12} /> Back to all students
                                   </button>
                                 )}
                               </div>
                             </div>
                          ) : (
                             <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                               <p className="text-sm font-medium">Your overall attendance is <span className={`font-bold ${percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>{percentage}%</span></p>
                             </div>
                          )}
                          <div className="space-y-3">
                            {isAdminOverview ? (
                              batchDetails?.batch_students?.map((bs: any) => {
                                const stId = bs.student_id;
                                const stRecords = attendanceRecords.filter((r: any) => r.student_id === stId);
                                const stPresent = stRecords.filter((r: any) => r.status === 'present').length;
                                const stTotal = stRecords.length;
                                const stPercentage = stTotal > 0 ? Math.round((stPresent / stTotal) * 100) : 0;
                                const stUser = bs.users || {};
                                
                                return (
                                  <div key={stId} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-200 transition-colors cursor-pointer" onClick={() => setSelectedStudentId(stId)}>
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                                        {stUser.full_name ? stUser.full_name[0].toUpperCase() : 'U'}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="font-bold text-slate-800">{stUser.full_name || 'Unknown Student'}</span>
                                        <span className="text-xs text-slate-500 font-medium">{stTotal} Classes Recorded</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-right hidden sm:block">
                                        <div className="text-sm font-semibold text-slate-700">{stPresent} Present</div>
                                        <div className="text-xs text-slate-500">{stTotal - stPresent} Absent</div>
                                      </div>
                                      <span className={`text-sm font-bold px-3 py-1.5 rounded-lg shrink-0 ${stPercentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {stPercentage}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              displayedRecords.map((record: any, i: number) => (
                                <div key={record.id || i} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-slate-400 shrink-0" />
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                      <span className="font-semibold text-slate-700 whitespace-nowrap">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      {userRole === 'admin' && record.users && (
                                        <button 
                                          onClick={() => setSelectedStudentId(record.student_id)}
                                          title="Click to view this student's attendance"
                                          className="text-sm text-slate-600 font-medium bg-white hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-1 sm:mt-0 transition-colors cursor-pointer text-left"
                                        >
                                          👤 {record.users.full_name || 'Unknown Student'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full shrink-0 ${record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {record.status}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Edit Batch Modal */}
      {isEditBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Edit Batch Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Batch Name</label>
                <input 
                  type="text" 
                  value={editBatchForm.name} 
                  onChange={e => setEditBatchForm({...editBatchForm, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea 
                  value={editBatchForm.description} 
                  onChange={e => setEditBatchForm({...editBatchForm, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Course</label>
                <input 
                  type="text" 
                  value={editBatchForm.course} 
                  onChange={e => setEditBatchForm({...editBatchForm, course: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
                <input 
                  type="text" 
                  value={editBatchForm.subject} 
                  onChange={e => setEditBatchForm({...editBatchForm, subject: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditBatchOpen(false)}
                className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditBatchSave}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {isAddClassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Add Class ({activeDay})</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time</label>
                  <div className="flex gap-2">
                    <select value={addClassForm.startHour} onChange={e => setAddClassForm({...addClassForm, startHour: e.target.value})} className="w-16 border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-center bg-white cursor-pointer hover:bg-slate-50">
                      {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="self-center font-bold text-slate-500">:</span>
                    <select value={addClassForm.startMin} onChange={e => setAddClassForm({...addClassForm, startMin: e.target.value})} className="w-16 border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-center bg-white cursor-pointer hover:bg-slate-50">
                      {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={addClassForm.startAmPm} onChange={e => setAddClassForm({...addClassForm, startAmPm: e.target.value})} className="flex-1 border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold bg-white cursor-pointer hover:bg-slate-50">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">End Time</label>
                  <div className="flex gap-2">
                    <select value={addClassForm.endHour} onChange={e => setAddClassForm({...addClassForm, endHour: e.target.value})} className="w-16 border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-center bg-white cursor-pointer hover:bg-slate-50">
                      {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="self-center font-bold text-slate-500">:</span>
                    <select value={addClassForm.endMin} onChange={e => setAddClassForm({...addClassForm, endMin: e.target.value})} className="w-16 border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-center bg-white cursor-pointer hover:bg-slate-50">
                      {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={addClassForm.endAmPm} onChange={e => setAddClassForm({...addClassForm, endAmPm: e.target.value})} className="flex-1 border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold bg-white cursor-pointer hover:bg-slate-50">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Subject / Topic</label>
                <input 
                  type="text" 
                  placeholder="e.g. Physics Chapter 1"
                  value={addClassForm.subject} 
                  onChange={e => setAddClassForm({...addClassForm, subject: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAddClassOpen(false)}
                className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddClassSave}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add Class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Modal */}
      {isEditTestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Edit Test Access Time</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time</label>
                <input 
                  type="datetime-local" 
                  value={editTestForm.start} 
                  onChange={e => setEditTestForm({...editTestForm, start: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <p className="text-[10px] text-slate-500 mt-1">Leave empty for "Now"</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">End Time</label>
                <input 
                  type="datetime-local" 
                  value={editTestForm.end} 
                  onChange={e => setEditTestForm({...editTestForm, end: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <p className="text-[10px] text-slate-500 mt-1">Leave empty for "Never (No deadline)"</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditTestOpen(false)}
                className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditTestSave}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
