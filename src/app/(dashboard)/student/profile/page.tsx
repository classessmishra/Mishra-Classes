"use client";

import { useEffect, useState, useRef } from "react";
import { getUserProfile, updateStudentProfile, uploadProfileMedia } from "@/actions/profile";
import { Camera, FileText, Upload, Save, Lock, UserCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadFiles } from "@/utils/uploadthing";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [profilePhoto, setProfilePhoto] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      let userId = null;
      const match = document.cookie.match(/(^| )user_id=([^;]+)/);
      if (match) {
        userId = match[2];
      } else {
        userId = "11111111-1111-1111-1111-111111111111"; // Fallback dev ID
      }

      const data = await getUserProfile(userId);
      if (data) {
        setProfile(data);
        setAddress(data.address || "");
        setBio(data.bio || "");
        setProfilePhoto(data.profile_photo_url || "");
        setDocuments(data.documents || []);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateStudentProfile(profile.id, {
        profile_photo_url: profilePhoto,
        documents,
        address,
        bio
      });
      alert("Profile updated successfully!");
    } catch (error: any) {
      alert("Failed to update profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        const { url } = await uploadProfileMedia(formData, 'profile-media');
        setProfilePhoto(url);
        
        // Auto-save the photo instantly
        if (profile) {
          await updateStudentProfile(profile.id, {
            profile_photo_url: url,
            documents,
            address,
            bio
          });
        }
      } catch (err: any) {
        console.error("Photo upload failed:", err);
        alert("Failed to upload photo.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        setIsUploading(true);
        const newDocs: { name: string; url: string; date: string }[] = [];
        for (const file of Array.from(files)) {
          if (file.type === "application/pdf") {
            const res = await uploadFiles("coursePdfUploader", { files: [file] });
            if (res && res.length > 0) {
              newDocs.push({ name: file.name, url: res[0].url, date: new Date().toISOString() });
            }
          } else {
             const formData = new FormData();
             formData.append("file", file);
             const { url } = await uploadProfileMedia(formData, 'profile-documents');
             newDocs.push({ name: file.name, url, date: new Date().toISOString() });
          }
        }
        setDocuments(prev => [...prev, ...newDocs]);
      } catch (err: any) {
        console.error("Doc upload failed:", err);
        alert("Failed to upload document.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 text-center text-red-500">Profile not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
          <p className="text-slate-500 text-sm">Manage your personal information and documents</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm shadow-blue-200"
        >
          <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Photo & Locked Identity */}
        <div className="md:col-span-1 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            
            <div className={`relative mt-8 mb-4 group ${isUploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`} onClick={() => !isUploading && fileInputRef.current?.click()}>
              {isUploading ? (
                 <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center text-slate-400 relative z-10">
                   <Loader2 size={40} className="animate-spin text-blue-500" />
                 </div>
              ) : profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-white" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center text-slate-400 relative z-10">
                  <UserCircle size={64} />
                </div>
              )}
              {!isUploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Camera className="text-white" size={28} />
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
            </div>

            <h2 className="text-xl font-bold text-slate-800">{profile.full_name}</h2>
            <p className="text-sm text-slate-500 mb-4">{profile.phone}</p>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
              Active Student
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 text-slate-700 mb-4">
              <Lock size={16} className="text-orange-500" />
              <h3 className="font-bold text-sm">Identity Information</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              These fields are locked for security purposes. To change your name or registered mobile number, please contact the Mishra Classes administration.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                <div className="w-full p-2.5 bg-slate-200/50 rounded-lg border border-slate-200 text-sm text-slate-600 cursor-not-allowed">
                  {profile.full_name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile Number</label>
                <div className="w-full p-2.5 bg-slate-200/50 rounded-lg border border-slate-200 text-sm text-slate-600 cursor-not-allowed">
                  {profile.phone}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                <div className="w-full p-2.5 bg-slate-200/50 rounded-lg border border-slate-200 text-sm text-slate-600 cursor-not-allowed">
                  {profile.email || "Not provided"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Details & Documents */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">Personal Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Residential Address</label>
                <textarea 
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm h-24 resize-none"
                  placeholder="Enter your full address..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bio / Academic Goals</label>
                <textarea 
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm h-24 resize-none"
                  placeholder="Tell us a little about your academic goals..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-800">Uploaded Documents</h3>
                <p className="text-xs text-slate-500 mt-1">Upload ID proofs, previous marksheets, etc.</p>
              </div>
              <button 
                onClick={() => docInputRef.current?.click()}
                disabled={isUploading}
                className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
                {isUploading ? "Uploading..." : "Upload New"}
              </button>
              <input type="file" ref={docInputRef} className="hidden" multiple accept="image/*,.pdf" onChange={handleDocUpload} disabled={isUploading} />
            </div>

            <div className="space-y-3">
              {documents.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl">
                  <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No documents uploaded yet</p>
                </div>
              ) : (
                documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50 rounded-lg hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center text-blue-600">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{doc.name}</p>
                        <p className="text-xs text-slate-500">{new Date(doc.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setDocuments(docs => docs.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
    </div>
  );
}
