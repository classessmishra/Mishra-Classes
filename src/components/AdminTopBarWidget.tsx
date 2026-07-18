"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export default function AdminTopBarWidget() {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateStr(now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Avoid hydration mismatch by not rendering the date on the server
  if (!dateStr) return <div className="hidden md:flex items-center gap-4 w-96" />;

  return (
    <div className="hidden md:flex items-center gap-4">
      {/* Date & Time */}
      <div className="flex items-center gap-2 bg-slate-50/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-slate-200/80 shadow-sm">
        <Sparkles size={16} className="text-blue-500" />
        <span className="text-sm font-bold text-slate-600">{dateStr}</span>
      </div>

      {/* System Status Indicator */}
      <div className="flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm rounded-2xl px-3 py-2 border border-emerald-200/80 shadow-sm">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </div>
        <span className="text-[11px] font-black text-emerald-700 tracking-wider uppercase mt-0.5">All Systems Operational</span>
      </div>
    </div>
  );
}
