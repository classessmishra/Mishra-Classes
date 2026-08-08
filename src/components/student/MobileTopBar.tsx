"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Menu, UserCircle } from 'lucide-react';
import { getUserProfile } from '@/actions/profile';
import NotificationBell from '../NotificationBell';
import Link from 'next/link';

export default function MobileTopBar() {
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchPhoto() {
      try {
        const match = document.cookie.match(/(^| )user_id=([^;]+)/);
        if (match) {
          const userId = match[2];
          const data = await getUserProfile(userId);
          if (data) {
            setUserProfile(data);
            if (data.profile_photo_url) {
              setProfilePhoto(data.profile_photo_url);
            }
          }
        }
      } catch (err) {
        console.error("Ignored getUserProfile error in MobileTopBar:", err);
      }
    }
    fetchPhoto();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {}
    document.cookie = "auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;";
    document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;";
    localStorage.removeItem("mishra_classes_cart");
    localStorage.removeItem("student_unread_counts");
    localStorage.removeItem("student_last_read_times");
    localStorage.removeItem("mishra_user_profile");
    window.location.href = "/login?logout=true";
  };

  return (
    <div className="fixed top-0 left-0 w-full h-[60px] bg-[#5B58FF] z-[100] flex items-center justify-between px-4 shadow-md md:hidden">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-white shrink-0 shadow-sm border border-white/20">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
        </div>
        <h1 className="text-white font-medium text-[19px] whitespace-nowrap">
          Mishra Classes
        </h1>
      </div>
      
      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        <NotificationBell 
          iconSize={24} 
          buttonClassName="relative text-white flex items-center justify-center p-1" 
        />
        <button 
          className="w-8 h-8 rounded-full overflow-hidden border border-white/30 bg-indigo-300 flex items-center justify-center cursor-pointer outline-none p-0"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserCircle className="text-white w-6 h-6" />
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute top-[45px] right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 flex flex-col z-[101]">
            {userProfile && (
              <div className="px-4 py-3 border-b border-gray-100 mb-1 bg-slate-50 rounded-t-xl">
                <p className="text-sm font-bold text-gray-800 truncate">{userProfile.full_name || 'Student'}</p>
                <p className="text-xs text-gray-500 truncate">{userProfile.phone || ''}</p>
              </div>
            )}
            <Link 
              href="/student/profile" 
              className="px-4 py-3 text-[15px] text-gray-800 hover:bg-gray-50 font-medium"
              onClick={() => setDropdownOpen(false)}
            >
              My Profile
            </Link>
            <div className="h-[1px] w-full bg-gray-100 my-1"></div>
            <button 
              onClick={handleLogout}
              className="px-4 py-3 text-[15px] text-red-600 hover:bg-red-50 text-left font-medium"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
