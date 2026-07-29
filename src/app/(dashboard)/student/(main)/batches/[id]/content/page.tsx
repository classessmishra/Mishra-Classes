"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { FolderOpen, FileText, Film, ArrowLeft, Video, Download } from "lucide-react";
import { getCourseFolders, getRecordedClasses, getCourseMaterials } from "@/actions/courseContent";
import { getCourseTests } from "@/actions/courseTests";
import Link from "next/link";

export default function StudyRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const batchId = unwrappedParams.id;
  
  const [course, setCourse] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      // Find course associated with this batch
      const { data: cData } = await supabase.from('courses').select('*').eq('batch_id', batchId).single();
      if (!cData) {
        setLoading(false);
        return;
      }
      setCourse(cData);
      
      const [fData, rData, mData, tData] = await Promise.all([
        getCourseFolders(cData.id),
        getRecordedClasses(cData.id),
        getCourseMaterials(cData.id),
        getCourseTests(cData.id)
      ]);
      
      setFolders(fData);
      setRecordings(rData);
      setMaterials(mData);
      setTests(tData);
      setLoading(false);
    }
    loadContent();
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return <div className="p-10 text-center text-slate-500">No course content available for this batch.</div>;
  }

  // Filter content based on activeFolder
  // if activeFolder is null, we either show all root items or just folders.
  // We'll show Folders at the top, and Root items below them if activeFolder is null.
  
  const displayRecordings = recordings.filter(r => (activeFolder === null ? !r.folder_id : r.folder_id === activeFolder));
  const displayMaterials = materials.filter(m => (activeFolder === null ? !m.folder_id : m.folder_id === activeFolder));
  const displayTests = tests.filter(t => (activeFolder === null ? !t.folder_id : t.folder_id === activeFolder));

  const hasItems = displayRecordings.length > 0 || displayMaterials.length > 0 || displayTests.length > 0;

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Study Room</h1>
          <p className="text-slate-500 font-medium mt-1">Access your course materials, videos, and tests.</p>
        </div>
      </div>

      {activeFolder === null ? (
        <>
          {folders.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FolderOpen className="text-amber-500" size={20} /> Course Folders
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {folders.map(folder => {
                  const itemsCount = recordings.filter(r => r.folder_id === folder.id).length 
                                   + materials.filter(m => m.folder_id === folder.id).length
                                   + tests.filter(t => t.folder_id === folder.id).length;
                  return (
                    <div 
                      key={folder.id} 
                      onClick={() => setActiveFolder(folder.id)}
                      className="group cursor-pointer flex flex-col"
                    >
                      <div className="w-full aspect-[4/3] relative drop-shadow-md group-hover:drop-shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                        {/* Folder Tab */}
                        <div className="absolute top-0 left-2 w-[45%] h-8 bg-amber-500 rounded-t-xl" />
                        
                        {/* Folder Back */}
                        <div className="absolute top-6 left-0 right-0 bottom-0 bg-amber-600 rounded-2xl rounded-tl-none shadow-inner" />
                        
                        {/* Paper Inside (slides up on hover) */}
                        <div className="absolute top-8 left-3 right-3 bottom-4 bg-white/95 rounded-t-xl transition-transform duration-500 ease-out group-hover:-translate-y-5 shadow-sm flex flex-col gap-2 p-3">
                          <div className="w-1/3 h-1.5 bg-slate-200 rounded-full" />
                          <div className="w-2/3 h-1.5 bg-slate-200 rounded-full" />
                          <div className="w-1/2 h-1.5 bg-slate-200 rounded-full" />
                        </div>
                        
                        {/* Folder Front Flap */}
                        <div className="absolute top-12 left-0 right-0 bottom-0 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl shadow-[0_-4px_15px_rgba(0,0,0,0.15)] border-t border-amber-300/60 p-4 flex flex-col justify-end">
                          <h3 className="font-extrabold text-white text-[15px] sm:text-lg tracking-tight line-clamp-1 mb-1 drop-shadow-sm">
                            {folder.name}
                          </h3>
                          <div className="flex items-center">
                            <span className="bg-amber-900/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold text-amber-50 tracking-wider">
                              {itemsCount} {itemsCount === 1 ? 'Item' : 'Items'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {hasItems && (
            <div>
               <h2 className="text-lg font-bold text-slate-800 mb-4">Other Contents</h2>
            </div>
          )}
        </>
      ) : (
        <div className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => setActiveFolder(null)}
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-3 rounded-xl transition-colors"
          >
            <ArrowLeft size={16} /> 
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <FolderOpen size={24} className="fill-amber-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">{folders.find(f => f.id === activeFolder)?.name}</h2>
          </div>
        </div>
      )}

      {/* RENDER ITEMS */}
      {(hasItems) ? (
        <div className="space-y-8">
          
          {/* VIDEOS */}
          {displayRecordings.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Film size={18} className="text-indigo-500" /> Video Lessons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayRecordings.map(rec => {
                  const ytId = (() => {
                    const urlOrId = rec.meeting_link || rec.video_url;
                    if (!urlOrId) return null;
                    if (urlOrId.length === 11 && !urlOrId.includes("/") && !urlOrId.includes(".")) return urlOrId;
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
                    const match = String(urlOrId).match(regExp);
                    return (match && match[2].length === 11) ? match[2] : null;
                  })();

                  return (
                    <div key={rec.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm group hover:shadow-lg transition-all flex flex-col">
                      <div className="aspect-video bg-slate-100 relative shrink-0">
                        {ytId ? (
                          <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} className="w-full h-full object-cover" alt="thumbnail" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Video className="text-slate-400" size={32}/></div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                           <a href={rec.video_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                             <Film size={20} />
                           </a>
                        </div>
                      </div>
                      <div className="p-4 flex-1">
                        <h4 className="font-bold text-slate-800 line-clamp-2 text-sm leading-tight">{rec.title}</h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MATERIALS */}
          {displayMaterials.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><FileText size={18} className="text-emerald-500" /> Study Materials</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayMaterials.map(mat => (
                  <a key={mat.id} href={mat.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 line-clamp-1 text-sm">{mat.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">{mat.type || 'Document'}</p>
                    </div>
                    <Download size={18} className="text-slate-300 group-hover:text-emerald-500 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* TESTS */}
          {displayTests.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><FileText size={18} className="text-purple-500" /> Tests & Assessments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayTests.map(t => (
                  <div key={t.id} className="flex flex-col sm:flex-row gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-purple-300 hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm mb-2 leading-tight">{t.tests?.title}</h4>
                      <div className="flex gap-4 text-xs text-slate-500 font-semibold mb-3">
                         <span>{t.tests?.duration_minutes} Mins</span>
                         <span>{t.tests?.total_marks} Marks</span>
                      </div>
                      <Link href={`/student/batches/${batchId}/tests`} className="inline-block text-xs font-bold bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
                        Go to Tests
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : activeFolder !== null && (
        <div className="py-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
           <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
           <h3 className="text-lg font-bold text-slate-700">This folder is empty</h3>
           <p className="text-sm text-slate-500 mt-1">Check back later for new content.</p>
        </div>
      )}

    </div>
  );
}
