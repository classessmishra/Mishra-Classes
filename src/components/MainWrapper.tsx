"use client";

import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = pathname?.startsWith("/test/") || pathname?.startsWith("/student/live-class");
  
  return (
    <div className={`flex-1 ${isFullScreen ? "h-full w-full flex flex-col" : "pt-[60px] md:pt-0 pb-16 md:pb-0"}`}>
      {children}
    </div>
  );
}
