"use client";

import React, { useEffect, useState } from 'react';
import { Menu, UserCircle } from 'lucide-react';
import { getUserProfile } from '@/actions/profile';
import NotificationBell from '../NotificationBell';

export default function MobileTopBar() {
  const [profilePhoto, setProfilePhoto] = useState<string>("");

  useEffect(() => {
    async function fetchPhoto() {
      try {
        const match = document.cookie.match(/(^| )user_id=([^;]+)/);
        if (match) {
          const userId = match[2];
          const data = await getUserProfile(userId);
          if (data && data.profile_photo_url) {
            setProfilePhoto(data.profile_photo_url);
          }
        }
      } catch (err) {
        console.error("Ignored getUserProfile error in MobileTopBar:", err);
      }
    }
    fetchPhoto();
  }, []);
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
      
      <div className="flex items-center gap-4">
        <NotificationBell 
          iconSize={24} 
          buttonClassName="relative text-white flex items-center justify-center p-1" 
        />
        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 bg-indigo-300 flex items-center justify-center">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserCircle className="text-white w-6 h-6" />
          )}
        </div>
      </div>
    </div>
  );
}
