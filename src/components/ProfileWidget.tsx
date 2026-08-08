"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();

export default function ProfileWidget() {
  const [user, setUser] = useState<{ id: string; name: string; role: string; photo: string | null }>({
    id: "",
    name: "Loading...",
    role: "...",
    photo: null
  });

  useEffect(() => {
    async function loadUser() {
      try {
        const id = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1];
        if (!id) return;

        if (id === '00000000-0000-0000-0000-000000000000') {
          setUser({ id, name: "Mishra Classes", role: "SUPERADMIN", photo: null });
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('full_name, role, profile_photo_url')
          .eq('id', id)
          .single();

        if (data) {
          setUser({
            id,
            name: data.full_name || "Admin User",
            role: data.role.toUpperCase(),
            photo: data.profile_photo_url
          });
        }
      } catch (err) {
        console.error("Error loading profile widget", err);
      }
    }
    loadUser();
  }, []);

  const getInitials = (name: string) => {
    if (!name || name === "Loading...") return "MC";
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Link href={user.id ? `/admin/users/${user.id}` : "#"} className="flex items-center gap-3.5 cursor-pointer group hover:bg-slate-50 p-2 rounded-2xl transition-all duration-300">
      {user.photo ? (
        <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-[14px] object-cover border border-slate-200 group-hover:shadow-md transition-all duration-300" />
      ) : (
        <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-black text-sm border border-blue-200/50 group-hover:shadow-md group-hover:shadow-blue-200/50 transition-all duration-300">
          {getInitials(user.name)}
        </div>
      )}
      <div className="hidden md:block text-left">
        <p className="text-sm font-bold text-slate-700 leading-none group-hover:text-blue-600 transition-colors">{user.name}</p>
        <p className="text-[11px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">{user.role}</p>
      </div>
    </Link>
  );
}
