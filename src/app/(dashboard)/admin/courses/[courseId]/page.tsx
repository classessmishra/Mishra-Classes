"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Video, Film, FileText, Plus, Trash2, Loader2, Link as LinkIcon, Clock, Calendar, FileQuestion } from "lucide-react";
import Link from "next/link";
import { getLiveClasses, createLiveClass, deleteLiveClass, getRecordedClasses, createRecordedClass, deleteRecordedClass, getCourseMaterials, createCourseMaterial, deleteCourseMaterial, uploadMaterialFile } from "@/actions/courseContent";
import { getCourseTests, getAllTests, assignTestToCourse, removeTestFromCourse } from "@/actions/courseTests";
import { getAllRecordedClassesGlobally, assignRecordingToCourse } from "@/actions/liveClasses";
import { supabase } from "@/lib/supabase";
import { UploadDropzone } from "@/utils/uploadthing";
import "@uploadthing/react/styles.css";

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

export default function CourseContentManager() {
  const { courseId } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'recorded'|'materials'|'tests'>('recorded');
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [recordedClasses, setRecordedClasses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  
  // Test states
  const [courseTests, setCourseTests] = useState<any[]>([]);
  const [allTests, setAllTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [testMaxAttempts, setTestMaxAttempts] = useState("5");

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Class Form
  const [liveTopic, setLiveTopic] = useState("");
  const [liveTime, setLiveTime] = useState("");
  const [liveLink, setLiveLink] = useState("");

  // Recorded Class Form
  const [recTitle, setRecTitle] = useState("");
  const [recUrl, setRecUrl] = useState("");
  const [recDuration, setRecDuration] = useState("");
  const [recDate, setRecDate] = useState("");

  // Material Form
  const [matTitle, setMatTitle] = useState("");
  const [isUploadMaterialModalOpen, setIsUploadMaterialModalOpen] = useState(false);

  const [isAddRecordingModalOpen, setIsAddRecordingModalOpen] = useState(false);
  const [globalRecordings, setGlobalRecordings] = useState<any[]>([]);
  const [assigningRecordingId, setAssigningRecordingId] = useState<string | null>(null);

  const handleOpenAddRecordingModal = async () => {
    setIsAddRecordingModalOpen(true);
    const recs = await getAllRecordedClassesGlobally();
    const uniqueRecsMap = new Map();
    recs.forEach((r: any) => {
      if (!uniqueRecsMap.has(r.meeting_link)) {
        uniqueRecsMap.set(r.meeting_link, r);
      }
    });
    setGlobalRecordings(Array.from(uniqueRecsMap.values()));
  };

  const handleAssignRecording = async (recordingId: string) => {
    setAssigningRecordingId(recordingId);
    try {
      await assignRecordingToCourse(recordingId, courseId as string);
      alert("Recording assigned successfully!");
      // refresh local list
      const rec = await getRecordedClasses(courseId as string);
      setRecordedClasses(rec);
      setIsAddRecordingModalOpen(false);
    } catch(err: any) {
      alert(err.message || "Failed to assign recording");
    } finally {
      setAssigningRecordingId(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch course details
    const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).single();
    setCourse(courseData);

    const [live, rec, mat, cTests, aTests] = await Promise.all([
      getLiveClasses(courseId as string),
      getRecordedClasses(courseId as string),
      getCourseMaterials(courseId as string),
      getCourseTests(courseId as string),
      getAllTests()
    ]);
    
    setLiveClasses(live);
    setRecordedClasses(rec);
    setMaterials(mat);
    setCourseTests(cTests);
    setAllTests(aTests);
    setLoading(false);
  };

  const handleAddLive = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createLiveClass({
        course_id: courseId,
        topic: liveTopic,
        start_time: new Date(liveTime).toISOString(),
        meeting_link: liveLink
      });
      setLiveTopic(""); setLiveTime(""); setLiveLink("");
      const live = await getLiveClasses(courseId as string);
      setLiveClasses(live);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRecorded = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createRecordedClass({
        course_id: courseId,
        title: recTitle,
        video_url: recUrl,
        duration_mins: parseInt(recDuration) || 0,
        class_date: new Date(recDate).toISOString()
      });
      setRecTitle(""); setRecUrl(""); setRecDuration(""); setRecDate("");
      const rec = await getRecordedClasses(courseId as string);
      setRecordedClasses(rec);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaterialUploadComplete = async (res: any[]) => {
    setIsSubmitting(true);
    try {
      const file = res[0];
      const fileType = file.name.split('.').pop()?.toLowerCase() || 'file';
      await createCourseMaterial({
        course_id: courseId,
        title: matTitle || file.name,
        file_url: file.url,
        type: fileType
      });
      
      setMatTitle("");
      setIsUploadMaterialModalOpen(false);
      const mat = await getCourseMaterials(courseId as string);
      setMaterials(mat);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId) return alert("Please select a test");
    setIsSubmitting(true);
    try {
      await assignTestToCourse(courseId as string, selectedTestId, parseInt(testMaxAttempts) || 5);
      setSelectedTestId(""); setTestMaxAttempts("5");
      setCourseTests(await getCourseTests(courseId as string));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/admin/courses" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Manage Content: {course?.title}</h1>
        <p className="text-slate-500 mt-1">Add and organize study materials, live sessions, and recordings for this course.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex flex-row md:flex-col p-4 gap-2 overflow-x-auto">

          <button 
            onClick={() => setActiveTab('recorded')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'recorded' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-200/50'}`}
          >
            <Film size={18} /> Recorded Classes
          </button>
          <button 
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'materials' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'text-slate-600 hover:bg-slate-200/50'}`}
          >
            <FileText size={18} /> Study Materials
          </button>
          <button 
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'tests' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-slate-600 hover:bg-slate-200/50'}`}
          >
            <FileQuestion size={18} /> Assigned Tests
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          


          {/* RECORDED CLASSES TAB */}
          {activeTab === 'recorded' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Recorded Library</h2>
                  <p className="text-slate-500 mt-1 font-medium">Manage recordings assigned to this course.</p>
                </div>
                <button 
                  onClick={handleOpenAddRecordingModal}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
                >
                  <Plus size={18} /> Add Video
                </button>
              </div>

              <div className="space-y-3">
                {recordedClasses.map((cls, index) => {
                  const ytId = (() => {
                    const urlOrId = cls.meeting_link || cls.video_url; // fallback to video_url if old data
                    if (!urlOrId) return null;
                    if (urlOrId.length === 11 && !urlOrId.includes("/") && !urlOrId.includes(".")) return urlOrId;
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
                    const match = String(urlOrId).match(regExp);
                    return (match && match[2].length === 11) ? match[2] : null;
                  })();

                  return (
                    <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-4 transition-all duration-300 group relative overflow-hidden hover:shadow-md">
                      {/* THUMBNAIL */}
                      <div className="relative w-32 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        {ytId ? (
                          <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover" />
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
                      </div>

                      {/* INFO */}
                      <div className="flex-1 min-w-0 py-1">
                        <h3 className="font-bold text-base line-clamp-2 text-slate-800">{cls.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-semibold">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Calendar size={12} className="text-slate-400"/> {new Date(cls.class_date).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>

                      {/* DELETE BUTTON */}
                      <button 
                         onClick={async () => { 
                           await deleteRecordedClass(cls.id, courseId as string, cls.is_live_vod); 
                           setRecordedClasses(await getRecordedClasses(courseId as string)); 
                         }} 
                         className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                         title="Remove from course"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  );
                })}
                {recordedClasses.length === 0 && (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Film size={40} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="text-lg font-bold text-slate-700">No recordings available</h3>
                    <p className="text-sm text-slate-500">Click the Add Video button to assign recordings to this course.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MATERIALS TAB */}
          {activeTab === 'materials' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Study Materials</h2>
                  <p className="text-slate-500 mt-1 font-medium">Manage PDFs and documents assigned to this course.</p>
                </div>
                <button 
                  onClick={() => setIsUploadMaterialModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
                >
                  <Plus size={18} /> Upload Document
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {materials.map(mat => (
                  <div key={mat.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col shadow-sm hover:shadow-lg transition-all group">
                    <div className="flex gap-4 items-start mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-200/50 shadow-inner">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight">{mat.title}</h3>
                        <span className="text-[10px] font-black tracking-wider uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded mt-2 inline-block shadow-sm">{mat.type || 'Document'}</span>
                      </div>
                    </div>
                    <div className="mt-auto flex justify-between gap-3">
                      <a href={mat.file_url} target="_blank" rel="noreferrer" className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-200 text-sm shadow-sm">
                        View File
                      </a>
                      <button 
                         onClick={async () => { await deleteCourseMaterial(mat.id, courseId as string); setMaterials(await getCourseMaterials(courseId as string)); }}
                         className="px-4 bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 py-2.5 rounded-xl transition-all border border-slate-200 shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {materials.length === 0 && (
                  <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="text-lg font-bold text-slate-700">No materials yet</h3>
                    <p className="text-sm text-slate-500">Upload documents and resources for this course.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TESTS TAB */}
          {activeTab === 'tests' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Plus size={18}/> Assign Test from Bank</h3>
                  <Link href="/admin/tests/create" className="text-sm font-bold text-emerald-600 hover:underline">
                    Create New Test &rarr;
                  </Link>
                </div>
                <form onSubmit={handleAssignTest} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select required value={selectedTestId} onChange={e=>setSelectedTestId(e.target.value)} className="col-span-full md:col-span-2 px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="" disabled>Select a test from the bank...</option>
                    {allTests.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.duration_minutes}m, {t.total_marks} marks)</option>
                    ))}
                  </select>
                  <input required type="number" min="1" placeholder="Max Attempts (e.g. 5)" value={testMaxAttempts} onChange={e=>setTestMaxAttempts(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" title="Maximum attempts allowed" />
                  <button disabled={isSubmitting} type="submit" className="col-span-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Assigning...' : 'Assign Test'}
                  </button>
                </form>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-4">Assigned Tests</h3>
                <div className="grid grid-cols-1 gap-4">
                  {courseTests.map(ct => (
                    <div key={ct.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm group">
                      <div className="flex gap-3 overflow-hidden items-center">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <FileQuestion size={20} />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-slate-800 truncate">{ct.tests?.title}</h4>
                          <div className="text-xs text-slate-500 mt-1 flex gap-3">
                            <span>{ct.tests?.duration_minutes} mins</span>
                            <span>{ct.tests?.total_marks} marks</span>
                            <span className="font-semibold text-emerald-600">Max Attempts: {ct.max_attempts}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={async () => { await removeTestFromCourse(ct.id, courseId as string); setCourseTests(await getCourseTests(courseId as string)); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {courseTests.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No tests assigned to this course.</p>}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Add Recording Modal */}
      {isAddRecordingModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-100">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Film className="text-indigo-600" size={24} />
                  Add from Study Materials
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Select recordings to assign to this course.</p>
              </div>
              <button onClick={() => setIsAddRecordingModalOpen(false)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {globalRecordings.map(rec => {
                  const isAssigned = recordedClasses.some(c => c.meeting_link === rec.meeting_link);
                  return (
                    <div key={rec.id} className="flex gap-4 p-4 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-indigo-200 transition-all">
                      <div className="w-24 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                        {rec.meeting_link ? (
                          <img src={`https://img.youtube.com/vi/${rec.meeting_link}/mqdefault.jpg`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Video className="text-slate-400" size={20}/></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-tight">{rec.topic}</h4>
                        <div className="mt-auto pt-2 flex justify-end">
                          {isAssigned ? (
                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Already Added</span>
                          ) : (
                            <button
                              disabled={assigningRecordingId === rec.id}
                              onClick={() => handleAssignRecording(rec.id)}
                              className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {assigningRecordingId === rec.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {globalRecordings.length === 0 && <p className="col-span-full text-center text-slate-500">No recordings available globally.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      {isUploadMaterialModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="text-amber-500" size={24} />
                  Upload Document
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Add a new PDF or document.</p>
              </div>
              <button onClick={() => setIsUploadMaterialModalOpen(false)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm">
                ✕
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Document Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Chapter 1 Notes (Optional)"
                  value={matTitle}
                  onChange={e => setMatTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Upload File</label>
                {isSubmitting ? (
                  <div className="h-[120px] bg-slate-50 rounded-xl flex items-center justify-center text-sm font-bold text-slate-500 border border-slate-200 shadow-inner">Uploading... Please wait</div>
                ) : (
                  <UploadDropzone
                    endpoint="courseMaterial"
                    onClientUploadComplete={handleMaterialUploadComplete}
                    onUploadError={(error: Error) => { alert(`ERROR! ${error.message}`); }}
                    className="ut-button:bg-amber-500 ut-button:ut-readying:bg-amber-500/50 py-8 border-slate-300"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
