"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, PlayCircle, FileText, CheckCircle2, Clock, Globe, Award, TrendingUp, Video } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CheckoutModal from "@/components/CheckoutModal";

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      // Fetch course
      const { data } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (data) setCourse(data);

      // Check if purchased
      const match = document.cookie.match(/(^| )user_id=([^;]+)/);
      const userId = match ? match[2] : null;
      if (userId && data) {
        const { data: purchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('student_id', userId)
          .eq('course_id', courseId)
          .single();
        if (purchase) setHasPurchased(true);
      }
      setLoading(false);
    }
    loadCourse();
  }, [courseId]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading course details...</div>;
  if (!course) return <div className="p-10 text-center text-red-500 font-bold">Course not found.</div>;

  const syllabus = course.syllabus_features || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/store" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Store
      </Link>
      
      <div className="bg-card border border-border p-8 rounded-3xl mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/3 aspect-video bg-muted rounded-2xl flex items-center justify-center text-muted-foreground overflow-hidden relative">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <PlayCircle size={48} className="opacity-50" />
            )}
            {(course.course_type === 'live' || (course.is_live && !course.course_type)) && (
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                LIVE BATCH
              </div>
            )}
            {course.course_type === 'test_series' && (
              <div className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                TEST SERIES
              </div>
            )}
            {(course.course_type === 'offline' || course.course_type === 'notes') && (
              <div className="absolute top-3 left-3 bg-yellow-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                OFFLINE CLASS
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col h-full justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground mb-3">{course.title}</h1>
              <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                {course.detailed_description || "No description provided."}
              </p>
              
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-black text-slate-800">₹{course.price}</span>
                <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                  Special Offer
                </span>
              </div>
            </div>

            <div className="mt-4">
              {hasPurchased ? (
                <button 
                  onClick={() => router.push(`/student/batches/${course.batch_id || courseId}`)}
                  className="w-full md:w-auto bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm"
                >
                  Go to My Course
                </button>
              ) : (
                <button 
                  onClick={() => setShowCheckout(true)}
                  className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Enroll Now - ₹{course.price}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Course Features & Syllabus</h2>
            {syllabus.length > 0 ? (
              <ul className="space-y-3">
                {syllabus.map((feature: string, idx: number) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">Syllabus details will be updated soon.</p>
            )}
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-slate-50 p-6 rounded-2xl border border-border sticky top-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 mb-4 text-lg">Course Snapshot</h3>
              <ul className="space-y-4 text-sm text-slate-700">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Clock size={16} /></div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Duration</p>
                    <p className="font-medium">{course.total_hours || "100+ Hours"}</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><Globe size={16} /></div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Language</p>
                    <p className="font-medium">{course.language || "Hinglish"}</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><TrendingUp size={16} /></div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Skill Level</p>
                    <p className="font-medium">{course.skill_level || "Beginner to Advanced"}</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${course.has_certificate ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                    <Award size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Certificate</p>
                    <p className="font-medium">{course.has_certificate ? "Yes, Included" : "Not Included"}</p>
                  </div>
                </li>
              </ul>
            </div>

            {course.demo_video_url && (
              <div className="pt-6 border-t border-slate-200">
                <a href={course.demo_video_url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                  <Video size={18} /> Watch Free Demo
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <CheckoutModal 
        isOpen={showCheckout} 
        onClose={() => setShowCheckout(false)} 
        course={course} 
      />
    </div>
  );
}
