"use client";

import { useState, useEffect } from "react";
import { UserPlus, Users, Phone, Mail, ShieldCheck, Settings, Trash2, Calendar, Loader2, Shield } from "lucide-react";
import { createStaffUser, getStaffUsers, updateTeacherPermissions, deleteUser } from "@/actions/users";

export default function StaffRolesPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [permModalUser, setPermModalUser] = useState<any>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [updatingPerms, setUpdatingPerms] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "teacher" // default
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    const data = await getStaffUsers();
    setStaff(data);
    setLoading(false);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this staff member? This will remove all their data and login access permanently.")) return;
    try {
      const res = await deleteUser(userId);
      if (res.success) {
        alert("Staff deleted successfully!");
        fetchStaff();
      } else {
        alert("Failed to delete staff: " + res.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createStaffUser(formData);
      if (res.success) {
        alert("Staff user created successfully!");
        setFormData({ fullName: "", email: "", phone: "", password: "", role: "teacher" });
        setShowModal(false);
        fetchStaff();
      } else {
        alert("Error: " + res.error);
      }
    } catch (err: any) {
      alert("An unexpected error occurred.");
    } finally {
      setCreating(false);
    }
  };

  const openPermModal = (user: any) => {
    setPermModalUser(user);
    try {
      if (user.bio) {
        const parsed = JSON.parse(user.bio);
        if (parsed.permissions && Array.isArray(parsed.permissions)) {
          setSelectedPerms(parsed.permissions);
          return;
        }
      }
    } catch(e) {}
    setSelectedPerms([]);
  };

  const togglePerm = (perm: string) => {
    setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  const handleExportCSV = () => {
    if (staff.length === 0) return alert("No staff to export");
    const headers = ["ID", "Full Name", "Phone", "Email", "Role", "Joined On"];
    const csvRows = staff.map(u => {
      const id = u.id;
      const name = `"${u.full_name || ''}"`;
      const phone = `"${u.phone || ''}"`;
      const email = `"${u.email || ''}"`;
      const role = u.role || 'teacher';
      const joined = new Date(u.created_at).toLocaleDateString();
      return [id, name, phone, email, role, joined].join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mishra_classes_staff_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSavePermissions = async () => {
    if (!permModalUser) return;
    setUpdatingPerms(true);
    try {
      const res = await updateTeacherPermissions(permModalUser.id, selectedPerms);
      if (res.success) {
        alert("Permissions updated successfully!");
        setPermModalUser(null);
        fetchStaff();
      } else {
        alert("Error: " + res.error);
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setUpdatingPerms(false);
    }
  };

  const PERMISSIONS_LIST = [
    { id: "manage_batches", label: "Manage Batches", desc: "Can view and edit batch details." },
    { id: "manage_students", label: "Manage Students", desc: "Can view and edit student directory." },
    { id: "manage_tests", label: "Manage Tests", desc: "Can create and evaluate tests." },
    { id: "manage_store", label: "Manage Courses (Store)", desc: "Can add/edit courses and revenue." },
    { id: "manage_chats", label: "Manage Chats", desc: "Can respond to student chats." },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff & Roles</h1>
          <p className="text-slate-500 text-sm mt-1">Manage admins, teachers, and system access.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleExportCSV} className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Export CSV
          </button>
          <button onClick={() => window.print()} className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Print PDF
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
          >
            <UserPlus size={18} /> Add New Staff
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200">Staff Profile</th>
                <th className="px-6 py-4 border-b border-slate-200">Contact Details</th>
                <th className="px-6 py-4 border-b border-slate-200">Role</th>
                <th className="px-6 py-4 border-b border-slate-200">Joined On</th>
                <th className="px-6 py-4 border-b border-slate-200 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Loading staff records...
                  </td>
                </tr>
              ) : staff.length > 0 ? (
                staff.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 uppercase font-bold ${user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                          {user.full_name ? user.full_name.charAt(0) : "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base">{user.full_name || "Unknown Staff"}</p>
                          <p className="text-xs text-slate-500 mt-0.5">ID: {user.id.substring(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 space-y-1">
                      {user.email && (
                        <div className="flex items-center gap-2 text-xs">
                          <Mail size={12} className="text-slate-400" /> {user.email}
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-2 text-xs">
                          <Phone size={12} className="text-slate-400" /> {user.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 gap-1.5">
                          <ShieldCheck size={12} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 gap-1.5">
                          <Users size={12} /> Teacher
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={14} /> 
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <div className="flex items-center justify-end gap-2">
                        {user.role === 'teacher' && (
                          <button onClick={() => openPermModal(user)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Permissions">
                            <Shield size={16} />
                          </button>
                        )}
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Settings">
                          <Settings size={16} />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Remove Access">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Users size={32} className="mb-3 text-slate-300" />
                      <p className="font-semibold text-slate-700">No staff members found</p>
                      <p className="text-sm mt-1">Click the button above to add an admin or teacher.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">Add New Staff</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Email ID</label>
                  <input 
                    required 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Mobile Number</label>
                  <input 
                    required 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                    placeholder="+91..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                    placeholder="Secure password"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Assign Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={creating}
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {creating ? (
                    <><Loader2 size={16} className="animate-spin" /> Creating...</>
                  ) : "Create Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permModalUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">Set Permissions</h2>
              <button onClick={() => setPermModalUser(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                &times;
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-500 mb-4">Select which modules <span className="font-bold text-slate-800">{permModalUser.full_name}</span> can access.</p>
              
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                {PERMISSIONS_LIST.map(perm => (
                  <label key={perm.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      checked={selectedPerms.includes(perm.id)}
                      onChange={() => togglePerm(perm.id)}
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{perm.label}</div>
                      <div className="text-xs text-slate-500">{perm.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-5 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setPermModalUser(null)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={updatingPerms}
                  onClick={handleSavePermissions}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {updatingPerms ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : "Save Access"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
