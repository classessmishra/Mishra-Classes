"use client";

import { useState, useEffect } from "react";
import { Search, UserCircle, Phone, MoreVertical, Ban, Trash2, Calendar, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getAllUsers, deleteUser } from "@/actions/users";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this student? This will remove all their data, purchases, tests, and login access permanently.")) return;
    try {
      const res = await deleteUser(userId);
      if (res.success) {
        alert("Student deleted successfully!");
        fetchUsers();
      } else {
        alert("Failed to delete student: " + res.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
    (user.phone || "").includes(searchQuery)
  );

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return alert("No users to export");
    const headers = ["ID", "Full Name", "Phone", "Email", "Role", "Joined On", "Status"];
    const csvRows = filteredUsers.map(u => {
      const id = u.id;
      const name = `"${u.full_name || ''}"`;
      const phone = `"${u.phone || ''}"`;
      const email = `"${u.email || ''}"`;
      const role = u.role || 'student';
      const joined = new Date(u.created_at).toLocaleDateString();
      const status = u.phone === "admin" ? "Admin" : "Active";
      return [id, name, phone, email, role, joined, status].join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mishra_classes_students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all registered students and their access.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
            <ShieldCheck size={18} className="text-green-500" />
            <span className="font-bold text-slate-700 text-sm">{users.length} Total Users</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        
        {/* Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
          <div className="relative w-full sm:max-w-md" onFocus={() => setShowSuggestions(true)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or mobile..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
            />
            {showSuggestions && searchQuery.trim().length > 0 && filteredUsers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                {filteredUsers.slice(0, 5).map(user => (
                  <div 
                    key={user.id} 
                    className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                    onClick={() => {
                      setSearchQuery(user.full_name || user.phone || "");
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="font-semibold text-slate-800 text-sm">{user.full_name || 'Unknown User'}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={10} /> {user.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              Export CSV
            </button>
            <button onClick={() => window.print()} className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              Print PDF
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200">User Profile</th>
                <th className="px-6 py-4 border-b border-slate-200">Mobile Number</th>
                <th className="px-6 py-4 border-b border-slate-200">Joined On</th>
                <th className="px-6 py-4 border-b border-slate-200">Status</th>
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
                    Loading students...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 uppercase font-bold">
                          {user.full_name ? user.full_name.charAt(0) : <UserCircle size={20} />}
                        </div>
                        <div>
                          <Link href={`/admin/users/${user.id}`} className="font-bold text-slate-800 text-base hover:text-blue-600 hover:underline transition-colors">
                            {user.full_name || "Unknown User"}
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">ID: {user.id.substring(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" /> {user.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={14} /> 
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.phone === "admin" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors" title="Block User">
                          <Ban size={16} />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete User">
                          <Trash2 size={16} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Search size={32} className="mb-3 text-slate-300" />
                      <p className="font-semibold text-slate-700">No users found</p>
                      <p className="text-sm mt-1">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
