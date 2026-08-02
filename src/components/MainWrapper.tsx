"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { savePushToken } from "@/actions/users";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = pathname?.startsWith("/test/") || pathname?.startsWith("/student/live-class");
  
  useEffect(() => {
    const handlePushToken = async (e: any) => {
      const token = e.detail;
      const idMatch = document.cookie.match(/(^| )user_id=([^;]+)/);
      if (idMatch && token) {
        await savePushToken(idMatch[2], token);
      }
    };
    
    // Check if token is already injected in window
    if (typeof window !== 'undefined' && (window as any).expoPushToken) {
      handlePushToken({ detail: (window as any).expoPushToken });
    }

    window.addEventListener('expoPushToken', handlePushToken);
    return () => window.removeEventListener('expoPushToken', handlePushToken);
  }, []);

  return (
    <div className={`flex-1 ${isFullScreen ? "h-full w-full flex flex-col" : "pt-[60px] md:pt-0 pb-16 md:pb-0"}`}>
      {children}
    </div>
  );
}
