"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LogOut, BookOpen, Users } from "lucide-react";
import ProfileWidget from "@/components/ProfileWidget";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPermissions() {
      const id = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1];
      if (!id) return;
      const { data } = await supabase.from('users').select('bio').eq('id', id).single();
      if (data?.bio) {
        try {
          const parsed = JSON.parse(data.bio);
          if (parsed.permissions) setPermissions(parsed.permissions);
        } catch(e) {}
      }
    }
    fetchPermissions();
  }, []);

  const handleLogout = () => {
    document.cookie = "auth_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("mishra_classes_cart");
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Basic Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <span className="text-xl font-bold text-white">Teacher Panel</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2">
          <Link href="/teacher" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600/20 text-blue-400 font-medium">
            <BookOpen size={20} /> Dashboard
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-slate-400 font-medium opacity-50 cursor-not-allowed">
            <Users size={20} /> My Classes
          </Link>
        </div>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-colors font-medium"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="font-semibold text-slate-800">Welcome to your Portal</h1>
          <ProfileWidget />
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
