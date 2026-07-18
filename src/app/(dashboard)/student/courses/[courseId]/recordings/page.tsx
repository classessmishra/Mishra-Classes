"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRecordedClassesForCourse } from "@/actions/liveClasses";
import { PlayCircle, Clock, Calendar, ArrowLeft, Video } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CourseRecordingsPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecordings() {
      try {
        const data = await getRecordedClassesForCourse(courseId as string);
        setRecordings(data || []);
      } catch (err) {
        console.error("Failed to fetch recordings", err);
      } finally {
        setLoading(false);
      }
    }
    loadRecordings();
  }, [courseId]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Video className="text-indigo-600" size={28} />
              Class Recordings
            </h1>
            <p className="text-slate-500 font-medium mt-1">Watch past live sessions at your own pace.</p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-[1.5rem] p-4 h-72">
                <div className="w-full h-40 bg-slate-100 rounded-xl mb-4"></div>
                <div className="h-6 bg-slate-100 rounded-md w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recordings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <PlayCircle size={40} className="text-indigo-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">No Recordings Yet</h2>
            <p className="text-slate-500 font-medium max-w-md">Once live classes are completed and processed, their recordings will automatically appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recordings.map((rec, idx) => (
              <Link key={rec.id} href={`/student/live-class/${rec.id}`}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer h-full flex flex-col"
                >
                  {/* Thumbnail Area */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    {rec.meeting_link ? (
                      <img 
                        src={`https://img.youtube.com/vi/${rec.meeting_link}/maxresdefault.jpg`} 
                        alt={rec.topic}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback to hqdefault if maxres doesn't exist
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${rec.meeting_link}/hqdefault.jpg`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video size={40} className="text-slate-300" />
                      </div>
                    )}
                    
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                        <PlayCircle size={32} className="text-white ml-1" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white font-mono text-[11px] px-2 py-1 rounded-md tracking-wider flex items-center gap-1.5 shadow-lg">
                      <Clock size={12} className="text-slate-300" />
                      {rec.duration || "00:00:00"}
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {rec.topic}
                    </h3>
                    
                    <div className="mt-auto flex items-center justify-between text-slate-500 text-sm font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-indigo-400" />
                        {rec.start_time ? new Date(rec.start_time).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Unknown Date'}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-1 rounded text-slate-600">VOD</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
