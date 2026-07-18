"use client";

import { useState, useEffect } from "react";
import { Plus, Video, Calendar, Edit2, Trash2, Layout, Clock, Radio } from "lucide-react";
import Link from "next/link";
import { getCourses } from "@/actions/courses";
import { getAllLiveClasses, createLiveClass, deleteLiveClass, updateLiveClass, updateLiveClassGroup, deleteLiveClassGroup } from "@/actions/liveClasses";

export default function AdminLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState("");
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    // Set initial date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setScheduledDate(`${year}-${month}-${day}`);
    setScheduledTime(`${hours}:${minutes}`);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesData, coursesData] = await Promise.all([
        getAllLiveClasses(),
        getCourses()
      ]);
      setLiveClasses(classesData || []);
      setCourses(coursesData || []);
      if (coursesData && coursesData.length > 0 && courseIds.length === 0) {
        setCourseIds([]);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error fetching data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setScheduledDate(`${year}-${month}-${day}`);
    setScheduledTime(`${hours}:${minutes}`);
    setYoutubeVideoId("");
    setIsActive(false);
    if (courses.length > 0) setCourseIds([]);
  };

  const handleEdit = (cls: any) => {
    // cls is now a grouped class, so it has course_ids
    setEditingId(cls.youtube_video_id);
    setTitle(cls.title);
    setCourseIds(cls.course_ids || []);
    
    // Parse scheduled_time
    const dateObj = new Date(cls.scheduled_time);
    setScheduledDate(dateObj.toISOString().split('T')[0]);
    setScheduledTime(dateObj.toTimeString().substring(0, 5));
    
    setYoutubeVideoId(cls.youtube_video_id);
    setIsActive(cls.is_active);
  };

  const handleDelete = async (youtubeVideoId: string) => {
    if (confirm("Are you sure you want to delete this live class for all selected courses?")) {
      try {
        await deleteLiveClassGroup(youtubeVideoId);
        fetchData();
      } catch (err: any) {
        alert("Error: " + err.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || courseIds.length === 0 || !scheduledDate || !scheduledTime || !youtubeVideoId) {
      return alert("Please fill all required fields and select at least one course");
    }

    // Combine date and time
    const dateTimeString = `${scheduledDate}T${scheduledTime}:00`;
    const scheduledDateTime = new Date(dateTimeString).toISOString();

    const payload = {
      title,
      course_ids: courseIds,
      scheduled_time: scheduledDateTime,
      youtube_video_id: youtubeVideoId,
      is_active: isActive
    };

    setLoading(true);
    try {
      if (editingId) {
        await updateLiveClassGroup(editingId, payload);
        alert("Live class updated successfully!");
      } else {
        await createLiveClass(payload);
        alert("Live class scheduled successfully!");
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  const groupedClasses = Object.values(liveClasses.reduce((acc: any, cls: any) => {
    const key = cls.youtube_video_id;
    if (!acc[key]) {
      acc[key] = { ...cls, course_ids: [cls.course_id], courses_list: [cls.courses?.title] };
    } else {
      if (!acc[key].course_ids.includes(cls.course_id)) {
        acc[key].course_ids.push(cls.course_id);
        acc[key].courses_list.push(cls.courses?.title);
      }
    }
    return acc;
  }, {})) as any[];

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Radio className="text-red-500" /> Live Class Manager
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Schedule and manage YouTube live broadcasts for your courses.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Form Section */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-red-600"></div>
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-slate-800">{editingId ? "Edit Live Class" : "Schedule New"}</h3>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-sm font-bold text-red-500 hover:text-red-700">Cancel</button>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Class Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required
                  placeholder="e.g. Physics Revision Session"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Target Courses</label>
                <div className="w-full max-h-48 overflow-y-auto p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  {courses.map(c => (
                    <label key={c.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <input 
                        type="checkbox" 
                        checked={courseIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCourseIds(prev => [...prev, c.id]);
                          } else {
                            setCourseIds(prev => prev.filter(id => id !== c.id));
                          }
                        }}
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-700">{c.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={scheduledDate} 
                    onChange={e => setScheduledDate(e.target.value)} 
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Time</label>
                  <input 
                    type="time" 
                    value={scheduledTime} 
                    onChange={e => setScheduledTime(e.target.value)} 
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">YouTube Video ID</label>
                <input 
                  type="text" 
                  value={youtubeVideoId} 
                  onChange={e => setYoutubeVideoId(e.target.value)} 
                  required
                  placeholder="e.g. dQw4w9WgXcQ"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1 font-medium">11-character ID from YouTube URL (v=ID)</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={isActive} 
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded text-red-600 focus:ring-red-500 border-slate-300"
                />
                <div>
                  <label htmlFor="isActive" className="text-sm font-bold text-slate-800 cursor-pointer">Set Live Now</label>
                  <p className="text-xs text-slate-500">Students will see the "Join Now" button</p>
                </div>
              </div>

              <button 
                disabled={loading}
                type="submit" 
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50 mt-4"
              >
                {editingId ? <Edit2 size={18} /> : <Plus size={18} />} 
                {editingId ? "Update Schedule" : "Schedule Class"}
              </button>
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Layout size={18} className="text-slate-400" /> Scheduled Classes</h3>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
              {groupedClasses.map((cls) => (
                <div key={cls.youtube_video_id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${cls.is_active ? 'bg-red-50 border-red-200 text-red-500' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                      <Video size={24} className={cls.is_active ? "animate-pulse" : ""} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 truncate">{cls.title}</h4>
                        {cls.is_active && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Live</span>}
                      </div>
                      <p className="text-sm text-slate-500 font-medium truncate mb-2">{cls.courses_list?.join(", ")}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-md"><Calendar size={14} className="text-slate-400"/> {new Date(cls.scheduled_time).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-md"><Clock size={14} className="text-slate-400"/> {new Date(cls.scheduled_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <Link 
                      href={`/admin/live-classes/studio/${cls.id}`}
                      className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm text-center shadow-md transition-colors flex justify-center items-center gap-2"
                    >
                      <Radio size={16} /> Enter Studio
                    </Link>
                    <button onClick={() => handleEdit(cls)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(cls.youtube_video_id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {liveClasses.length === 0 && !loading && (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video size={32} className="text-slate-400" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">No Live Classes</h4>
                  <p className="text-slate-500 max-w-sm mx-auto">You haven't scheduled any live classes yet. Create one using the form.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
