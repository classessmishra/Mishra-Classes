"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Video, Film, FileText, Download, LayoutDashboard, Calendar, Clock, Lock, CheckCircle2, ChevronRight, PlayCircle, BarChart, FileQuestion, X, Maximize, Minimize, Info } from "lucide-react";
import Link from "next/link";
import LivePlayer from "@/components/LivePlayer";
import { supabase } from "@/lib/supabase";
import { getRecordedClasses, getCourseMaterials } from "@/actions/courseContent";
import { getLiveClassesForCourse } from "@/actions/liveClasses";
import { getCourseTests } from "@/actions/courseTests";

const formatDuration = (duration: any) => {
  if (!duration || duration === "0" || duration === "00:00:00") return null;
  if (typeof duration === "number" || !isNaN(Number(duration))) return `${duration} mins`;
  
  const parts = String(duration).split(":");
  if (parts.length === 3) {
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const s = parseInt(parts[2]);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  } else if (parts.length === 2) {
    return `${parseInt(parts[0])}m ${parseInt(parts[1])}s`;
  }
  return `${duration} mins`;
};

export default function StudentStudyRoom() {
  const { courseId } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview'|'live'|'recorded'|'materials'|'tests'|'details'>('live');
  const [course, setCourse] = useState<any>(null);
  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [recordedClasses, setRecordedClasses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]); // Placeholder for tests
  const [studentProfile, setStudentProfile] = useState<any>(null);

  // Player state
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [watermark, setWatermark] = useState({ show: false, top: '20%', left: '10%' });
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    if (!activeVideoUrl) return;
    
    const interval = setInterval(() => {
      setWatermark({
        show: true,
        top: `${Math.floor(Math.random() * 80) + 10}%`,
        left: `${Math.floor(Math.random() * 80) + 10}%`
      });
      
      setTimeout(() => {
        setWatermark(prev => ({ ...prev, show: false }));
      }, 2000); // Hide after 2 seconds
      
    }, 7000); // Repeat every 7 seconds
    
    return () => clearInterval(interval);
  }, [activeVideoUrl]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`course_live_classes_${courseId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_classes', filter: `course_id=eq.${courseId}` },
        () => {
          // Re-fetch live classes and recorded classes when any change happens
          getLiveClassesForCourse(courseId as string).then(setLiveClasses);
          getRecordedClasses(courseId as string).then(setRecordedClasses);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId]);

  const fetchData = async () => {
    setLoading(true);
    let userId = null;
    const match = document.cookie.match(/(^| )user_id=([^;]+)/);
    if (match) {
      userId = match[2];
    } else {
      userId = "11111111-1111-1111-1111-111111111111"; // Fallback
    }

    const { data: userData } = await supabase.from('users').select('full_name, phone').eq('id', userId).single();
    setStudentProfile(userData);

    // Check if purchased
    const { data: purchaseData } = await supabase
      .from('purchases')
      .select('*, courses(*)')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .single();

    if (!purchaseData) {
      alert("You have not purchased this course.");
      router.push("/student");
      return;
    }

    setPurchase(purchaseData);
    setCourse(purchaseData.courses);

    const [live, rec, mat, cTests] = await Promise.all([
      getLiveClassesForCourse(courseId as string),
      getRecordedClasses(courseId as string),
      getCourseMaterials(courseId as string),
      getCourseTests(courseId as string, userId)
    ]);
    
    setLiveClasses(live);
    setRecordedClasses(rec);
    setMaterials(mat);
    setTests(cTests);
    setLoading(false);
  };

  const handleDownloadInvoice = () => {
    if (purchase?.razorpay_order_id) {
      window.open(`/student/invoice/${purchase.razorpay_order_id}`, '_blank');
    } else {
      alert("No invoice found for this purchase.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Entering Study Room...</p>
        </div>
      </div>
    );
  }

  const enrollmentDate = new Date(purchase.created_at).toLocaleDateString('en-GB');
  const validTillDate = purchase.expires_at 
    ? new Date(purchase.expires_at).toLocaleDateString('en-GB') 
    : new Date(Date.now() + (course.validity_days || 365) * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/student" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-black text-slate-900 hidden sm:block">
              {course?.title} <span className="font-normal text-slate-400 text-sm ml-2">| Premium Study Room</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full flex items-center gap-2 border border-indigo-100 shadow-inner">
              <CheckCircle2 size={16} /> Actively Enrolled
            </span>
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* COLUMN 1: LEFT SIDEBAR NAVIGATION (20%) */}
        <aside className="lg:col-span-1 flex flex-col gap-2">
          <div className="bg-white/80 lg:backdrop-blur-lg lg:rounded-2xl lg:border lg:border-slate-200/60 p-2 lg:p-4 shadow-sm lg:sticky top-24 -mx-4 lg:-mx-0 px-4 overflow-x-auto no-scrollbar">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-2 hidden lg:block">Navigation</h3>
            <nav className="flex flex-row lg:flex-col gap-2 min-w-max lg:min-w-0 pb-1 lg:pb-0">
              <button 
                onClick={() => setActiveTab('live')}
                className={`flex items-center justify-center lg:justify-between px-4 py-2.5 lg:py-3 rounded-full lg:rounded-xl font-bold text-sm transition-all ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 lg:bg-transparent text-slate-600 hover:bg-slate-200'}`}
              >
                <div className="flex items-center gap-2"><Video size={16} className="lg:w-[18px] lg:h-[18px]" /> Live Classes</div>
                {activeTab === 'live' && <ChevronRight size={16} className="opacity-70 hidden lg:block" />}
              </button>
              <button 
                onClick={() => setActiveTab('recorded')}
                className={`flex items-center justify-center lg:justify-between px-4 py-2.5 lg:py-3 rounded-full lg:rounded-xl font-bold text-sm transition-all ${activeTab === 'recorded' ? 'bg-rose-600 text-white shadow-md shadow-rose-200' : 'bg-slate-100 lg:bg-transparent text-slate-600 hover:bg-slate-200'}`}
              >
                <div className="flex items-center gap-2"><Film size={16} className="lg:w-[18px] lg:h-[18px]" /> Recordings</div>
                {activeTab === 'recorded' && <ChevronRight size={16} className="opacity-70 hidden lg:block" />}
              </button>
              <button 
                onClick={() => setActiveTab('materials')}
                className={`flex items-center justify-center lg:justify-between px-4 py-2.5 lg:py-3 rounded-full lg:rounded-xl font-bold text-sm transition-all ${activeTab === 'materials' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-slate-100 lg:bg-transparent text-slate-600 hover:bg-slate-200'}`}
              >
                <div className="flex items-center gap-2"><FileText size={16} className="lg:w-[18px] lg:h-[18px]" /> Materials</div>
                {activeTab === 'materials' && <ChevronRight size={16} className="opacity-70 hidden lg:block" />}
              </button>
              <button 
                onClick={() => setActiveTab('tests')}
                className={`flex items-center justify-center lg:justify-between px-4 py-2.5 lg:py-3 rounded-full lg:rounded-xl font-bold text-sm transition-all ${activeTab === 'tests' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 lg:bg-transparent text-slate-600 hover:bg-slate-200'}`}
              >
                <div className="flex items-center gap-2"><FileQuestion size={16} className="lg:w-[18px] lg:h-[18px]" /> Tests</div>
                {activeTab === 'tests' && <ChevronRight size={16} className="opacity-70 hidden lg:block" />}
              </button>
              <button 
                onClick={() => setActiveTab('details')}
                className={`lg:hidden flex items-center justify-center lg:justify-between px-4 py-2.5 lg:py-3 rounded-full lg:rounded-xl font-bold text-sm transition-all ${activeTab === 'details' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-slate-100 lg:bg-transparent text-slate-600 hover:bg-slate-200'}`}
              >
                <div className="flex items-center gap-2"><Info size={16} className="lg:w-[18px] lg:h-[18px]" /> Details</div>
              </button>
            </nav>
          </div>
        </aside>

        {/* COLUMN 2: MAIN CONTENT AREA (60%) */}
        <main className={`lg:col-span-3 min-h-[70vh] ${activeTab === 'details' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-slate-200/80 shadow-sm p-6 md:p-8 h-full">
            
            {/* OVERVIEW TAB REMOVED */}

            {/* LIVE CLASSES TAB */}
            {activeTab === 'live' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900">Upcoming Live Sessions</h2>
                  <p className="text-sm lg:text-base text-slate-500 mt-1 font-medium">Join your scheduled interactive classes here.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveClasses.map(cls => (
                    <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col shadow-sm hover:shadow-lg transition-all hover:border-blue-300 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -z-10"></div>
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Video size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{cls.title}</h3>
                      <div className="space-y-1.5 mb-6 mt-auto">
                        <p className="text-sm text-slate-600 font-medium flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-lg w-max"><Calendar size={14} className="text-blue-500"/> {new Date(cls.scheduled_time).toLocaleDateString('en-GB')}</p>
                        <p className="text-sm text-slate-600 font-medium flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-lg w-max"><Clock size={14} className="text-blue-500"/> {new Date(cls.scheduled_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                      </div>
                      <Link href={`/student/live-class/${cls.id}`} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                        Join Class <ArrowLeft size={16} className="rotate-135" />
                      </Link>
                    </div>
                  ))}
                  {liveClasses.length === 0 && (
                    <div className="col-span-full py-10 lg:py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <Video size={36} className="mx-auto text-slate-300 mb-3" />
                      <h3 className="text-base lg:text-lg font-bold text-slate-700">No upcoming sessions</h3>
                      <p className="text-xs lg:text-sm text-slate-500 max-w-[250px] mx-auto mt-1">Your instructor hasn't scheduled any live classes yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RECORDED CLASSES TAB */}
            {activeTab === 'recorded' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Recorded Library</h2>
                  <p className="text-slate-500 mt-1 font-medium">Watch previous sessions at your own pace.</p>
                </div>

                <div className="space-y-4">
                  {recordedClasses.map((cls) => {
                    const ytId = (() => {
                      const urlOrId = cls.meeting_link || cls.video_url;
                      if (!urlOrId) return null;
                      if (urlOrId.length === 11 && !urlOrId.includes("/") && !urlOrId.includes(".")) return urlOrId;
                      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
                      const match = String(urlOrId).match(regExp);
                      return (match && match[2].length === 11) ? match[2] : null;
                    })();
                    
                    const isActive = activeVideoUrl === cls.meeting_link || activeVideoUrl === cls.video_url;

                    return (
                      <div key={cls.id} 
                        onClick={() => setActiveVideoUrl(cls.meeting_link || cls.video_url)}
                        className={`bg-white rounded-2xl border ${isActive ? 'border-rose-400 ring-4 ring-rose-50 shadow-lg' : 'border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'} p-3 flex items-center gap-4 cursor-pointer transition-all duration-300 group relative overflow-hidden`}
                      >
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />}

                        {/* THUMBNAIL */}
                        <div className="relative w-32 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group-hover:border-rose-200 transition-colors">
                          {ytId ? (
                            <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                               <Film size={24} className="mb-1" />
                               <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">No Thumb</span>
                            </div>
                          )}
                          
                          {/* Duration Badge over thumbnail */}
                          {formatDuration(cls.duration_mins) && (
                            <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                              {formatDuration(cls.duration_mins)}
                            </div>
                          )}

                          {/* Play overlay */}
                          <div className={`absolute inset-0 flex items-center justify-center ${isActive ? 'bg-black/40' : 'bg-black/10 group-hover:bg-black/30'} transition-all`}>
                            {isActive ? (
                               <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/50 scale-100">
                                 <PlayCircle size={20} className="animate-pulse" />
                               </div>
                            ) : (
                               <div className="w-10 h-10 rounded-full bg-white/95 text-slate-800 flex items-center justify-center shadow-md transform scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                                 <PlayCircle size={20} className="ml-0.5" />
                               </div>
                            )}
                          </div>
                        </div>

                        {/* INFO */}
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`font-bold text-base line-clamp-2 ${isActive ? 'text-rose-700' : 'text-slate-800 group-hover:text-rose-600'} transition-colors`}>{cls.title}</h3>
                            {isActive && (
                              <span className="shrink-0 bg-rose-100 text-rose-700 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Playing
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-semibold">
                            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Calendar size={12} className="text-slate-400"/> {new Date(cls.class_date).toLocaleDateString('en-GB')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {recordedClasses.length === 0 && (
                    <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <Film size={40} className="mx-auto text-slate-300 mb-3" />
                      <h3 className="text-lg font-bold text-slate-700">No recordings available</h3>
                      <p className="text-sm text-slate-500">Recordings will appear here after live sessions conclude.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MATERIALS TAB */}
            {activeTab === 'materials' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Study Materials</h2>
                  <p className="text-slate-500 mt-1 font-medium">Download PDFs, notes, and class resources.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {materials.map(mat => (
                    <div key={mat.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col shadow-sm hover:shadow-lg transition-all hover:border-amber-300 group">
                      <div className="flex gap-4 items-start mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-200/50 shadow-inner">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight">{mat.title}</h3>
                          <span className="text-[10px] font-black tracking-wider uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded mt-2 inline-block shadow-sm">{mat.type || 'Document'}</span>
                        </div>
                      </div>
                      <a href={mat.file_url} target="_blank" rel="noreferrer" className="w-full bg-slate-50 hover:bg-amber-500 text-slate-700 hover:text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-200 hover:border-amber-500 mt-auto text-sm shadow-sm">
                        <Download size={16} /> View & Download
                      </a>
                    </div>
                  ))}
                  {materials.length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                      <h3 className="text-lg font-bold text-slate-700">No materials yet</h3>
                      <p className="text-sm text-slate-500">Study resources will be uploaded here by the instructor.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TESTS TAB */}
            {activeTab === 'tests' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Course Tests</h2>
                  <p className="text-slate-500 mt-1 font-medium">Evaluate your learning with mock tests and quizzes.</p>
                </div>

                {tests.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <FileQuestion size={40} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="text-lg font-bold text-slate-700">No tests assigned</h3>
                    <p className="text-sm text-slate-500">There are currently no active tests for this course.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tests.map(testAssignment => {
                      const t = testAssignment.tests;
                      const attemptCount = testAssignment.attempts_count || 0;
                      const maxAttempts = testAssignment.max_attempts;
                      const canAttempt = attemptCount < maxAttempts;

                      return (
                        <div key={testAssignment.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col shadow-sm hover:shadow-md transition-all">
                          <div className="flex gap-4 items-start mb-4">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                              <FileQuestion size={24} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-900 leading-tight">{t?.title}</h3>
                              <div className="flex gap-3 text-xs text-slate-500 mt-2 font-medium">
                                <span className="flex items-center gap-1"><Clock size={12}/> {t?.duration_minutes}m</span>
                                <span className="flex items-center gap-1"><CheckCircle2 size={12}/> {t?.total_marks} Marks</span>
                              </div>
                            </div>
                          </div>

                          {attemptCount > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Attempts ({attemptCount}/{maxAttempts})</h4>
                              <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                {testAssignment.submissions?.map((sub: any, idx: number) => (
                                  <div key={sub.id} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2 rounded-lg text-sm">
                                    <span className="text-slate-600 font-medium">Attempt {idx + 1}</span>
                                    <span className="font-bold text-slate-900">{sub.score !== null ? `${sub.score} / ${t?.total_marks}` : 'Evaluating'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {attemptCount === 0 && (
                            <p className="text-sm text-slate-500 mb-4 font-medium flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> You have {maxAttempts} attempts available.
                            </p>
                          )}

                          <div className="mt-auto">
                            {canAttempt ? (
                              <Link 
                                href={`/student/tests/${t?.id}/take?courseId=${courseId}`}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                              >
                                Attempt Now (Attempt {attemptCount + 1}/{maxAttempts})
                              </Link>
                            ) : (
                              <button disabled className="w-full bg-slate-100 text-slate-400 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200">
                                <Lock size={16} /> No attempts available
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </main>

        {/* COLUMN 3: RIGHT SIDEBAR COURSE INFO & INVOICE (20%) */}
        <aside className={`lg:col-span-1 ${activeTab === 'details' ? 'flex' : 'hidden lg:flex'} flex-col gap-4`}>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden sticky top-24">
            
            <div className="h-32 bg-slate-100 relative">
              <img src={course.thumbnail_url || "/images/course_thumb.png"} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-1 inline-block">Active Plan</span>
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="font-black text-slate-900 leading-tight mb-6 text-lg">{course.title}</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Enrolled On</p>
                  <p className="font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-500"/> {enrollmentDate}
                  </p>
                </div>
                
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Valid Till</p>
                  <p className="font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 flex items-center gap-2">
                    <Lock size={14} className="text-emerald-500"/> {validTillDate}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Amount Paid</p>
                  <p className="font-black text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 text-lg">
                    ₹{purchase.amount_paid ?? course.price}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <button 
                  onClick={handleDownloadInvoice} 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  <Download size={16} /> Download Invoice
                </button>
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* SECURE VOD MODAL */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
          <div 
            ref={playerContainerRef}
            className={`bg-black overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300 ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl aspect-video rounded-3xl border border-white/20 shadow-2xl'}`}
          >
            {/* Header / Controls */}
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-50 flex justify-between items-start p-4 pointer-events-none">
              <div className="pointer-events-auto bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <Film size={14} className="text-rose-500" />
                <span className="text-white text-xs font-bold tracking-wider uppercase">Recorded Session</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleFullscreen}
                  className="pointer-events-auto w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow-lg"
                >
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
                <button 
                  onClick={() => {
                    if (document.fullscreenElement) document.exitFullscreen();
                    setActiveVideoUrl(null);
                  }}
                  className="pointer-events-auto w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {/* Player Container */}
            <div className="flex-1 relative bg-black overflow-hidden select-none" onContextMenu={(e) => e.preventDefault()}>
              <LivePlayer 
                videoId={
                  (() => {
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                    const match = activeVideoUrl.match(regExp);
                    return (match && match[2].length === 11) ? match[2] : activeVideoUrl;
                  })()
                } 
                controls={true} 
              />
              
              {/* FLOATING WATERMARK */}
              {studentProfile && (
                <div 
                  className={`absolute text-white font-black uppercase tracking-widest whitespace-nowrap pointer-events-none z-50 mix-blend-difference drop-shadow-md transition-opacity duration-1000 ${watermark.show ? 'opacity-30' : 'opacity-0'}`}
                  style={{
                    top: watermark.top,
                    left: watermark.left,
                  }}
                >
                  <span className="text-[11px] md:text-xs">{studentProfile.full_name}</span> <br/>
                  <span className="text-[9px] md:text-[10px] opacity-80">{studentProfile.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
