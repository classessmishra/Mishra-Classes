"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayCircle, Video } from "lucide-react";
import { getStudentCourses } from "@/actions/courses";

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('cached_student_my_courses');
      if (cached) {
        setCourses(JSON.parse(cached));
        setLoading(false);
      }
    } catch(e) {}

    async function fetchMyCourses() {
      let userId = null;
      const match = document.cookie.match(/(^| )user_id=([^;]+)/);
      if (match) {
        userId = match[2];
      } else {
        userId = "11111111-1111-1111-1111-111111111111"; // Fallback for dev
      }

      const purchasedCourses = await getStudentCourses(userId);
      if (purchasedCourses) {
        setCourses(purchasedCourses);
        try { localStorage.setItem('cached_student_my_courses', JSON.stringify(purchasedCourses)); } catch(e) {}
      }
      setLoading(false);
    }

    fetchMyCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6 text-foreground">My Purchased Courses</h2>
        
        {courses.length === 0 ? (
          <div className="bg-card border border-border p-6 md:p-8 rounded-2xl md:rounded-3xl text-center shadow-sm">
            <div className="w-16 h-16 bg-muted mx-auto rounded-full flex items-center justify-center mb-4">
              <PlayCircle size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No courses found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You haven't purchased any courses yet. Visit the Store to explore premium content.
            </p>
            <Link href="/store" className="mt-6 inline-block bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl hover:-translate-y-0.5 transition-all">
              Browse Store
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link key={course.id} href={`/student/courses/${course.id}`}>
                <div className="group bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer flex flex-col h-full">
                  <div className="h-[160px] md:h-[200px] w-full bg-slate-100 rounded-xl mb-4 overflow-hidden shrink-0">
                    <img src={course.thumbnail_url || "/images/course_thumb.png"} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{course.title}</h3>
                    </div>
                    <p className="text-slate-500 text-xs mb-4">Valid till: {new Date(Date.now() + (course.validity_days || 365)*24*60*60*1000).toLocaleDateString()}</p>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-indigo-600 mt-auto bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <span className="flex items-center gap-2"><Video size={16}/> Study Room</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
