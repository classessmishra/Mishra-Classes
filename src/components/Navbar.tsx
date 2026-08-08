"use client";

import Link from "next/link";
import { Bell, MoreVertical, Menu, ArrowLeft, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { getUserProfile } from "@/actions/profile";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import NotificationBell from "./NotificationBell";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Batches", href: "/batches" },
  { name: "Chats", href: "/chats" },
  { name: "Store", href: "/store", badge: "NEW" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('mishra_user_profile');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const totalUnreadChats = Object.values(unreadCounts).reduce((a: any, b: any) => a + (b > 0 ? 1 : 0), 0) as number;
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if auth_role cookie exists
    const match = document.cookie.match(/(^| )auth_role=([^;]+)/);
    const idMatch = document.cookie.match(/(^| )user_id=([^;]+)/);
    
    if (match) {
      setRole(match[2]);
    } else {
      setRole(null);
    }
    
    if (idMatch) {
      getUserProfile(idMatch[2])
        .then(data => {
          if (data) {
            setUserProfile(data);
            try {
              localStorage.setItem('mishra_user_profile', JSON.stringify(data));
            } catch(e) {}
          }
        })
        .catch(err => {
          console.error("Ignored getUserProfile error:", err);
        });
    }

    // Close dropdowns on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    // Unread Chats Logic
    const loadUnread = () => {
      const s = localStorage.getItem('student_unread_counts');
      if (s) {
        try { setUnreadCounts(JSON.parse(s)); } catch(e) {}
      } else {
        setUnreadCounts({});
      }
    };
    loadUnread();
    
    window.addEventListener('storage', loadUnread);
    window.addEventListener('student_unread_updated', loadUnread);
    
    let chatChannel: any = null;
    const userIdMatch = document.cookie.match(/(^| )user_id=([^;]+)/);
    
    if (userIdMatch && role === 'student') {
      const syncOfflineStudentUnread = async (userId: string) => {
        try {
          const lastRead = JSON.parse(localStorage.getItem('student_last_read_times') || '{}');
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { data: memberGroups } = await supabase.from('chat_members').select('group_id').eq('user_id', userId);
          const groupIds = memberGroups?.map(m => m.group_id) || [];
          const { data: dmGroup } = await supabase.from('chat_groups').select('id').eq('is_direct_message', true).eq('name', `Support-${userId}`).maybeSingle();
          if (dmGroup) groupIds.push(dmGroup.id);

          if (groupIds.length > 0) {
            const { data: recentMessages } = await supabase
              .from('messages')
              .select('group_id, created_at')
              .in('group_id', groupIds)
              .gt('created_at', sevenDaysAgo.toISOString())
              .neq('sender_id', userId);

            if (recentMessages) {
              const counts: Record<string, number> = {};
              recentMessages.forEach(msg => {
                const groupLastRead = lastRead[msg.group_id] ? new Date(lastRead[msg.group_id]) : sevenDaysAgo;
                if (new Date(msg.created_at) > groupLastRead) {
                  counts[msg.group_id] = (counts[msg.group_id] || 0) + 1;
                }
              });
              localStorage.setItem('student_unread_counts', JSON.stringify(counts));
              loadUnread();
              window.dispatchEvent(new Event('student_unread_updated'));
            }
          }
        } catch (e) {}
      };
      syncOfflineStudentUnread(userIdMatch[2]);

      chatChannel = supabase
        .channel('navbar_global_messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
          if (payload.new.sender_id !== userIdMatch[2]) {
            const currentActive = localStorage.getItem('active_chat_id');
            if (currentActive !== payload.new.group_id) {
              setUnreadCounts(prev => {
                const next = { ...prev };
                next[payload.new.group_id] = (next[payload.new.group_id] || 0) + 1;
                localStorage.setItem('student_unread_counts', JSON.stringify(next));
                return next;
              });
            }
          }
        }).subscribe();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('storage', loadUnread);
      window.removeEventListener('student_unread_updated', loadUnread);
      if (chatChannel) supabase.removeChannel(chatChannel);
    }
  }, [pathname]); // Re-check on route change

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    document.cookie = "auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;";
    document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;";
    localStorage.removeItem("mishra_classes_cart");
    localStorage.removeItem("student_unread_counts");
    localStorage.removeItem("student_last_read_times");
    localStorage.removeItem("mishra_user_profile");
    setRole(null);
    setUserProfile(null);
    setDropdownOpen(false);
    window.location.href = "/login?logout=true";
  };

  const isAuthOrPublicPage = ['/about', '/terms', '/contact-us', '/cancellation-and-refunds', '/forgot-password', '/reset-password', '/login', '/signup', '/verify-email'].includes(pathname || '');

  if (pathname?.startsWith("/test/") || pathname?.startsWith("/admin") || pathname?.startsWith("/chats/admin") || pathname?.startsWith("/student/live-class")) return null;

  return (
    <nav className="fixed md:sticky top-0 z-[100] md:z-50 w-full bg-[#5B58FF] md:bg-white/80 md:backdrop-blur-md border-b border-[#5B58FF] md:border-border/40 print:hidden shadow-md md:shadow-none">
      <div className="container mx-auto px-4 h-[60px] md:h-16 flex items-center justify-between">
        {/* Logo / Mobile Icon */}
        <div className="flex items-center gap-3 md:gap-2">
          <div className="md:hidden w-8 h-8 rounded-full overflow-hidden bg-white shrink-0 shadow-sm border border-white/20">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
          </div>
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Mishra Classes Logo" className="h-8 w-auto object-contain hidden md:block" />
            <span className="text-[19px] md:text-xl font-medium md:font-bold text-white md:text-primary whitespace-nowrap">
              Mishra Classes
            </span>
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {!isAuthOrPublicPage && (role === 'admin' ? [
            { name: "Home", href: "/" },
            { name: "Dashboard", href: "/admin", badge: "ADMIN" },
            { name: "Store", href: "/store", badge: "NEW" },
          ] : role === 'student' ? [
            ...navLinks,
            { name: "Dashboard", href: "/student" }
          ] : navLinks).map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "relative text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.name}
                {link.badge && link.name !== "Chats" && (
                  <span className="ml-2 inline-flex items-center rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {link.badge}
                  </span>
                )}
                {link.name === "Chats" && totalUnreadChats > 0 && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {totalUnreadChats}
                  </span>
                )}
                {isActive && (
                  <span className="absolute -bottom-5 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {!isAuthOrPublicPage && (
            <div>
              {/* Desktop Bell */}
              <div className="hidden md:block">
                <NotificationBell iconSize={20} buttonClassName="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors" />
              </div>
              {/* Mobile Bell */}
              <div className="md:hidden block">
                <NotificationBell iconSize={24} buttonClassName="relative text-white cursor-pointer" />
              </div>
            </div>
          )}
          
          {!role ? (
            <>
              <Link href="/login" className="text-[15px] font-semibold text-white hover:underline md:hidden">
                Login
              </Link>
              <Link href="/login" className="hidden md:inline-flex items-center justify-center rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors">
                Login / Signup
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              {/* Desktop Profile Button */}
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="hidden md:flex items-center gap-2 hover:bg-slate-100 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-200"
              >
                {userProfile?.profile_photo_url ? (
                  <img src={userProfile.profile_photo_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm shadow-sm">
                    {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : (role === 'admin' ? 'A' : 'U')}
                  </div>
                )}
                <span className="text-sm font-bold text-slate-700 hidden sm:block">
                  {userProfile?.full_name || (role === 'admin' ? 'Admin' : 'Student')}
                </span>
              </button>
              
              {/* Mobile Profile Button */}
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="md:hidden w-8 h-8 rounded-full overflow-hidden border border-white/40 bg-white/20 flex items-center justify-center shadow-sm"
              >
                {userProfile?.profile_photo_url ? (
                  <img src={userProfile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white text-[#5B58FF] flex items-center justify-center font-bold text-xs">
                    {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : (role === 'admin' ? 'A' : 'S')}
                  </div>
                )}
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-border py-2 flex flex-col z-50">
                  <div className="px-4 py-3 border-b border-border mb-2 bg-slate-50 rounded-t-xl">
                    <p className="text-sm font-bold text-foreground truncate">{userProfile?.full_name || (role === 'admin' ? 'Admin User' : 'Student')}</p>
                    <p className="text-xs text-muted-foreground truncate">{userProfile?.phone || ''}</p>
                  </div>
                  {role === 'student' && (
                    <Link 
                      href="/student/profile" 
                      className="px-4 py-2 text-sm text-foreground hover:bg-muted font-medium"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left font-medium"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
