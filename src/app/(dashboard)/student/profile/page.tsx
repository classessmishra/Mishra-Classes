"use client";

import { useEffect, useState, useRef } from "react";
import { getUserProfile, updateStudentProfile, uploadProfileMedia } from "@/actions/profile";
import { Camera, FileText, Upload, Save, Lock, Unlock, UserCircle, Loader2, ChevronDown, ChevronUp, CheckCircle2, Eye, X, Download } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
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

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  
  const [basicInfo, setBasicInfo] = useState({
    parent_name: '', parent_contact: '', address: '', school_name: '', section: '', roll_no: ''
  });
  
  const [bio, setBio] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [openSection, setOpenSection] = useState<'basic' | 'docs' | null>('basic');
  const [profileLocks, setProfileLocks] = useState({ basic_info: false, documents: false });
  const [viewingDoc, setViewingDoc] = useState<{url: string, type: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setBio(data.bio || "");
        setProfilePhoto(data.profile_photo_url || "");
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
        if (data.profile_locks) {
          setProfileLocks({
            basic_info: data.profile_locks.basic_info || false,
            documents: data.profile_locks.documents || false
          });
        }
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updateRes = await updateStudentProfile(profile.id, {
        profile_photo_url: profilePhoto,
        documents,
        bio,
        basic_info: basicInfo
      });
      if (updateRes?.error) throw new Error(updateRes.error);
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
        setUploadingDocId('main_profile');
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadProfileMedia(formData, 'profile-media');
        if (res?.error) throw new Error(res.error);
        const url = res.url || '';
        setProfilePhoto(url);
        
        // Auto-save the photo instantly
        if (profile) {
          const updateRes = await updateStudentProfile(profile.id, {
            profile_photo_url: url,
            documents,
            bio,
            basic_info: basicInfo
          });
          if (updateRes?.error) throw new Error(updateRes.error);
        }
      } catch (err: any) {
        console.error("Photo upload failed:", err);
        alert("Failed to upload photo: " + (err.message || "Unknown error"));
      } finally {
        setUploadingDocId(null);
      }
    }
  };

  const handleSpecificDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Warning: Maximum file size allowed is 5MB. Please choose a smaller file.");
        return;
      }
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
          
          // Auto-save instantly
          if (profile) {
            const currentDocs = documents || [];
            const filteredDocs = currentDocs.filter((d: any) => d.type !== docType);
            const updateRes = await updateStudentProfile(profile.id, {
              profile_photo_url: profilePhoto,
              documents: [...filteredDocs, newDoc],
              bio,
              basic_info: basicInfo
            });
            if (!updateRes.success) throw new Error(updateRes.error);
          }
          alert("Document uploaded successfully");
        }
      } catch (err: any) {
        console.error(err);
        alert(err.message || "Failed to upload document");
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
              
              <div className={`relative mt-8 mb-4 group ${uploadingDocId === 'main_profile' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`} onClick={() => uploadingDocId !== 'main_profile' && fileInputRef.current?.click()}>
                {uploadingDocId === 'main_profile' ? (
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
                {uploadingDocId !== 'main_profile' && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Camera className="text-white" size={28} />
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingDocId !== null} />
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
                These fields are locked for security purposes. To change your name or registered mobile number, please contact administration.
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

          {/* Right Column: Accordions */}
          <div className="md:col-span-2 space-y-4">
            
            {/* Accordion 1: Basic Information */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <button 
                onClick={() => setOpenSection(openSection === 'basic' ? null : 'basic')}
                className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">1</div>
                  <h3 className="font-bold text-slate-800">Basic Information</h3>
                </div>
                <div className="flex items-center gap-3">
                  {profileLocks.basic_info ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-semibold"><Lock size={12} /> Locked</span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold"><Unlock size={12} /> Unlocked</span>
                  )}
                  {openSection === 'basic' ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
                </div>
              </button>
              
              {openSection === 'basic' && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent's Name</label>
                      <input 
                        type="text"
                        value={basicInfo.parent_name}
                        onChange={e => setBasicInfo({...basicInfo, parent_name: e.target.value})}
                        className={`w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm ${profileLocks.basic_info ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                        placeholder="Enter parent's full name"
                        disabled={profileLocks.basic_info}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent's Contact No.</label>
                      <input 
                        type="tel"
                        value={basicInfo.parent_contact}
                        onChange={e => setBasicInfo({...basicInfo, parent_contact: e.target.value})}
                        className={`w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm ${profileLocks.basic_info ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                        placeholder="10-digit mobile number"
                        disabled={profileLocks.basic_info}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Address</label>
                      <textarea 
                        value={basicInfo.address}
                        onChange={e => setBasicInfo({...basicInfo, address: e.target.value})}
                        className={`w-full p-3 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm h-20 resize-none ${profileLocks.basic_info ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                        placeholder="Enter your complete residential address"
                        disabled={profileLocks.basic_info}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">School / College Name</label>
                      <input 
                        type="text"
                        value={basicInfo.school_name}
                        onChange={e => setBasicInfo({...basicInfo, school_name: e.target.value})}
                        className={`w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm ${profileLocks.basic_info ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                        placeholder="Enter current school or college name"
                        disabled={profileLocks.basic_info}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section</label>
                      <input 
                        type="text"
                        value={basicInfo.section}
                        onChange={e => setBasicInfo({...basicInfo, section: e.target.value})}
                        className={`w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm ${profileLocks.basic_info ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                        placeholder="e.g. A, B, Science"
                        disabled={profileLocks.basic_info}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Roll No.</label>
                      <input 
                        type="text"
                        value={basicInfo.roll_no}
                        onChange={e => setBasicInfo({...basicInfo, roll_no: e.target.value})}
                        className={`w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm ${profileLocks.basic_info ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                        placeholder="Enter school roll no."
                        disabled={profileLocks.basic_info}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Your Documents */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <button 
                onClick={() => setOpenSection(openSection === 'docs' ? null : 'docs')}
                className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">2</div>
                  <h3 className="font-bold text-slate-800">Your Documents</h3>
                </div>
                <div className="flex items-center gap-3">
                  {profileLocks.documents ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-semibold"><Lock size={12} /> Locked</span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold"><Unlock size={12} /> Unlocked</span>
                  )}
                  {openSection === 'docs' ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
                </div>
              </button>
              
              {openSection === 'docs' && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                  <p className="text-sm text-slate-500 mb-6">Please upload clear images or PDF files for the required documents. <strong className="text-red-500">Upload limit: less than 5MB per file.</strong></p>
                  
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
                            
                            {!profileLocks.documents && (
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
                </div>
              )}
            </div>

          </div>
        </div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
