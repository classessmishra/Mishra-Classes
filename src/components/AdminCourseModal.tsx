"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadCourseThumbnail } from "@/actions/courses";

interface AdminCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

export default function AdminCourseModal({ isOpen, onClose, onSave, initialData }: AdminCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([""]);
  
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    course_type: "live",
    detailed_description: "",
    instructor_name: "Prof. A. Mishra",
    validity_days: "365",
    total_hours: "100+ Hours",
    language: "Hinglish",
    skill_level: "Beginner to Advanced",
    has_certificate: false,
    demo_video_url: "",
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        price: initialData.price ? initialData.price.toString() : "",
        course_type: initialData.course_type || (initialData.is_live ? "live" : "recorded"),
        detailed_description: initialData.detailed_description || "",
        instructor_name: initialData.instructor_name || "Prof. A. Mishra",
        validity_days: initialData.validity_days ? initialData.validity_days.toString() : "365",
        total_hours: initialData.total_hours || "100+ Hours",
        language: initialData.language || "Hinglish",
        skill_level: initialData.skill_level || "Beginner to Advanced",
        has_certificate: initialData.has_certificate || false,
        demo_video_url: initialData.demo_video_url || "",
      });
      setFeatures(initialData.syllabus_features?.length ? initialData.syllabus_features : [""]);
      setThumbnailPreview(initialData.thumbnail_url || null);
    } else {
      setFormData({
        title: "", price: "", course_type: "live", detailed_description: "",
        instructor_name: "Prof. A. Mishra", validity_days: "365",
        total_hours: "100+ Hours", language: "Hinglish", skill_level: "Beginner to Advanced",
        has_certificate: false, demo_video_url: "",
      });
      setFeatures([""]);
      setThumbnailPreview(null);
    }
    setThumbnailFile(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let thumbnail_url = initialData?.thumbnail_url || null;
      if (thumbnailFile) {
        const fileData = new FormData();
        fileData.append("file", thumbnailFile);
        const res = await uploadCourseThumbnail(fileData);
        thumbnail_url = res.url;
      }

      await onSave({
        title: formData.title,
        price: parseFloat(formData.price),
        is_live: formData.course_type === "live",
        course_type: formData.course_type,
        detailed_description: formData.detailed_description,
        instructor_name: formData.instructor_name,
        validity_days: parseInt(formData.validity_days, 10),
        total_hours: formData.total_hours,
        language: formData.language,
        skill_level: formData.skill_level,
        has_certificate: formData.has_certificate,
        demo_video_url: formData.demo_video_url,
        syllabus_features: features.filter(f => f.trim() !== ""),
        thumbnail_url
      });
      onClose();
    } catch (error: any) {
      alert("Error saving course: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">{initialData ? "Edit Course" : "Create New Course"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Course Title</label>
            <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Class 10th Board Prep" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Price (₹)</label>
              <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="499" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Course Type</label>
              <select value={formData.course_type} onChange={(e) => setFormData({...formData, course_type: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="live">Live Batch</option>
                <option value="recorded">Recorded Video</option>
                <option value="test_series">Test Series</option>
                <option value="offline">Offline/Classroom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Instructor Name</label>
              <input type="text" value={formData.instructor_name} onChange={(e) => setFormData({...formData, instructor_name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Prof. A. Mishra" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Validity (in Days)</label>
              <input type="number" min="1" value={formData.validity_days} onChange={(e) => setFormData({...formData, validity_days: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="365" />
              <p className="text-[10px] text-slate-500 mt-1">E.g. 365 for 1 year, 180 for 6 months.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Total Duration</label>
              <input type="text" value={formData.total_hours} onChange={(e) => setFormData({...formData, total_hours: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="E.g. 120+ Hours" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Language</label>
              <input type="text" value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="E.g. Hinglish" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Skill Level</label>
              <input type="text" value={formData.skill_level} onChange={(e) => setFormData({...formData, skill_level: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="E.g. Beginner to Advanced" />
            </div>
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.has_certificate} onChange={(e) => setFormData({...formData, has_certificate: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-bold text-slate-700">Includes Completion Certificate</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Demo Video URL (Optional)</label>
            <input type="url" value={formData.demo_video_url} onChange={(e) => setFormData({...formData, demo_video_url: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="https://youtube.com/watch?v=..." />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Description</label>
            <textarea rows={4} value={formData.detailed_description} onChange={(e) => setFormData({...formData, detailed_description: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Course details..." />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Syllabus / Features</label>
            <div className="space-y-2">
              {features.map((feature, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={feature} onChange={(e) => { const n = [...features]; n[idx] = e.target.value; setFeatures(n); }} className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder={`Feature ${idx + 1}`} />
                  {features.length > 1 && (
                    <button type="button" onClick={() => setFeatures(features.filter((_, i) => i !== idx))} className="px-4 bg-red-50 text-red-600 hover:bg-red-100 transition-colors rounded-xl font-bold">X</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setFeatures([...features, ""])} className="text-sm text-blue-600 font-bold hover:underline mt-2 inline-block">+ Add Feature</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Course Thumbnail</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors relative overflow-hidden group">
              {(thumbnailPreview || thumbnailFile) ? (
                <div className="w-full h-40 relative">
                  <img src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : thumbnailPreview!} className="w-full h-full object-cover rounded-lg" alt="Thumbnail" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                    <span className="text-white font-bold">Click to change</span>
                  </div>
                </div>
              ) : (
                <>
                  <ImageIcon size={32} className="text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm text-slate-500 font-medium">Click to upload image</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 shrink-0">
          <button disabled={loading} onClick={handleSubmit} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-70 transition-all flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Save Course"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
