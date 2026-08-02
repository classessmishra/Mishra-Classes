"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Video, Film, FileText, Plus, Trash2, Loader2, Link as LinkIcon, Clock, Calendar, FileQuestion, Folder, ChevronLeft, FolderOpen, Upload, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getLiveClasses, createLiveClass, deleteLiveClass, getRecordedClasses, createRecordedClass, deleteRecordedClass, getCourseMaterials, createCourseMaterial, deleteCourseMaterial, getCourseFolders, createCourseFolder, deleteCourseFolder } from "@/actions/courseContent";
import { getCourseTests, getAllTests, assignTestToCourse, removeTestFromCourse } from "@/actions/courseTests";
import { getAllRecordedClassesGlobally, assignRecordingToCourse } from "@/actions/liveClasses";
import { supabase } from "@/lib/supabase";
import { UploadDropzone } from "@/utils/uploadthing";
import "@uploadthing/react/styles.css";

export default function CourseContentManager() {
  const { courseId } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'live'|'recorded'|'tests'|'study_material'>('live');
  const [activeAdminFolder, setActiveAdminFolder] = useState<string | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [recordedClasses, setRecordedClasses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [courseTests, setCourseTests] = useState<any[]>([]);
  
  // Modals & Forms
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  
  const [isUploadMaterialModalOpen, setIsUploadMaterialModalOpen] = useState(false);
  const [matTitle, setMatTitle] = useState("");
  
  const [isAssignTestModalOpen, setIsAssignTestModalOpen] = useState(false);
  const [allTests, setAllTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [testMaxAttempts, setTestMaxAttempts] = useState("5");

  const [isAddRecordingModalOpen, setIsAddRecordingModalOpen] = useState(false);
  const [globalRecordings, setGlobalRecordings] = useState<any[]>([]);
  const [assigningRecordingId, setAssigningRecordingId] = useState<string | null>(null);

  // Live Class Form
  const [liveTopic, setLiveTopic] = useState("");
  const [liveTime, setLiveTime] = useState("");
  const [liveLink, setLiveLink] = useState("");

  useEffect(() => { fetchData(); }, [courseId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).single();
    setCourse(courseData);
    const [live, rec, mat, cTests, aTests, flds] = await Promise.all([
      getLiveClasses(courseId as string),
      getRecordedClasses(courseId as string),
      getCourseMaterials(courseId as string),
      getCourseTests(courseId as string),
      getAllTests(),
      getCourseFolders(courseId as string)
    ]);
    setLiveClasses(live); setRecordedClasses(rec); setMaterials(mat);
    setCourseTests(cTests); setAllTests(aTests); setFolders(flds);
    setLoading(false);
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName) return;
    setIsSubmitting(true);
    try {
      await createCourseFolder(courseId as string, folderName);
      setFolderName("");
      setIsCreateFolderModalOpen(false);
      setFolders(await getCourseFolders(courseId as string));
    } catch (err: any) { alert(err.message); } finally { setIsSubmitting(false); }
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
        type: fileType,
        folder_id: (activeTab === 'study_material' && activeAdminFolder) ? activeAdminFolder : null
      });
      setMatTitle("");
      setIsUploadMaterialModalOpen(false);
      setMaterials(await getCourseMaterials(courseId as string));
    } catch (err: any) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const handleAssignTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId) return alert("Please select a test");
    setIsSubmitting(true);
    try {
      await assignTestToCourse(
        courseId as string, 
        selectedTestId, 
        parseInt(testMaxAttempts) || 5, 
        (activeTab === 'study_material' && activeAdminFolder) ? activeAdminFolder : undefined
      );
      setSelectedTestId(""); setTestMaxAttempts("5");
      setIsAssignTestModalOpen(false);
      setCourseTests(await getCourseTests(courseId as string));
    } catch (err: any) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const handleOpenAddRecordingModal = async () => {
    setIsAddRecordingModalOpen(true);
    const recs = await getAllRecordedClassesGlobally();
    const uniqueRecsMap = new Map();
    recs.forEach((r: any) => { if (!uniqueRecsMap.has(r.meeting_link)) uniqueRecsMap.set(r.meeting_link, r); });
    setGlobalRecordings(Array.from(uniqueRecsMap.values()));
  };

  const handleAssignRecording = async (recordingId: string) => {
    setAssigningRecordingId(recordingId);
    try {
      const assigned = await assignRecordingToCourse(recordingId, courseId as string);
      if (activeTab === 'study_material' && activeAdminFolder) {
        await supabase.from('live_classes').update({ folder_id: activeAdminFolder }).eq('id', assigned.id);
      }
      setRecordedClasses(await getRecordedClasses(courseId as string));
      setIsAddRecordingModalOpen(false);
    } catch(err: any) { alert(err.message); } finally { setAssigningRecordingId(null); }
  };

  const handleAddLive = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createLiveClass({
        course_id: courseId,
        title: liveTopic,
        scheduled_time: new Date(liveTime).toISOString(),
        youtube_video_id: liveLink
      });
      setLiveTopic(""); setLiveTime(""); setLiveLink("");
      setLiveClasses(await getLiveClasses(courseId as string));
    } catch (err: any) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const renderRecordingsList = (items: any[]) => {
    if (items.length === 0) return <p className="text-slate-500 text-sm text-center py-8">No recordings found.</p>;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(cls => (
          <div key={cls.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-4 hover:shadow-sm">
            <div className="w-20 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
              <Video size={18} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-slate-800 line-clamp-2">{cls.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{new Date(cls.class_date).toLocaleDateString()}</p>
            </div>
            <button onClick={async () => { await deleteRecordedClass(cls.id, courseId as string, cls.is_live_vod); setRecordedClasses(await getRecordedClasses(courseId as string)); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderMaterialsList = (items: any[]) => {
    if (items.length === 0) return <p className="text-slate-500 text-sm text-center py-8">No materials found.</p>;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(mat => (
          <div key={mat.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-4 hover:shadow-sm">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{mat.title}</h4>
              <p className="text-xs text-slate-500 mt-1 uppercase">{mat.type}</p>
            </div>
            <button onClick={async () => { await deleteCourseMaterial(mat.id, courseId as string); setMaterials(await getCourseMaterials(courseId as string)); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderTestsList = (items: any[]) => {
    if (items.length === 0) return <p className="text-slate-500 text-sm text-center py-8">No tests assigned.</p>;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(ct => (
          <div key={ct.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-4 hover:shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <FileQuestion size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{ct.tests?.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{ct.tests?.duration_minutes}m • {ct.tests?.total_marks} Marks</p>
            </div>
            <button onClick={async () => { await removeTestFromCourse(ct.id, courseId as string); setCourseTests(await getCourseTests(courseId as string)); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const getNavButtonClass = (tabName: string, colorClass: string) => {
    return `flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === tabName ? colorClass : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`;
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6">
      <Link href="/admin/courses" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Manage Content: {course?.title}</h1>
          <p className="text-slate-500 mt-1">Organize course content, schedule live sessions, and manage folders.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
           <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-2">Navigation</h3>
             <nav className="flex flex-col gap-2">
               <button onClick={() => { setActiveTab('live'); }} className={getNavButtonClass('live', 'bg-blue-600 text-white shadow-md shadow-blue-200')}>
                 <div className="flex items-center gap-3"><Video size={18} /> Live Classes</div>
                 {activeTab === 'live' && <ChevronRight size={16} />}
               </button>
               <button onClick={() => { setActiveTab('recorded'); }} className={getNavButtonClass('recorded', 'bg-rose-600 text-white shadow-md shadow-rose-200')}>
                 <div className="flex items-center gap-3"><Film size={18} /> Recorded</div>
                 {activeTab === 'recorded' && <ChevronRight size={16} />}
               </button>
               <button onClick={() => { setActiveTab('tests'); }} className={getNavButtonClass('tests', 'bg-emerald-600 text-white shadow-md shadow-emerald-200')}>
                 <div className="flex items-center gap-3"><FileQuestion size={18} /> Tests</div>
                 {activeTab === 'tests' && <ChevronRight size={16} />}
               </button>
               <button onClick={() => { setActiveTab('study_material'); setActiveAdminFolder(null); }} className={getNavButtonClass('study_material', 'bg-amber-500 text-white shadow-md shadow-amber-200')}>
                 <div className="flex items-center gap-3"><Folder size={18} /> Study Material</div>
                 {activeTab === 'study_material' && <ChevronRight size={16} />}
               </button>
             </nav>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-8 min-h-[60vh]">
           
           {/* LIVE CLASSES */}
           {activeTab === 'live' && (
             <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Live Classes</h2>
                    <p className="text-slate-500 mt-1 font-medium">Schedule and manage upcoming live sessions.</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18}/> Schedule New Class</h3>
                  <form onSubmit={handleAddLive} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input required type="text" placeholder="Topic / Title" value={liveTopic} onChange={e=>setLiveTopic(e.target.value)} className="col-span-full md:col-span-2 px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input required type="datetime-local" value={liveTime} onChange={e=>setLiveTime(e.target.value)} className="col-span-full md:col-span-1 px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                    <input required type="text" placeholder="YouTube Video ID" value={liveLink} onChange={e=>setLiveLink(e.target.value)} className="col-span-full md:col-span-1 px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                    <button disabled={isSubmitting} type="submit" className="col-span-full md:col-span-1 md:col-start-4 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                      {isSubmitting ? 'Scheduling...' : 'Schedule Class'}
                    </button>
                  </form>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 mb-4">Upcoming Sessions</h3>
                  {liveClasses.map(cls => (
                    <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                          <Video size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{cls.title || cls.topic}</h4>
                          <div className="flex gap-4 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(cls.scheduled_time || cls.start_time).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Clock size={12}/> {new Date(cls.scheduled_time || cls.start_time).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={async () => { await deleteLiveClass(cls.id, courseId as string); setLiveClasses(await getLiveClasses(courseId as string)); }} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-colors shrink-0">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {liveClasses.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No live classes scheduled.</p>}
                </div>
             </div>
           )}

           {/* RECORDED */}
           {activeTab === 'recorded' && (
             <div className="animate-in fade-in zoom-in-95 duration-500">
               <div className="flex justify-between items-end mb-8">
                 <div>
                   <h2 className="text-2xl font-black text-slate-900">Recorded Library</h2>
                   <p className="text-slate-500 mt-1">Videos uploaded outside of folders.</p>
                 </div>
                 <button onClick={handleOpenAddRecordingModal} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm">
                   <Video size={18} /> Add Video
                 </button>
               </div>
               {renderRecordingsList(recordedClasses.filter(r => !r.folder_id))}
             </div>
           )}

           {/* TESTS */}
           {activeTab === 'tests' && (
             <div className="animate-in fade-in zoom-in-95 duration-500">
               <div className="flex justify-between items-end mb-8">
                 <div>
                   <h2 className="text-2xl font-black text-slate-900">Tests</h2>
                   <p className="text-slate-500 mt-1">Directly assigned tests outside of folders.</p>
                 </div>
                 <button onClick={() => setIsAssignTestModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm">
                   <FileQuestion size={18} /> Assign Test
                 </button>
               </div>
               {renderTestsList(courseTests.filter(t => !t.folder_id))}
             </div>
           )}

           {/* STUDY MATERIAL */}
           {activeTab === 'study_material' && (
             <div className="animate-in fade-in zoom-in-95 duration-500">
               {activeAdminFolder === null ? (
                 <>
                   <div className="flex justify-between items-end mb-8">
                     <div>
                       <h2 className="text-2xl font-black text-slate-900">Study Material</h2>
                       <p className="text-slate-500 mt-1">Organize your resources in folders (upload PDFs, Videos, Tests).</p>
                     </div>
                     <div className="flex gap-3">
                       <button onClick={() => setIsUploadMaterialModalOpen(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm">
                         <FileText size={18} /> Upload Material
                       </button>
                       <button onClick={() => setIsCreateFolderModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm">
                         <Plus size={18} /> Create Folder
                       </button>
                     </div>
                   </div>
                   
                   {folders.length > 0 && (
                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
                       {folders.map((folder, index) => {
                          const itemsCount = recordedClasses.filter(r => r.folder_id === folder.id).length 
                                           + materials.filter(m => m.folder_id === folder.id).length
                                           + courseTests.filter(t => t.folder_id === folder.id).length;
                          const gradients = [
                            'from-indigo-500 via-purple-500 to-pink-500',
                            'from-blue-500 via-cyan-500 to-teal-400',
                            'from-orange-400 via-rose-500 to-pink-500',
                            'from-fuchsia-500 via-purple-600 to-indigo-600',
                            'from-emerald-400 via-teal-500 to-cyan-500'
                          ];
                          const bgGradient = gradients[index % gradients.length];
                          return (
                            <div key={folder.id} className="relative group cursor-pointer">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCourseFolder(folder.id, courseId as string).then(() => getCourseFolders(courseId as string)).then(setFolders);
                                }}
                                className="absolute -top-3 -right-3 z-50 bg-white text-rose-500 p-2 rounded-full shadow-lg border border-rose-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 hover:scale-110"
                                title="Delete Folder"
                              >
                                <Trash2 size={14} />
                              </button>

                              <div onClick={() => setActiveAdminFolder(folder.id)} className={`relative h-44 w-full rounded-[2rem] bg-gradient-to-br ${bgGradient} p-5 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between`}>
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative z-10 flex justify-between items-start">
                                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner border border-white/20">
                                    <FolderOpen size={24} strokeWidth={2} />
                                  </div>
                                  <span className="bg-black/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                                    {itemsCount} {itemsCount === 1 ? 'Item' : 'Items'}
                                  </span>
                                </div>
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
                   )}

                   {/* Root Materials List inside Study Material */}
                   <h3 className="text-lg font-bold text-slate-800 mb-4 border-t border-slate-100 pt-6">Direct Materials</h3>
                   {renderMaterialsList(materials.filter(m => !m.folder_id))}
                 </>
               ) : (
                 <>
                   <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                       <button onClick={() => setActiveAdminFolder(null)} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
                         <ChevronLeft size={20} />
                       </button>
                       <div>
                         <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                           <FolderOpen className="text-amber-500" size={28} /> {folders.find(f => f.id === activeAdminFolder)?.name}
                         </h2>
                         <p className="text-slate-500 text-sm mt-1">Manage contents inside this folder.</p>
                       </div>
                     </div>
                   </div>

                   <div className="flex flex-wrap gap-3 mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                     <button onClick={() => handleOpenAddRecordingModal()} className="flex-1 bg-white hover:bg-blue-50 text-blue-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-slate-200 shadow-sm"><Video size={16}/> Add Video</button>
                     <button onClick={() => setIsUploadMaterialModalOpen(true)} className="flex-1 bg-white hover:bg-amber-50 text-amber-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-slate-200 shadow-sm"><FileText size={16}/> Upload PDF</button>
                     <button onClick={() => setIsAssignTestModalOpen(true)} className="flex-1 bg-white hover:bg-emerald-50 text-emerald-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-slate-200 shadow-sm"><FileQuestion size={16}/> Assign Test</button>
                   </div>
                   
                   <div className="space-y-8 mt-8 border-t border-slate-100 pt-8">
                     {recordedClasses.filter(r => r.folder_id === activeAdminFolder).length > 0 && (
                       <div>
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Film size={18} className="text-rose-500" /> Videos</h3>
                         {renderRecordingsList(recordedClasses.filter(r => r.folder_id === activeAdminFolder))}
                       </div>
                     )}
                     
                     {materials.filter(m => m.folder_id === activeAdminFolder).length > 0 && (
                       <div>
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-amber-500" /> Documents</h3>
                         {renderMaterialsList(materials.filter(m => m.folder_id === activeAdminFolder))}
                       </div>
                     )}

                     {courseTests.filter(t => t.folder_id === activeAdminFolder).length > 0 && (
                       <div>
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileQuestion size={18} className="text-emerald-500" /> Tests</h3>
                         {renderTestsList(courseTests.filter(t => t.folder_id === activeAdminFolder))}
                       </div>
                     )}

                     {recordedClasses.filter(r => r.folder_id === activeAdminFolder).length === 0 && 
                      materials.filter(m => m.folder_id === activeAdminFolder).length === 0 && 
                      courseTests.filter(t => t.folder_id === activeAdminFolder).length === 0 && (
                       <div className="py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                         <FolderOpen size={32} className="mx-auto text-slate-300 mb-2" />
                         <p className="text-slate-500 font-medium">This folder is empty.</p>
                       </div>
                     )}
                   </div>
                 </>
               )}
             </div>
           )}
        </div>
      </div>

      {/* ALL MODALS GO HERE */}
      {/* Create Folder Modal */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-black mb-4">Create New Folder</h2>
            <form onSubmit={handleAddFolder} className="flex flex-col gap-4">
              <input autoFocus required type="text" placeholder="Folder Name" value={folderName} onChange={e=>setFolderName(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-300 outline-none" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsCreateFolderModalOpen(false)} className="flex-1 bg-slate-100 font-bold py-3 rounded-xl text-slate-600">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 font-bold py-3 rounded-xl text-white disabled:opacity-50">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      {isUploadMaterialModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2"><FileText size={20} className="text-amber-500"/> Upload Document</h2>
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Document Title (Optional)" value={matTitle} onChange={e => setMatTitle(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3" />
              {isSubmitting ? (
                <div className="h-[120px] bg-slate-50 rounded-xl flex items-center justify-center font-bold text-slate-500">Uploading...</div>
              ) : (
                <UploadDropzone endpoint="courseMaterial" onClientUploadComplete={handleMaterialUploadComplete} onUploadError={(error) => alert(error.message)} />
              )}
              <button onClick={() => setIsUploadMaterialModalOpen(false)} className="w-full bg-slate-100 font-bold py-3 rounded-xl text-slate-600 mt-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Test Modal */}
      {isAssignTestModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2"><FileQuestion size={20} className="text-emerald-500"/> Assign Test</h2>
            <form onSubmit={handleAssignTest} className="flex flex-col gap-4">
              <select required value={selectedTestId} onChange={e=>setSelectedTestId(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none">
                <option value="" disabled>Select a test...</option>
                {allTests.map(t => <option key={t.id} value={t.id}>{t.title} ({t.duration_minutes}m)</option>)}
              </select>
              <input required type="number" min="1" placeholder="Max Attempts (Default: 5)" value={testMaxAttempts} onChange={e=>setTestMaxAttempts(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none" />
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setIsAssignTestModalOpen(false)} className="flex-1 bg-slate-100 font-bold py-3 rounded-xl text-slate-600">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 font-bold py-3 rounded-xl text-white">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Recording Modal */}
      {isAddRecordingModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black flex items-center gap-2"><Video size={20} className="text-rose-500"/> Add Video Recording</h2>
              <button onClick={() => setIsAddRecordingModalOpen(false)} className="w-8 h-8 flex justify-center items-center rounded-full bg-slate-100 hover:bg-slate-200">✕</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {globalRecordings.map(rec => {
                  const isAssigned = recordedClasses.some(c => c.meeting_link === rec.meeting_link);
                  return (
                    <div key={rec.id} className="flex gap-4 p-3 border border-slate-200 rounded-xl">
                      <div className="w-20 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                        {rec.meeting_link ? (
                          <img src={`https://img.youtube.com/vi/${rec.meeting_link}/mqdefault.jpg`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Video size={16} className="text-slate-400"/></div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-2">{rec.topic}</h4>
                        <div className="mt-auto flex justify-end">
                          {isAssigned ? (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Added</span>
                          ) : (
                            <button onClick={() => handleAssignRecording(rec.id)} disabled={assigningRecordingId === rec.id} className="text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded transition-colors flex items-center gap-1">
                              {assigningRecordingId === rec.id ? <Loader2 size={12} className="animate-spin"/> : <Plus size={12}/>} Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
