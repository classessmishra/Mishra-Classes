"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Search, MoreVertical, Settings, UserPlus, Trash2, Calendar, Hash, UserCircle } from "lucide-react";
import { createBatch, getBatches, enrollStudent, updateBatch } from "@/actions/batches";
import { searchUsers } from "@/actions/users";
import Link from "next/link";

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Edit batch states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBatch, setEditBatch] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Enroll modal states
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [enrollingUser, setEnrollingUser] = useState<string | null>(null);
  
  // Batch Search States
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [showBatchSuggestions, setShowBatchSuggestions] = useState(false);
  
  const filteredBatches = batches.filter(b => 
    (b.name || "").toLowerCase().includes(batchSearchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    const data = await getBatches();
    setBatches(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBatch({ name, description });
      setName("");
      setDescription("");
      fetchBatches();
      setShowCreateModal(false);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBatch) return;
    setLoading(true);
    try {
      await updateBatch(editBatch.id, { name: editName, description: editDescription });
      fetchBatches();
      setShowEditModal(false);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (batch: any) => {
    setEditBatch(batch);
    setEditName(batch.name);
    setEditDescription(batch.description || "");
    setShowEditModal(true);
  };

  const fetchAllStudentsForEnroll = async () => {
    setSearching(true);
    const results = await searchUsers("");
    setSearchResults(results);
    setSearching(false);
  };

  const openEnrollModal = (batch: any) => {
    setActiveBatch(batch);
    setSearchQuery("");
    fetchAllStudentsForEnroll();
    setShowEnrollModal(true);
  };

  const handleSearchUsers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length === 0) {
      fetchAllStudentsForEnroll();
    } else {
      setSearching(true);
      const results = await searchUsers(q);
      setSearchResults(results);
      setSearching(false);
    }
  };

  const handleEnroll = async (userId: string) => {
    if (!activeBatch) return;
    setEnrollingUser(userId);
    try {
      await enrollStudent(activeBatch.id, userId);
      alert("Student enrolled successfully!");
      // Optionally update the local batch count here
      fetchBatches(); 
    } catch (err: any) {
      alert("Error enrolling student: " + err.message);
    } finally {
      setEnrollingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Batch Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage class batches and allocate students.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
        >
          <Plus size={18} /> Create New Batch
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div 
            className="relative w-72"
            onFocus={() => setShowBatchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowBatchSuggestions(false), 200)}
          >
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search batches..." 
              value={batchSearchQuery}
              onChange={(e) => {
                setBatchSearchQuery(e.target.value);
                setShowBatchSuggestions(true);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {showBatchSuggestions && batchSearchQuery.trim().length > 0 && filteredBatches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                {filteredBatches.slice(0, 5).map(batch => (
                  <div 
                    key={batch.id} 
                    className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                    onClick={() => {
                      setBatchSearchQuery(batch.name);
                      setShowBatchSuggestions(false);
                    }}
                  >
                    <div className="font-semibold text-slate-800 text-sm">{batch.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Users size={10} /> {batch.batch_students?.length || 0} Students</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200">Batch Info</th>
                <th className="px-6 py-4 border-b border-slate-200">Status</th>
                <th className="px-6 py-4 border-b border-slate-200">Students</th>
                <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Users size={20} />
                      </div>
                      <div>
                        <Link href={`/admin/batches/${batch.id}`}>
                          <p className="font-bold text-slate-800 text-base hover:text-blue-600 transition-colors">{batch.name}</p>
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Hash size={12} /> {batch.id.substring(0,8)}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> Created recently</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {batch.batch_students?.slice(0, 3).map((bs: any, i: number) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600 uppercase">
                            {bs.users?.full_name ? bs.users.full_name.charAt(0) : "S"}
                          </div>
                        ))}
                        {(!batch.batch_students || batch.batch_students.length === 0) && (
                          <div className="text-xs text-slate-400">No students</div>
                        )}
                      </div>
                      {(batch.batch_students?.length > 0) && (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          {batch.batch_students.length} Total
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEnrollModal(batch)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-bold transition-colors"
                      >
                        <UserPlus size={14} /> Enroll Student
                      </button>
                      <Link 
                        href={`/admin/batches/${batch.id}`}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Settings size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBatches.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No batches found</h3>
              <p className="text-slate-500 text-sm max-w-sm">You haven't created any batches yet. Click the "Create New Batch" button above to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Enroll Student Modal Overlay */}
      {showEnrollModal && activeBatch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="font-bold text-lg text-slate-800">Enroll Student</h2>
                <p className="text-xs text-slate-500">Add to {activeBatch.name}</p>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-700">
                &times;
              </button>
            </div>
            
            <div className="p-5 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={handleSearchUsers}
                  placeholder="Search student by name or mobile..." 
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-2 bg-slate-50/50 flex-1 min-h-[200px]">
              {searching ? (
                <div className="flex justify-center p-8 text-sm text-slate-500">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map(user => {
                    const isEnrolled = activeBatch?.batch_students?.some((bs: any) => bs.student_id === user.id);
                    return (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase">
                          {user.full_name ? user.full_name.charAt(0) : <UserCircle size={20} />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{user.full_name || "Unknown User"}</p>
                          <p className="text-xs text-slate-500">{user.phone}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleEnroll(user.id)}
                        disabled={isEnrolled || enrollingUser === user.id || user.phone === 'admin'}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-50 ${isEnrolled ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'}`}
                      >
                        {isEnrolled ? 'Added' : (enrollingUser === user.id ? 'Adding...' : 'Add')}
                      </button>
                    </div>
                  )})}
                </div>
              ) : (
                <div className="text-center p-8 text-sm text-slate-500">No students found.</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
              <button 
                onClick={() => setShowEnrollModal(false)}
                className="w-full bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal Overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">Create New Batch</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batch Name</label>
                <input 
                  required 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                  placeholder="e.g. Class 10 Board Excellence"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-24 text-sm" 
                  placeholder="Add some details about this batch..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={loading}
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal Overlay */}
      {showEditModal && editBatch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">Edit Batch Settings</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700">
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batch Name</label>
                <input 
                  required 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                />
                <p className="text-xs text-slate-500 mt-2">Note: Renaming the batch will also rename its associated chat group.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-24 text-sm" 
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={loading}
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
