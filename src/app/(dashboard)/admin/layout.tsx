"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, Users, BookOpen, Clock, 
  FileText, Megaphone, CheckSquare, MessageSquare, 
  Search, Bell, LogOut, UserCircle, Image as ImageIcon, AlertTriangle, Archive, Tag, UserCog, Radio
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import AdminTopBarWidget from "@/components/AdminTopBarWidget";
import ProfileWidget from "@/components/ProfileWidget";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [userRole, setUserRole] = useState("admin");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [totalUnreadChats, setTotalUnreadChats] = useState(0);

  useEffect(() => {
    async function loadData() {
      const id = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1];
      const role = document.cookie.split('; ').find(row => row.startsWith('auth_role='))?.split('=')[1];
      if (id) setAdminId(id);
      if (role) setUserRole(role);
      
      if (role === 'teacher' && id) {
        // Fetch teacher permissions directly here using a dynamic import of supabase
        // to avoid any client/server component conflicts if any
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.from('users').select('bio').eq('id', id).single();
        if (data?.bio) {
          try {
            const parsed = JSON.parse(data.bio);
            if (parsed.permissions) setPermissions(parsed.permissions);
          } catch(e) {}
        }
      }
    }
    loadData();

    const loadUnread = () => {
      try {
        const counts = JSON.parse(localStorage.getItem('admin_unread_counts') || '{}');
        const count = Object.values(counts).reduce((a: any, b: any) => a + (b > 0 ? 1 : 0), 0) as number;
        setTotalUnreadChats(count);
      } catch(e) {}
    };
    
    // Sync offline unread counts on load
    const syncOfflineUnread = async () => {
      try {
        const lastRead = JSON.parse(localStorage.getItem('admin_last_read_times') || '{}');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('group_id, created_at')
          .gt('created_at', sevenDaysAgo.toISOString())
          .neq('sender_id', "00000000-0000-0000-0000-000000000000");

        if (recentMessages) {
          const counts: Record<string, number> = {};
          recentMessages.forEach(msg => {
            const groupLastRead = lastRead[msg.group_id] ? new Date(lastRead[msg.group_id]) : sevenDaysAgo;
            if (new Date(msg.created_at) > groupLastRead) {
              counts[msg.group_id] = (counts[msg.group_id] || 0) + 1;
            }
          });
          localStorage.setItem('admin_unread_counts', JSON.stringify(counts));
          loadUnread();
          window.dispatchEvent(new Event('admin_unread_updated'));
        }
      } catch(e) {
        console.error("Failed to sync offline unread", e);
      }
    };
    
    syncOfflineUnread();
    window.addEventListener('admin_unread_updated', loadUnread);

    const channel = supabase
      .channel(`global_admin_messages_layout_${Math.random()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new.sender_id === "00000000-0000-0000-0000-000000000000") return;
        const activeChat = localStorage.getItem('active_chat_id');
        if (activeChat === payload.new.group_id) return;
        try {
          const counts = JSON.parse(localStorage.getItem('admin_unread_counts') || '{}');
          counts[payload.new.group_id] = (counts[payload.new.group_id] || 0) + 1;
          localStorage.setItem('admin_unread_counts', JSON.stringify(counts));
          
          // Auto update last read if we receive a message in the active chat? (already handled by early return)
          loadUnread();
          window.dispatchEvent(new Event('admin_unread_updated'));
        } catch(e) {}
      })
      .subscribe();

    return () => {
      window.removeEventListener('admin_unread_updated', loadUnread);
      supabase.removeChannel(channel);
    };
  }, []);

  const allSidebarLinks = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, perm: null },
    { name: "Student Directory", href: "/admin/users", icon: UserCircle, perm: "view_students" },
    { name: "Live Classes", href: "/admin/live-classes", icon: Radio, perm: "view_live_classes" },
    { name: "Chat Center", href: "/admin/chats", icon: MessageSquare, perm: "view_chats" },
    { name: "Attendance Register", href: "/admin/attendance", icon: CheckSquare, perm: "view_attendance" },
    { name: "Store / Courses", href: "/admin/courses", icon: BookOpen, perm: "view_store" },
    { name: "Study Material", href: "/admin/study-materials", icon: BookOpen, perm: "view_study_materials" },
    { name: "Batch Management", href: "/admin/batches", icon: Users, perm: "view_batches" },
    { name: "Tests & Exams", href: "/admin/tests", icon: FileText, perm: "view_tests" },
    { name: "Test Bank", href: "/admin/test-bank", icon: Archive, perm: "view_test_bank" },
    { name: "Announcements", href: "/admin/communications", icon: Megaphone, perm: "view_announcements" },
    { name: "Coupons", href: "/admin/coupons", icon: Tag, perm: "view_coupons" },
    { name: "Advertisements", href: "/admin/advertisements/builder", icon: ImageIcon, perm: "view_advertisements" },
    { name: "Staff & Roles", href: "/admin/staff", icon: UserCog, perm: "admin_only" },
  ];

  const sidebarLinks = allSidebarLinks.filter(link => {
    if (userRole === 'admin') return true;
    if (link.perm === 'admin_only') return false;
    if (link.perm && !permissions.includes(link.perm)) return false;
    return true;
  });

  const handleLogout = () => {
    document.cookie = "auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;";
    document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;";
    localStorage.removeItem("mishra_classes_cart");
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans fixed inset-0 z-[100] print:h-auto print:overflow-visible print:relative print:inset-auto">
      
      {/* Premium Sidebar */}
      <aside className="w-[280px] bg-[#0A0F1C] text-slate-300 flex flex-col shrink-0 h-full relative border-r border-white/10 shadow-[20px_0_40px_rgb(0,0,0,0.1)] z-50 print:hidden">
        {/* Abstract Sidebar Glow */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
        
        <div className="h-20 flex items-center gap-4 px-8 border-b border-white/5 shrink-0 relative z-10">
          <img src="/logo.png" alt="Mishra Classes Logo" className="h-9 w-auto object-contain bg-white rounded-xl p-1.5 shadow-sm shadow-white/10" />
          <span className="text-xl font-black text-white tracking-wide">Admin Panel</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-1.5 custom-scrollbar relative z-10">
          <div className="px-4 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Menu</div>
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${
                  isActive 
                    ? "text-white shadow-lg shadow-blue-900/50" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl -z-10" />}
                <Icon size={18} className={`transition-transform duration-300 ${isActive ? "text-white" : "text-slate-500 group-hover:scale-110 group-hover:text-blue-400"}`} />
                <span className="relative z-10 flex-1">{link.name}</span>
                {link.name === "Chat Center" && totalUnreadChats > 0 && (
                  <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                    {totalUnreadChats}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-6 border-t border-white/5 shrink-0 relative z-10">
          <button 
            onClick={handleLogout}
            className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 w-full text-left border border-transparent hover:border-red-500/20"
          >
            <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full print:h-auto print:block">
        
        {/* Topbar */}
        <header className="h-20 bg-white/70 backdrop-blur-2xl border-b border-slate-200/60 flex items-center justify-between px-8 shrink-0 z-20 shadow-[0_4px_30px_rgb(0,0,0,0.02)] print:hidden">
          {/* Mobile Menu Button (Placeholder for future) */}
          <div className="flex items-center md:hidden">
            <span className="font-bold text-slate-800">Admin Panel</span>
          </div>

          {/* Top Bar Widget */}
          <AdminTopBarWidget />

          {/* Right side actions */}
          <div className="flex items-center gap-6">
            <NotificationBell 
              iconSize={22} 
              buttonClassName="relative p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300" 
            />
            <div className="h-8 w-px bg-slate-200"></div>
            <ProfileWidget />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50 relative print:overflow-visible print:p-0 print:bg-white">
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none print:hidden" />
          <div className="max-w-[1600px] mx-auto h-full relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
