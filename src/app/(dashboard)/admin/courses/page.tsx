"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";
import { createCourse, updateCourse, getCourses } from "@/actions/courses";
import AdminCourseModal from "@/components/AdminCourseModal";

export default function CourseManagerPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const fetchCourses = async () => {
    setLoading(true);
    const data = await getCourses();
    setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSave = async (data: any) => {
    if (editingCourse) {
      await updateCourse(editingCourse.id, data);
    } else {
      await createCourse(data);
    }
    await fetchCourses();
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const openEditModal = (course: any) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">Course Management</h1>
          <p className="text-slate-500 font-medium text-sm">Create, edit, and manage course validity durations.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={18} /> Add New Course
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col hover:shadow-lg transition-shadow">
              <div className="h-32 bg-slate-100 rounded-xl mb-4 overflow-hidden shrink-0">
                <img src={course.thumbnail_url || "/images/course_thumb.png"} alt={course.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 leading-tight">{course.title}</h3>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wider shrink-0 ${
                    course.course_type === 'live' || course.is_live ? 'bg-red-100 text-red-600' : 
                    course.course_type === 'test_series' ? 'bg-purple-100 text-purple-600' : 
                    course.course_type === 'offline' || course.course_type === 'notes' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {course.course_type === 'live' || (course.is_live && !course.course_type) ? 'LIVE' : 
                     course.course_type === 'test_series' ? 'TEST SERIES' : 
                     course.course_type === 'offline' || course.course_type === 'notes' ? 'CLASSROOM' : 'VOD'}
                  </span>
                </div>
                <div className="space-y-1 mb-4">
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5"><BookOpen size={14} /> ₹{course.price}</p>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5"><BookOpen size={14} /> Inst: {course.instructor_name || 'N/A'}</p>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5"><BookOpen size={14} /> Validity: {course.validity_days || 365} Days</p>
                </div>
              </div>
              <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
                <button 
                  onClick={() => openEditModal(course)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 text-sm"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors border border-blue-200 text-sm"
                >
                  <BookOpen size={16} /> Content
                </Link>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              No courses found. Create one to get started.
            </div>
          )}
        </div>
      )}

      <AdminCourseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingCourse}
      />
    </div>
  );
}
