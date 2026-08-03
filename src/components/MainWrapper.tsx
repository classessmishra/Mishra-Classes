"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { savePushToken } from "@/actions/users";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = pathname?.startsWith("/test/") || pathname?.startsWith("/student/live-class");
  
  useEffect(() => {
    const checkAndSaveToken = async (tokenToSave?: string) => {
      // Get token either from argument or from window
      const token = tokenToSave || (typeof window !== 'undefined' ? (window as any).expoPushToken : null);
      if (!token) return;

      // Need a way to reliably get the user ID. 
      // If document.cookie is blocked by HttpOnly, this regex might fail.
      // But if it works for BottomNav, we'll try it here.
      const idMatch = document.cookie.match(/(^| )user_id=([^;]+)/);
      if (idMatch && idMatch[2]) {
        // Only save if it hasn't been saved in this session to prevent spamming
        if ((window as any)._lastSavedPushToken !== token) {
          await savePushToken(idMatch[2], token);
          (window as any)._lastSavedPushToken = token;
        }
      }
    };

    const handlePushToken = (e: any) => {
      checkAndSaveToken(e.detail);
    };
    
    // Check immediately in case it's already injected or route changed
    checkAndSaveToken();

    window.addEventListener('expoPushToken', handlePushToken);
    return () => window.removeEventListener('expoPushToken', handlePushToken);
  }, [pathname]);

  return (
    <div className={`flex-1 ${isFullScreen ? "h-full w-full flex flex-col" : "pt-[60px] md:pt-0 pb-16 md:pb-0"}`}>
      {children}
    </div>
  );
}
