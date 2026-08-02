"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Video, Film, FileText, Download, LayoutDashboard, Calendar, Clock, Lock, CheckCircle2, ChevronRight, PlayCircle, BarChart, FileQuestion, X, Maximize, Minimize, Info, FolderOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";
import LivePlayer from "@/components/LivePlayer";
import { supabase } from "@/lib/supabase";
import { getRecordedClasses, getCourseMaterials, getCourseFolders } from "@/actions/courseContent";
import { getLiveClassesForCourse } from "@/actions/liveClasses";
import { getCourseTests } from "@/actions/courseTests";

const formatDuration = (duration: any) => {
  if (!duration || duration === "0" || duration === "00:00:00") return null;
  if (typeof duration === "number" || !isNaN(Number(duration))) return `${duration} mins`;
  const parts = String(duration).split(":");
  if (parts.length === 3) {
    const h = parseInt(parts[0]); const m = parseInt(parts[1]); const s = parseInt(parts[2]);
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
  const [activeTab, setActiveTab] = useState<'live'|'recorded'|'tests'|'study_material'|'about'>('live');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  
  const [course, setCourse] = useState<any>(null);
  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [recordedClasses, setRecordedClasses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  // Player state
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [watermark, setWatermark] = useState({ show: false, top: '20%', left: '10%' });
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    try {
      if (!isFullscreen) {
        if (playerContainerRef.current?.requestFullscreen) {
          playerContainerRef.current.requestFullscreen().catch(err => {
            // Silently ignore native fullscreen errors since we have a CSS fallback
          });
        }
        setIsFullscreen(true);
        if ((window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'FULLSCREEN', value: true }));
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
        if ((window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'FULLSCREEN', value: false }));
        }
      }
    } catch (error) {
      // Silently catch error to prevent Next.js dev overlay
      const nextState = !isFullscreen;
      setIsFullscreen(nextState);
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'FULLSCREEN', value: nextState }));
      }
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
      }, 2000);
    }, 7000);
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
          getLiveClassesForCourse(courseId as string).then(setLiveClasses);
          getRecordedClasses(courseId as string).then(setRecordedClasses);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [courseId]);

  const fetchData = async () => {
    setLoading(true);
    let userId = null;
    const match = document.cookie.match(/(^| )user_id=([^;]+)/);
    if (match) { userId = match[2]; } 
    else { userId = "11111111-1111-1111-1111-111111111111"; } // Fallback

    const { data: userData } = await supabase.from('users').select('full_name, phone').eq('id', userId).single();
    setStudentProfile(userData);

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

    const [live, rec, mat, cTests, flds] = await Promise.all([
      getLiveClassesForCourse(courseId as string),
      getRecordedClasses(courseId as string),
      getCourseMaterials(courseId as string),
      getCourseTests(courseId as string, userId),
      getCourseFolders(courseId as string)
    ]);
    
    setLiveClasses(live); setRecordedClasses(rec); setMaterials(mat); setTests(cTests); setFolders(flds);
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

  const renderVideos = (items: any[]) => {
    if (items.length === 0) return (
      <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <Film size={36} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-700">No videos available</h3>
      </div>
    );
    return (
      <div className="flex flex-col gap-4">
        {items.map((cls) => {
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
            <div key={cls.id} onClick={() => setActiveVideoUrl(cls.meeting_link || cls.video_url)} className={`bg-white rounded-xl border ${isActive ? 'border-rose-400 ring-2 ring-rose-50 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5'} p-2.5 sm:p-3 flex items-start gap-3 sm:gap-4 cursor-pointer transition-all duration-300 group overflow-hidden`}>
              <div className="relative w-28 sm:w-36 aspect-video shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group-hover:border-rose-200 transition-colors">
                {ytId ? (
                  <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><Film size={24} /></div>
                )}
                {formatDuration(cls.duration_mins) && (
                  <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {formatDuration(cls.duration_mins)}
                  </div>
                )}
                <div className={`absolute inset-0 flex items-center justify-center ${isActive ? 'bg-black/40' : 'bg-black/10 group-hover:bg-black/30'} transition-all`}>
                  {isActive ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg animate-pulse"><PlayCircle size={18} /></div>
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 text-slate-800 flex items-center justify-center shadow-md transform scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"><PlayCircle size={18} className="ml-0.5" /></div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 py-1">
                <h3 className={`font-bold text-sm sm:text-[15px] line-clamp-2 leading-tight ${isActive ? 'text-rose-700' : 'text-slate-800'}`}>{cls.title}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 font-medium">{new Date(cls.class_date).toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMaterials = (items: any[]) => {
    if (items.length === 0) return (
      <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <FileText size={36} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-700">No materials available</h3>
      </div>
    );
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(mat => (
          <a key={mat.id} href={mat.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-amber-300 hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 line-clamp-1 text-sm">{mat.title}</h4>
              <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">{mat.type || 'Document'}</p>
            </div>
            <Download size={18} className="text-slate-300 group-hover:text-amber-500 shrink-0" />
          </a>
        ))}
      </div>
    );
  };

  const renderTests = (items: any[]) => {
    if (items.length === 0) return (
      <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <FileQuestion size={36} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-700">No tests available</h3>
      </div>
    );
    return (
      <div className="flex flex-col gap-4">
        {items.map(testAssignment => {
          const t = testAssignment.tests;
          const attemptCount = testAssignment.attempts_count || 0;
          const maxAttempts = testAssignment.max_attempts;
          const canAttempt = attemptCount < maxAttempts;

          return (
            <div key={testAssignment.id} className="group relative bg-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-indigo-100 transition-all duration-300">
              
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                  <FileQuestion size={22} strokeWidth={2} />
                </div>
                
                <div>
                  <h3 className="font-bold text-slate-800 text-base sm:text-lg tracking-tight mb-1">{t?.title}</h3>
                  <div className="flex gap-3 text-[13px] font-medium text-slate-500">
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400"/> {t?.duration_minutes || 0}m</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-slate-400"/> {t?.total_marks || 0} pts</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full sm:w-auto mt-2 sm:mt-0">
                {canAttempt ? (
                  <Link href={`/student/tests/${t?.id}/take?courseId=${courseId}`} className="w-full sm:w-auto bg-slate-900 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md text-sm">
                    Start Test
                    <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded ml-1">
                      {attemptCount}/{maxAttempts}
                    </span>
                  </Link>
                ) : (
                  <button disabled className="w-full sm:w-auto bg-slate-50 text-slate-400 px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200 text-sm">
                    <Lock size={14} /> Completed
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getNavButtonClass = (tabName: string, colorClass: string) => {
    return `flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === tabName ? colorClass : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`;
  };

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
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm lg:sticky top-24 -mx-4 lg:-mx-0 px-4 overflow-x-auto no-scrollbar">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-2 hidden lg:block">Navigation</h3>
            <nav className="flex flex-row lg:flex-col gap-2 min-w-max lg:min-w-0 pb-1 lg:pb-0">
              <button onClick={() => {setActiveTab('live');}} className={getNavButtonClass('live', 'bg-blue-600 text-white shadow-md shadow-blue-200')}>
                <div className="flex items-center gap-3"><Video size={18} /> Live Classes</div>
                {activeTab === 'live' && <ChevronRight size={16} className="hidden lg:block" />}
              </button>
              <button onClick={() => {setActiveTab('recorded');}} className={getNavButtonClass('recorded', 'bg-rose-600 text-white shadow-md shadow-rose-200')}>
                <div className="flex items-center gap-3"><Film size={18} /> Recorded</div>
                {activeTab === 'recorded' && <ChevronRight size={16} className="hidden lg:block" />}
              </button>
              <button onClick={() => {setActiveTab('tests');}} className={getNavButtonClass('tests', 'bg-emerald-600 text-white shadow-md shadow-emerald-200')}>
                <div className="flex items-center gap-3"><FileQuestion size={18} /> Tests</div>
                {activeTab === 'tests' && <ChevronRight size={16} className="hidden lg:block" />}
              </button>
              <button onClick={() => {setActiveTab('study_material'); setActiveFolder(null);}} className={getNavButtonClass('study_material', 'bg-amber-500 text-white shadow-md shadow-amber-200')}>
                <div className="flex items-center gap-3"><FolderOpen size={18} /> Study Material</div>
                {activeTab === 'study_material' && <ChevronRight size={16} className="hidden lg:block" />}
              </button>
              <button onClick={() => {setActiveTab('about');}} className={getNavButtonClass('about', 'bg-purple-600 text-white shadow-md shadow-purple-200')}>
                <div className="flex items-center gap-3"><Info size={18} /> About Course</div>
                {activeTab === 'about' && <ChevronRight size={16} className="hidden lg:block" />}
              </button>
            </nav>
          </div>
        </aside>

        {/* COLUMN 2: MAIN CONTENT AREA */}
        <main className={`lg:col-span-4 min-h-[70vh] ${activeTab === 'about' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-slate-200/80 shadow-sm p-6 md:p-8 h-full">
            
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
                      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{cls.title || cls.topic}</h3>
                      <div className="space-y-1.5 mb-6 mt-auto">
                        <p className="text-sm text-slate-600 font-medium flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-lg w-max"><Calendar size={14} className="text-blue-500"/> {new Date(cls.scheduled_time || cls.start_time).toLocaleDateString('en-GB')}</p>
                        <p className="text-sm text-slate-600 font-medium flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-lg w-max"><Clock size={14} className="text-blue-500"/> {new Date(cls.scheduled_time || cls.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
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

            {/* RECORDED TAB */}
            {activeTab === 'recorded' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Recorded Library</h2>
                  <p className="text-slate-500 mt-1 font-medium">Watch previous sessions at your own pace.</p>
                </div>
                {renderVideos(recordedClasses.filter(r => !r.folder_id))}
              </div>
            )}

            {/* TESTS TAB */}
            {activeTab === 'tests' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Assessments & Quizzes</h2>
                  <p className="text-slate-500 mt-1 font-medium">Test your knowledge with these assigned mock exams.</p>
                </div>
                {renderTests(tests.filter(t => !t.folder_id))}
              </div>
            )}

            {/* STUDY MATERIAL (Folders) */}
            {activeTab === 'study_material' && (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                {activeFolder === null ? (
                  <>
                    <div className="mb-8">
                      <h2 className="text-2xl font-black text-slate-900">Study Material</h2>
                      <p className="text-slate-500 mt-1 font-medium">Explore categorized folders and root study resources.</p>
                    </div>
                    
                    {folders.length > 0 && (
                      <div className="mb-10">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                          {folders.map((folder, index) => {
                            const itemsCount = recordedClasses.filter(r => r.folder_id === folder.id).length 
                                             + materials.filter(m => m.folder_id === folder.id).length
                                             + tests.filter(t => t.folder_id === folder.id).length;
                            // Using a consistent gradient array for visual variety
                            const gradients = [
                              'from-indigo-500 via-purple-500 to-pink-500',
                              'from-blue-500 via-cyan-500 to-teal-400',
                              'from-orange-400 via-rose-500 to-pink-500',
                              'from-fuchsia-500 via-purple-600 to-indigo-600',
                              'from-emerald-400 via-teal-500 to-cyan-500'
                            ];
                            const bgGradient = gradients[index % gradients.length];
                            
                            return (
                              <div key={folder.id} onClick={() => setActiveFolder(folder.id)} className="group cursor-pointer">
                                <div className={`relative h-44 w-full rounded-[2rem] bg-gradient-to-br ${bgGradient} p-5 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-${bgGradient.split('-')[1]}-500/30 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between`}>
                                  
                                  {/* Glass overlay */}
                                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  
                                  {/* Top Icon Area */}
                                  <div className="relative z-10 flex justify-between items-start">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner border border-white/20">
                                      <FolderOpen size={24} strokeWidth={2} />
                                    </div>
                                    <span className="bg-black/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                                      {itemsCount} {itemsCount === 1 ? 'Item' : 'Items'}
                                    </span>
                                  </div>
                                  
                                  {/* Bottom Title Area */}
                                  <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-inner">
                                    <h3 className="font-bold text-white text-base tracking-tight line-clamp-1 group-hover:text-white/90">
                                      {folder.name}
                                    </h3>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {materials.filter(m => !m.folder_id).length > 0 && (
                      <div className="mt-8 border-t border-slate-100 pt-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Direct Documents</h3>
                        {renderMaterials(materials.filter(m => !m.folder_id))}
                      </div>
                    )}

                    {folders.length === 0 && materials.filter(m => !m.folder_id).length === 0 && (
                      <div className="py-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                         <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
                         <h3 className="text-lg font-bold text-slate-700">No Study Materials</h3>
                         <p className="text-sm text-slate-500 mt-1">Check back later for new folders or resources.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                      <button onClick={() => setActiveFolder(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                        <ChevronLeft size={20} /> 
                      </button>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                          <FolderOpen className="text-amber-500" size={28} /> {folders.find(f => f.id === activeFolder)?.name}
                        </h2>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* VIDEOS */}
                      {recordedClasses.filter(r => r.folder_id === activeFolder).length > 0 && (
                        <div>
                          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Film size={18} className="text-rose-500" /> Video Lessons</h3>
                          {renderVideos(recordedClasses.filter(r => r.folder_id === activeFolder))}
                        </div>
                      )}

                      {/* MATERIALS */}
                      {materials.filter(m => m.folder_id === activeFolder).length > 0 && (
                        <div>
                          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><FileText size={18} className="text-amber-500" /> Study Materials</h3>
                          {renderMaterials(materials.filter(m => m.folder_id === activeFolder))}
                        </div>
                      )}

                      {/* TESTS */}
                      {tests.filter(t => t.folder_id === activeFolder).length > 0 && (
                        <div>
                          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><FileQuestion size={18} className="text-emerald-500" /> Tests & Assessments</h3>
                          {renderTests(tests.filter(t => t.folder_id === activeFolder))}
                        </div>
                      )}

                      {recordedClasses.filter(r => r.folder_id === activeFolder).length === 0 &&
                       materials.filter(m => m.folder_id === activeFolder).length === 0 &&
                       tests.filter(t => t.folder_id === activeFolder).length === 0 && (
                         <div className="py-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                            <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700">This folder is empty</h3>
                         </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ABOUT COURSE TAB */}
            {activeTab === 'about' && (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900">About Course</h2>
                  <p className="text-slate-500 mt-1 font-medium">Your course enrollment details.</p>
                </div>
                <div className="bg-white/80 rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden max-w-sm">
                  <div className="h-40 bg-slate-100 relative">
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
                          <Calendar size={14} className="text-blue-500"/> {enrollmentDate}
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
                        <p className="font-black text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 text-lg">
                          {course.is_free ? 'FREE' : `₹${purchase.amount_paid ?? course.price}`}
                        </p>
                      </div>
                    </div>

                    {(!course.is_free && purchase.razorpay_order_id) && (
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <button 
                          onClick={handleDownloadInvoice} 
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg text-sm"
                        >
                          <Download size={16} /> Download Invoice
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </main>

      </div>

      {/* SECURE VOD MODAL */}
      {activeVideoUrl && (
        <div className={`fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300 ${isFullscreen ? 'p-0' : 'p-4 lg:p-12'}`}>
          <div 
            ref={playerContainerRef}
            className={`bg-black overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300 ${isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-5xl aspect-video rounded-3xl border border-white/20 shadow-2xl'}`}
          >
            {/* Tag / Indicator (Top Left) */}
            <div className="absolute top-0 left-0 p-4 z-50 pointer-events-none">
              <div className="pointer-events-auto bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <Film size={14} className="text-rose-500" />
                <span className="text-white text-xs font-bold tracking-wider uppercase">Recorded Session</span>
              </div>
            </div>

            {/* Controls (Right Center) */}
            <div className="absolute top-1/2 right-4 -translate-y-1/2 z-50 flex flex-col gap-3 pointer-events-none">
              <button 
                onClick={toggleFullscreen}
                className="pointer-events-auto w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow-lg"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
              <button 
                onClick={() => {
                  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                  if (isFullscreen) {
                    setIsFullscreen(false);
                    if ((window as any).ReactNativeWebView) {
                      (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'FULLSCREEN', value: false }));
                    }
                  }
                  setActiveVideoUrl(null);
                }}
                className="pointer-events-auto w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow-lg"
              >
                <X size={18} />
              </button>
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
