"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserProfile, updateAdminProfileOverrides, uploadProfileMedia } from "@/actions/profile";
import { getBatches, enrollStudent, unenrollStudent, getStudentBatches } from "@/actions/batches";
import { getCourses, getStudentCourses, allocateCourse, revokeCourse } from "@/actions/courses";
import { adminResetPassword } from "@/actions/auth";
import { Save, ArrowLeft, UserCircle, BookOpen, MessageSquare, Users, X, Key, Lock, Unlock, FileText, Upload, Loader2, Eye, CheckCircle2, Download, Edit2 } from "lucide-react";
import Link from "next/link";
import { uploadFiles } from "@/utils/uploadthing";

const REQUIRED_DOCS = [
  { id: 'passport_photo', label: 'Passport Size Photo' },
  { id: 'sign', label: 'Signature' },
  { id: 'aadhar_front', label: 'Aadhar Card Front' },
  { id: 'aadhar_back', label: 'Aadhar Card Back' },
  { id: 'identity', label: 'Identity Document' },
  { id: 'marksheet_10', label: '10th Marksheet (PDF/Image)' },
  { id: 'marksheet_12', label: '12th Marksheet (PDF/Image)' }
];

export default function AdminStudentDetailPage() {
  const { userId } = useParams();
  const router = useRouter();
  
  // Data States
  const [profile, setProfile] = useState<any>(null);
  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [studentBatches, setStudentBatches] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [studentCourses, setStudentCourses] = useState<any[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allocatingBatch, setAllocatingBatch] = useState(false);
  const [allocatingCourse, setAllocatingCourse] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [mapLocation, setMapLocation] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [profileLocks, setProfileLocks] = useState({ basic_info: false, documents: false });
  
  // New States for Basic Info & Documents
  const [basicInfo, setBasicInfo] = useState({
    parent_name: '', parent_contact: '', address: '', school_name: '', section: '', roll_no: ''
  });
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{url: string, type: string} | null>(null);
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [isEditingDocuments, setIsEditingDocuments] = useState(false);

  const loadData = async () => {
    const data = await getUserProfile(userId as string);
    if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setAddress(data.address || "");
      setMapLocation(data.map_location || "");
      setNewPassword(""); // Never show current hashed password
      if (data.profile_locks) {
        setProfileLocks({
          basic_info: data.profile_locks.basic_info || false,
          documents: data.profile_locks.documents || false
        });
      }
      setDocuments(data.documents || []);
      if (data.basic_info) {
        setBasicInfo({
          parent_name: data.basic_info.parent_name || '',
          parent_contact: data.basic_info.parent_contact || '',
          address: data.basic_info.address || '',
          school_name: data.basic_info.school_name || '',
          section: data.basic_info.section || '',
          roll_no: data.basic_info.roll_no || '',
        });
      }
    }
    
    // Load all options
    const [batchesData, coursesData, sBatches, sCourses] = await Promise.all([
      getBatches(),
      getCourses(),
      getStudentBatches(userId as string),
      getStudentCourses(userId as string)
    ]);
    
    setAllBatches(batchesData);
    setAllCourses(coursesData);
    setStudentBatches(sBatches);
    setStudentCourses(sCourses);
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleSaveIdentity = async () => {
    setSaving(true);
    try {
      await updateAdminProfileOverrides(userId as string, {
        full_name: fullName,
        phone,
        email,
        ...(profile.role === 'admin' ? { address, map_location: mapLocation } : {})
      });
      alert("Student identity updated successfully.");
    } catch (err: any) {
      alert("Failed to update identity: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    setResettingPassword(true);
    try {
      const res = await adminResetPassword(userId as string, newPassword);
      if (!res.success) throw new Error(res.error);
      alert("Student password has been securely reset.");
      setNewPassword("");
    } catch (err: any) {
      alert("Failed to reset password: " + err.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleToggleLock = async (section: 'basic_info' | 'documents') => {
    const newLocks = { ...profileLocks, [section]: !profileLocks[section] };
    setProfileLocks(newLocks); // optimistic UI
    try {
      await updateAdminProfileOverrides(userId as string, { profile_locks: newLocks });
    } catch (err: any) {
      alert("Failed to update lock status: " + err.message);
      setProfileLocks(profileLocks); // revert on failure
    }
  };

  const handleSaveBasicInfo = async () => {
    setSaving(true);
    try {
      await updateAdminProfileOverrides(userId as string, { basic_info: basicInfo });
      alert("Basic information updated successfully.");
      
      // Update local profile state to reflect changes and remove the "N/A" fallback view if they toggle lock
      setProfile({ ...profile, basic_info: basicInfo });
      setIsEditingBasicInfo(false);
    } catch (err: any) {
      alert("Failed to save basic info: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSpecificDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploadingDocId(docType);
        let url = '';
        if (file.type === "application/pdf") {
          const res = await uploadFiles("coursePdfUploader", { files: [file] });
          if (res && res.length > 0) url = res[0].url || '';
        } else {
          const formData = new FormData();
          formData.append("file", file);
          const res = await uploadProfileMedia(formData, 'profile-documents');
          if (res?.error) throw new Error(res.error);
          url = res.url || '';
        }

        if (url) {
          const newDoc = { type: docType, name: file.name, url, date: new Date().toISOString() };
          
          setDocuments(prev => {
            const filtered = prev.filter((d: any) => d.type !== docType);
            return [...filtered, newDoc];
          });
          
          if (profile) {
            const currentDocs = documents || [];
            const filteredDocs = currentDocs.filter((d: any) => d.type !== docType);
            const updateRes = await updateAdminProfileOverrides(userId as string, {
              documents: [...filteredDocs, newDoc]
            });
            
            // update profile state 
            setProfile({ ...profile, documents: [...filteredDocs, newDoc] });
          }
        }
      } catch (err: any) {
        console.error("Doc upload failed:", err);
        alert("Failed to upload document: " + (err.message || "Please check file size and try again."));
      } finally {
        setUploadingDocId(null);
      }
    }
  };

  const [isDownloadingDoc, setIsDownloadingDoc] = useState(false);

  const handleDownloadDocument = async (url: string, type: string) => {
    if (isDownloadingDoc) return;
    setIsDownloadingDoc(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      const isPdf = url.toLowerCase().endsWith('.pdf') || blob.type.includes('pdf');
      let mimeType = blob.type;
      let filename = `Document_${type}_${Date.now()}`;
      if (isPdf) {
        filename += '.pdf';
        if (!mimeType) mimeType = 'application/pdf';
      } else {
        let ext = '.jpg';
        if (mimeType.includes('png')) ext = '.png';
        else if (url.toLowerCase().endsWith('.png')) ext = '.png';
        else if (url.toLowerCase().endsWith('.jpeg')) ext = '.jpeg';
        
        filename += ext;
        if (!mimeType) mimeType = 'image/jpeg';
      }

      if (typeof window !== 'undefined' && (window as any).ReactNativeWebView && (window as any).ReactNativeWebView.postMessage) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          (window as any).ReactNativeWebView.postMessage(JSON.stringify({
            type: 'DOWNLOAD_FILE',
            base64: base64data,
            filename: filename,
            mimeType: mimeType,
            dialogTitle: `Download ${type}`
          }));
          setIsDownloadingDoc(false);
        };
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
        setIsDownloadingDoc(false);
      }
    } catch (err) {
      console.error("Failed to download document via fetch, falling back to window.open:", err);
      window.open(url, '_blank');
      setIsDownloadingDoc(false);
    }
  };

  // Batch Management
  const handleAllocateBatch = async () => {
    if (!selectedBatch) return;
    setAllocatingBatch(true);
    try {
      await enrollStudent(selectedBatch, userId as string);
      setSelectedBatch("");
      await loadData();
    } catch (err: any) {
      alert("Failed to allocate to batch: " + err.message);
    } finally {
      setAllocatingBatch(false);
    }
  };

  const handleRemoveBatch = async (batchId: string) => {
    if (!confirm("Are you sure you want to remove the student from this batch?")) return;
    try {
      await unenrollStudent(batchId, userId as string);
      await loadData();
    } catch (err: any) {
      alert("Failed to remove from batch: " + err.message);
    }
  };

  // Course Management
  const handleAllocateCourse = async () => {
    if (!selectedCourse) return;
    setAllocatingCourse(true);
    try {
      await allocateCourse(userId as string, selectedCourse);
      setSelectedCourse("");
      await loadData();
    } catch (err: any) {
      alert("Failed to allocate course: " + err.message);
    } finally {
      setAllocatingCourse(false);
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to revoke access to this course?")) return;
    try {
      await revokeCourse(userId as string, courseId);
      await loadData();
    } catch (err: any) {
      alert("Failed to revoke course: " + err.message);
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
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-bold mb-4">Student not found.</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{profile.role === 'admin' ? "Admin Control Panel" : "Student Control Panel"}</h1>
          <p className="text-slate-500 text-sm">Managing {profile.full_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Identity Control */}
        <div className={`space-y-6 ${profile.role === 'admin' ? 'lg:col-span-3 max-w-xl mx-auto w-full' : 'lg:col-span-1'}`}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
            {profile.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-sm bg-white border border-slate-200 mb-4" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <UserCircle size={48} />
              </div>
            )}
            <h2 className="text-lg font-bold text-slate-800">{profile.full_name}</h2>
            <p className="text-sm text-slate-500 mb-2">ID: {profile.id.substring(0,8)}</p>
            {profile.role === 'admin' ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                System Administrator
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                Active Student
              </span>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserCircle size={18} className="text-blue-600" /> {profile.role === 'admin' ? 'Admin Profile' : 'Identity Override'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              {profile.role === 'admin' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Coaching Address (Prints on Receipt)</label>
                    <textarea 
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm resize-y min-h-[80px]"
                      placeholder="e.g. 123 Education Street, City, State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Google Maps Link (Optional)</label>
                    <input 
                      type="url" 
                      value={mapLocation}
                      onChange={e => setMapLocation(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                      placeholder="https://maps.app.goo.gl/..."
                    />
                  </div>
                </>
              )}
              <button 
                onClick={handleSaveIdentity}
                disabled={saving}
                className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-slate-900 transition-colors disabled:opacity-50 mt-2"
              >
                {saving ? "Saving..." : `Save ${profile.role === 'admin' ? 'Profile' : 'Identity'} Changes`}
              </button>
            </div>
          </div>

          {/* Secure Password Reset */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Key size={18} className="text-red-600" /> Reset Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              For security reasons, the student's current password is encrypted and hidden. You can reset it below.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm font-mono"
                  placeholder="Enter a new secure password"
                />
              </div>
              <button 
                onClick={handleResetPassword}
                disabled={resettingPassword || !newPassword}
                className="w-full bg-red-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 mt-2"
              >
                {resettingPassword ? "Resetting..." : `Reset ${profile.role === 'admin' ? 'Admin' : 'Student'} Password`}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Profile details & Allocations (Hidden for Admins) */}
        {profile.role !== 'admin' && (
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Information Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserCircle size={18} className="text-teal-600" /> Basic Information
              </h3>
              <div className="flex items-center gap-2">
                {!isEditingBasicInfo && (
                  <button 
                    onClick={() => setIsEditingBasicInfo(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    <Edit2 size={14} /> Edit Details
                  </button>
                )}
                <button 
                  onClick={() => handleToggleLock('basic_info')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${profileLocks.basic_info ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {profileLocks.basic_info ? <><Lock size={14} /> Locked</> : <><Unlock size={14} /> Unlocked</>}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent's Name</label>
                <input 
                  type="text"
                  value={basicInfo.parent_name}
                  onChange={e => setBasicInfo({...basicInfo, parent_name: e.target.value})}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  placeholder="Enter parent's full name"
                  disabled={!isEditingBasicInfo}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent's Contact No.</label>
                <input 
                  type="tel"
                  value={basicInfo.parent_contact}
                  onChange={e => setBasicInfo({...basicInfo, parent_contact: e.target.value})}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  placeholder="10-digit mobile number"
                  disabled={!isEditingBasicInfo}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Address</label>
                <textarea 
                  value={basicInfo.address}
                  onChange={e => setBasicInfo({...basicInfo, address: e.target.value})}
                  className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm h-20 resize-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  placeholder="Enter your complete residential address"
                  disabled={!isEditingBasicInfo}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">School / College Name</label>
                <input 
                  type="text"
                  value={basicInfo.school_name}
                  onChange={e => setBasicInfo({...basicInfo, school_name: e.target.value})}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  placeholder="Enter current school or college name"
                  disabled={!isEditingBasicInfo}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section</label>
                <input 
                  type="text"
                  value={basicInfo.section}
                  onChange={e => setBasicInfo({...basicInfo, section: e.target.value})}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  placeholder="e.g. A, B, Science"
                  disabled={!isEditingBasicInfo}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Roll No.</label>
                <input 
                  type="text"
                  value={basicInfo.roll_no}
                  onChange={e => setBasicInfo({...basicInfo, roll_no: e.target.value})}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  placeholder="Enter school roll no."
                  disabled={!isEditingBasicInfo}
                />
              </div>
            </div>
            
            {isEditingBasicInfo && (
              <div className="mt-4 flex justify-end gap-2">
                <button 
                  onClick={() => {
                    setIsEditingBasicInfo(false);
                    // reset to current profile data
                    if (profile.basic_info) setBasicInfo(profile.basic_info);
                  }}
                  disabled={saving}
                  className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveBasicInfo}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save size={16} /> {saving ? "Saving..." : "Save Basic Info"}
                </button>
              </div>
            )}
          </div>

          {/* Documents Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-600" /> Uploaded Documents
              </h3>
              <div className="flex items-center gap-2">
                {!isEditingDocuments && (
                  <button 
                    onClick={() => setIsEditingDocuments(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    <Edit2 size={14} /> Edit Details
                  </button>
                )}
                <button 
                  onClick={() => handleToggleLock('documents')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${profileLocks.documents ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {profileLocks.documents ? <><Lock size={14} /> Locked</> : <><Unlock size={14} /> Unlocked</>}
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {REQUIRED_DOCS.map(docType => {
                const uploadedDoc = documents.find((d: any) => d.type === docType.id || (!d.type && d.name.includes(docType.id)));
                return (
                  <div key={docType.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200 bg-white rounded-xl">
                    <div className="flex items-center gap-3">
                      {uploadedDoc ? (
                        <CheckCircle2 className="text-green-500 shrink-0" size={24} />
                      ) : (
                        <div className="w-6 h-6 shrink-0 rounded-full border-2 border-slate-300 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{docType.label}</p>
                        {uploadedDoc && <p className="text-xs text-green-600 font-medium">Uploaded Successfully</p>}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                      {uploadedDoc && (
                        <button
                          onClick={() => setViewingDoc({ url: uploadedDoc.url, type: docType.id })}
                          className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg text-sm font-semibold border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-2"
                        >
                          <Eye size={16} /> View
                        </button>
                      )}
                      
                      {isEditingDocuments && (
                        <label className={`flex-1 sm:flex-none justify-center cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold border transition-colors flex items-center gap-2 ${
                          uploadedDoc 
                            ? "border-slate-200 text-slate-600 hover:bg-slate-50" 
                            : "border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100"
                        }`}>
                          {uploadingDocId === docType.id ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          {uploadedDoc ? "Re-upload" : "Upload"}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept={docType.id.includes('marksheet') ? "image/*,.jpg,.jpeg,.png,.pjp,.pdf" : "image/*,.jpg,.jpeg,.png,.pjp"} 
                            onChange={(e) => handleSpecificDocUpload(e, docType.id)} 
                            disabled={uploadingDocId !== null}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {isEditingDocuments && (
              <div className="mt-4 flex justify-end gap-2">
                <button 
                  onClick={() => setIsEditingDocuments(false)}
                  className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setIsEditingDocuments(false)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
                >
                  <Save size={16} /> Save Documents
                </button>
              </div>
            )}
          </div>

          {/* Batches Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users size={18} className="text-purple-600" /> Batch Enrollment
            </h3>
            
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Current Batches</h4>
              <div className="space-y-2">
                {studentBatches.length > 0 ? studentBatches.map(batch => (
                  <div key={batch.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg bg-slate-50">
                    <span className="font-semibold text-slate-700 text-sm">{batch.name}</span>
                    <button 
                      onClick={() => handleRemoveBatch(batch.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                      title="Remove from batch"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400 italic">Student is not enrolled in any batches.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Add to New Batch</h4>
              <div className="flex gap-3">
                <select 
                  value={selectedBatch}
                  onChange={e => setSelectedBatch(e.target.value)}
                  className="flex-1 p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="">-- Select a Batch --</option>
                  {allBatches.filter(b => !studentBatches.find(sb => sb.id === b.id)).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <button 
                  onClick={handleAllocateBatch}
                  disabled={!selectedBatch || allocatingBatch}
                  className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {allocatingBatch ? "Adding..." : "Add to Batch"}
                </button>
              </div>
            </div>
          </div>

          {/* Courses Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-orange-600" /> Course Access
            </h3>
            
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Current Courses</h4>
              <div className="space-y-2">
                {studentCourses.length > 0 ? studentCourses.map(course => (
                  <div key={course.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg bg-slate-50">
                    <span className="font-semibold text-slate-700 text-sm">{course.title}</span>
                    <button 
                      onClick={() => handleRemoveCourse(course.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                      title="Revoke course access"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400 italic">Student has no direct course access.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Manually Grant Course</h4>
              <div className="flex gap-3">
                <select 
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  className="flex-1 p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="">-- Select a Course --</option>
                  {allCourses.filter(c => !studentCourses.find(sc => sc.id === c.id)).map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <button 
                  onClick={handleAllocateCourse}
                  disabled={!selectedCourse || allocatingCourse}
                  className="bg-orange-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {allocatingCourse ? "Granting..." : "Grant Access"}
                </button>
              </div>
            </div>
          </div>

        </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" /> Document Viewer
              </h3>
              <button 
                onClick={() => setViewingDoc(null)}
                className="p-1.5 bg-slate-200 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100 min-h-[50vh]">
              {viewingDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe src={viewingDoc.url} className="w-full h-[70vh] rounded border border-slate-300" title="Document PDF" />
              ) : (
                <img src={viewingDoc.url} alt="Document" className="max-w-full max-h-[70vh] object-contain rounded shadow-sm" />
              )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => handleDownloadDocument(viewingDoc.url, viewingDoc.type)}
                disabled={isDownloadingDoc}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDownloadingDoc ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {isDownloadingDoc ? "Downloading..." : "Download"}
              </button>
              <button 
                onClick={() => setViewingDoc(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
