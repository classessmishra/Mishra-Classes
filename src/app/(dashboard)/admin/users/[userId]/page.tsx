"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserProfile, updateAdminProfileOverrides } from "@/actions/profile";
import { getBatches, enrollStudent, unenrollStudent, getStudentBatches } from "@/actions/batches";
import { getCourses, getStudentCourses, allocateCourse, revokeCourse } from "@/actions/courses";
import { adminResetPassword } from "@/actions/auth";
import { Save, ArrowLeft, UserCircle, BookOpen, MessageSquare, Users, X, Key, Lock, Unlock } from "lucide-react";
import Link from "next/link";

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
              <button 
                onClick={() => handleToggleLock('basic_info')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${profileLocks.basic_info ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {profileLocks.basic_info ? <><Lock size={14} /> Locked</> : <><Unlock size={14} /> Unlocked</>}
              </button>
            </div>
            
            {profile.basic_info ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Parent's Name</p>
                  <p className="text-sm text-slate-800">{profile.basic_info.parent_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Parent's Contact No</p>
                  <p className="text-sm text-slate-800">{profile.basic_info.parent_contact || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Address</p>
                  <p className="text-sm text-slate-800">{profile.basic_info.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">School/College</p>
                  <p className="text-sm text-slate-800">{profile.basic_info.school_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Section</p>
                  <p className="text-sm text-slate-800">{profile.basic_info.section || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Roll No</p>
                  <p className="text-sm text-slate-800">{profile.basic_info.roll_no || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No basic information provided yet.</p>
            )}
          </div>

          {/* Documents Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-600" /> Uploaded Documents
              </h3>
              <button 
                onClick={() => handleToggleLock('documents')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${profileLocks.documents ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {profileLocks.documents ? <><Lock size={14} /> Locked</> : <><Unlock size={14} /> Unlocked</>}
              </button>
            </div>
            
            {profile.documents && profile.documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.documents.map((doc: any, idx: number) => {
                  let docLabel = doc.type || doc.name;
                  switch(doc.type) {
                    case 'passport_photo': docLabel = 'Passport Size Photo'; break;
                    case 'sign': docLabel = 'Signature'; break;
                    case 'aadhar_front': docLabel = 'Aadhar Card Front'; break;
                    case 'aadhar_back': docLabel = 'Aadhar Card Back'; break;
                    case 'identity': docLabel = 'Identity Document'; break;
                    case 'marksheet_10': docLabel = '10th Marksheet'; break;
                    case 'marksheet_12': docLabel = '12th Marksheet'; break;
                  }
                  
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{docLabel}</p>
                        <p className="text-xs text-slate-500">{new Date(doc.date).toLocaleDateString()}</p>
                      </div>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded font-semibold hover:bg-indigo-200 transition-colors"
                      >
                        View
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No documents uploaded yet.</p>
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
    </div>
  );
}
