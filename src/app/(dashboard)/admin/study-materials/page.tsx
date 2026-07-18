"use client";

import { useEffect, useState } from "react";
import { getAllRecordedClassesGlobally, assignRecordingToCourse, addManualVOD } from "@/actions/liveClasses";
import { getAllCourseMaterialsGlobally, createCourseMaterial, assignMaterialToCourse, deleteCourseMaterial } from "@/actions/courseContent";
import { getCourses } from "@/actions/courses";
import { BookOpen, Video, FileText, FolderOpen, PlayCircle, Plus, Search, Calendar, Clock, ArrowRight, Activity, Tag, Folder, X, Trash2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LivePlayer from "@/components/LivePlayer";
import { UploadDropzone } from "@/utils/uploadthing";

export default function StudyMaterialsPage() {
  const [activeTab, setActiveTab] = useState<'recordings' | 'documents'>('recordings');
  const [recordings, setRecordings] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  
  const [isAddVODModalOpen, setIsAddVODModalOpen] = useState(false);
  const [newVODTitle, setNewVODTitle] = useState("");
  const [newVODLink, setNewVODLink] = useState("");
  const [newVODCourseId, setNewVODCourseId] = useState("");
  const [newVODDuration, setNewVODDuration] = useState("");
  const [addingVOD, setAddingVOD] = useState(false);
  
  const [materials, setMaterials] = useState<any[]>([]);
  const [isUploadMaterialModalOpen, setIsUploadMaterialModalOpen] = useState(false);
  const [matTitle, setMatTitle] = useState("");
  const [matCourseId, setMatCourseId] = useState("");
  const [isUploadingMat, setIsUploadingMat] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recs, crs, mats] = await Promise.all([
        getAllRecordedClassesGlobally(),
        getCourses(),
        getAllCourseMaterialsGlobally()
      ]);
      const uniqueRecsMap = new Map();
      recs.forEach((r: any) => {
        if (!uniqueRecsMap.has(r.meeting_link)) {
          uniqueRecsMap.set(r.meeting_link, r);
        }
      });
      setRecordings(Array.from(uniqueRecsMap.values()));
      setCourses(crs);
      
      const uniqueMatsMap = new Map();
      mats.forEach((m: any) => {
        if (!uniqueMatsMap.has(m.file_url)) {
          uniqueMatsMap.set(m.file_url, m);
        }
      });
      setMaterials(Array.from(uniqueMatsMap.values()));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecordings = recordings.filter(r => 
    r.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.courses?.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMaterials = materials.filter(m => 
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.courses?.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const extractYouTubeId = (urlOrId: string) => {
    if (!urlOrId) return null;
    if (urlOrId.length === 11 && !urlOrId.includes("/") && !urlOrId.includes(".")) {
      return urlOrId;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = String(urlOrId).match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAddVODSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVODTitle || !newVODLink) return;

    setAddingVOD(true);
    try {
      const ytId = extractYouTubeId(newVODLink);
      await addManualVOD({
        title: newVODTitle,
        youtubeVideoId: ytId,
        courseId: newVODCourseId || undefined,
        duration: newVODDuration || undefined
      });
      alert("VOD added successfully!");
      setIsAddVODModalOpen(false);
      setNewVODTitle("");
      setNewVODLink("");
      setNewVODCourseId("");
      setNewVODDuration("");
      fetchData(); // Refresh list
    } catch (err: any) {
      alert(err.message || "Failed to add VOD");
    } finally {
      setAddingVOD(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecording || selectedCourseIds.length === 0) return;

    setAssigning(true);
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const courseId of selectedCourseIds) {
        try {
          await assignRecordingToCourse(selectedRecording.id, courseId);
          successCount++;
        } catch(err) {
          console.error(`Failed for course ${courseId}:`, err);
          failCount++;
        }
      }
      
      if (failCount > 0) {
        alert(`Successfully assigned to ${successCount} courses, but failed for ${failCount} (they might already have this recording).`);
      } else {
        alert("Recording successfully assigned to selected courses!");
      }

      setIsAssignModalOpen(false);
      setSelectedRecording(null);
      setSelectedCourseIds([]);
    } catch (err: any) {
      alert(err.message || "Failed to assign recording");
    } finally {
      setAssigning(false);
    }
  };

  const openAssignModal = (rec: any) => {
    setSelectedRecording(rec);
    setSelectedCourseIds([]);
    setIsAssignModalOpen(true);
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleMaterialUploadComplete = async (res: any[]) => {
    setIsUploadingMat(true);
    try {
      const file = res[0];
      const fileType = file.name.split('.').pop()?.toLowerCase() || 'file';
      await createCourseMaterial({
        course_id: matCourseId || null,
        title: matTitle || file.name,
        file_url: file.url,
        type: fileType
      });
      
      setMatTitle("");
      setMatCourseId("");
      setIsUploadMaterialModalOpen(false);
      alert("Document uploaded successfully!");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploadingMat(false);
    }
  };

  const openAssignMaterialModal = (mat: any) => {
    setSelectedMaterial(mat);
    setSelectedCourseIds([]);
    setIsAssignModalOpen(true);
  };

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <BookOpen className="text-blue-600" size={32} />
          Study Materials Hub
        </h1>
        <p className="text-slate-500 font-medium mt-1">Manage global class recordings, documents, and resources.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveTab('recordings')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'recordings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Video size={18} />
          Class Recordings Library
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <FileText size={18} />
          Documents & PDFs
        </button>
      </div>

      {/* Search & Actions */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder={activeTab === 'recordings' ? "Search recordings..." : "Search documents..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-slate-800"
          />
        </div>
        {activeTab === 'recordings' && (
          <button 
            onClick={() => setIsAddVODModalOpen(true)}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0"
          >
            <Plus size={18} /> Add VOD Manually
          </button>
        )}
        {activeTab === 'documents' && (
          <button 
            onClick={() => setIsUploadMaterialModalOpen(true)}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0"
          >
            <Plus size={18} /> Upload Document
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Activity className="text-blue-500 animate-spin w-12 h-12 mb-4" />
          <p className="text-slate-500 font-medium">Loading materials library...</p>
        </div>
      ) : (
        <div className="w-full">
          {activeTab === 'recordings' ? (
            <>
              {filteredRecordings.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Video size={40} className="text-slate-300" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">No Recordings Found</h2>
                  <p className="text-slate-500 font-medium max-w-md">Once live classes are completed, their recordings will populate this global library.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecordings.map((rec) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={rec.id}
                      className="group bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all flex flex-col"
                    >
                      <div 
                        className="relative aspect-video w-full overflow-hidden bg-slate-900 cursor-pointer group"
                        onClick={() => setPlayingVideoId(rec.meeting_link)}
                      >
                        {(() => {
                          const ytId = extractYouTubeId(rec.meeting_link);
                          return ytId ? (
                            <img 
                              src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} 
                              alt={rec.topic}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                              <Video size={40} className="text-slate-300 mb-2" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">No Thumb</span>
                            </div>
                          );
                        })()}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle size={48} className="text-white drop-shadow-lg" />
                        </div>
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-blue-700 font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm pointer-events-none">
                          VOD
                        </div>
                        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white font-mono text-[11px] px-2 py-1 rounded-md tracking-wider flex items-center gap-1.5 shadow-lg">
                          <Clock size={12} className="text-slate-300" />
                          {rec.duration || "00:00:00"}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 line-clamp-2">
                          {rec.topic}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-4 text-[12px] font-bold text-slate-500">
                          <Calendar size={14} className="text-slate-400" />
                          {rec.start_time ? new Date(rec.start_time).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Unknown Date'}
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Source</span>
                            <span className="text-[12px] font-bold text-slate-700 truncate max-w-[120px]">
                              {rec.courses?.title ? "From Live" : "Manual VOD"}
                            </span>
                          </div>
                          <button 
                            onClick={() => openAssignModal(rec)}
                            className="text-[11px] font-black uppercase tracking-widest bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                          >
                            Assign <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {filteredMaterials.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                    <FolderOpen size={40} className="text-orange-300" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">No Documents Found</h2>
                  <p className="text-slate-500 font-medium max-w-md">Upload PDFs and resources to make them available globally or assign them to courses.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMaterials.map((mat) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={mat.id}
                      className="bg-white rounded-[1.5rem] border border-slate-200 p-6 flex flex-col shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group"
                    >
                      <div className="flex gap-4 items-start mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-200/50 shadow-inner group-hover:scale-110 transition-transform">
                          <FileText size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight text-lg" title={mat.title}>{mat.title}</h3>
                          <span className="text-[10px] font-black tracking-wider uppercase text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md mt-2 inline-block shadow-sm">
                            {mat.type || 'Document'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Source</span>
                          <span className="text-[12px] font-bold text-slate-700 truncate max-w-[120px]">
                            {mat.courses?.title ? "Course Material" : "Global Vault"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <a 
                            href={mat.file_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="w-9 h-9 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center transition-colors border border-slate-200"
                            title="View File"
                          >
                            <Eye size={16} />
                          </a>
                          <button 
                            onClick={() => openAssignMaterialModal(mat)}
                            className="text-[11px] font-black uppercase tracking-widest bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                          >
                            Assign <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Assign Modal (Shared for Video & Material) */}
      <AnimatePresence>
        {isAssignModalOpen && (selectedRecording || selectedMaterial) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  {selectedRecording ? <Video className="text-blue-600" size={24} /> : <FileText className="text-blue-600" size={24} />}
                  Assign {selectedRecording ? "Recording" : "Document"}
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Copy this {selectedRecording ? "VOD" : "file"} to another course.</p>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                setAssigning(true);
                try {
                  for (const courseId of selectedCourseIds) {
                    if (selectedRecording) await assignRecordingToCourse(selectedRecording.id, courseId);
                    if (selectedMaterial) await assignMaterialToCourse(selectedMaterial.id, courseId);
                  }
                  alert("Assigned successfully!");
                  setIsAssignModalOpen(false);
                  setSelectedRecording(null);
                  setSelectedMaterial(null);
                  setSelectedCourseIds([]);
                } catch(err: any) {
                  alert(err.message || "Assignment failed");
                } finally {
                  setAssigning(false);
                }
              }} className="p-6 flex flex-col gap-5">
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Selected Item</span>
                  <span className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                    {selectedRecording ? selectedRecording.topic : selectedMaterial?.title}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Target Courses</label>
                  <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-48 overflow-y-auto">
                    {courses.map(course => (
                      <label key={course.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={selectedCourseIds.includes(course.id)}
                          onChange={() => toggleCourseSelection(course.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-bold text-slate-800">{course.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAssignModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={assigning || selectedCourseIds.length === 0}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {assigning ? "Assigning..." : `Assign to ${selectedCourseIds.length} Courses`}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Manual VOD Modal */}
      <AnimatePresence>
        {isAddVODModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <PlayCircle className="text-blue-600" size={24} />
                  Add YouTube VOD
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Import an unlisted YouTube video directly.</p>
              </div>
              
              <form onSubmit={handleAddVODSubmit} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Video Title</label>
                  <input 
                    type="text"
                    value={newVODTitle}
                    onChange={e => setNewVODTitle(e.target.value)}
                    required
                    placeholder="e.g. Physics Chapter 1"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">YouTube Link or ID</label>
                  <input 
                    type="text"
                    value={newVODLink}
                    onChange={e => setNewVODLink(e.target.value)}
                    required
                    placeholder="e.g. dQw4w9WgXcQ or https://..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Duration (Optional)</label>
                  <input 
                    type="text"
                    value={newVODDuration}
                    onChange={e => setNewVODDuration(e.target.value)}
                    placeholder="e.g. 01:25:00 or 45:00"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">Format: HH:MM:SS or MM:SS</p>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Target Course (Optional)</label>
                  <select 
                    value={newVODCourseId}
                    onChange={e => setNewVODCourseId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                  >
                    <option value="">No Course (Global Library Only)</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex gap-3 mt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAddVODModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={addingVOD || !newVODTitle || !newVODLink}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {addingVOD ? "Adding..." : "Add Video"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Document Modal */}
      <AnimatePresence>
        {isUploadMaterialModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <FileText className="text-amber-500" size={24} />
                    Upload Document
                  </h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Add a new PDF or document.</p>
                </div>
                <button onClick={() => setIsUploadMaterialModalOpen(false)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 flex flex-col gap-6">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Document Title</label>
                  <input 
                    type="text"
                    placeholder="e.g. Chapter 1 Notes (Leave empty to use filename)"
                    value={matTitle}
                    onChange={e => setMatTitle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Target Course (Optional)</label>
                  <select 
                    value={matCourseId}
                    onChange={e => setMatCourseId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm"
                  >
                    <option value="">No Course (Global Vault Only)</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Upload File</label>
                  {isUploadingMat ? (
                    <div className="h-[120px] bg-slate-50 rounded-xl flex flex-col items-center justify-center text-sm font-bold text-slate-500 border border-slate-200 shadow-inner">
                      <Activity className="animate-spin text-blue-500 mb-2" size={24} />
                      Uploading... Please wait
                    </div>
                  ) : (
                    <UploadDropzone
                      endpoint="courseMaterial"
                      onClientUploadComplete={handleMaterialUploadComplete}
                      onUploadError={(error: Error) => { alert(`ERROR! ${error.message}`); }}
                      className="ut-button:bg-blue-600 ut-button:ut-readying:bg-blue-600/50 py-8 border-slate-300"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player Modal */}
      <AnimatePresence>
        {playingVideoId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          >
            <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl relative aspect-video border border-slate-800">
              <button 
                onClick={() => setPlayingVideoId(null)}
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors border border-white/10"
              >
                <X size={20} />
              </button>
              <LivePlayer videoId={playingVideoId} controls={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
