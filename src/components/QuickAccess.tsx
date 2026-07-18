"use client";

import { Play, CalendarDays, FileText, Video } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const items = [
  {
    title: "Live Courses",
    description: "Join ongoing sessions",
    icon: Play,
    href: "/courses?type=live",
    color: "bg-blue-50/80 hover:bg-blue-100",
    iconColor: "text-blue-600 bg-blue-100",
  },
  {
    title: "Live Schedule",
    description: "Plan your day",
    icon: CalendarDays,
    href: "/schedule",
    color: "bg-slate-50/80 hover:bg-slate-100",
    iconColor: "text-slate-600 bg-slate-200",
  },
  {
    title: "Test Series",
    description: "Evaluate progress",
    icon: FileText,
    href: "/tests",
    color: "bg-orange-50/80 hover:bg-orange-100",
    iconColor: "text-orange-600 bg-orange-100",
  },
  {
    title: "Recorded Courses",
    description: "Learn at your pace",
    icon: Video,
    href: "/courses?type=recorded",
    color: "bg-slate-50/80 hover:bg-slate-100",
    iconColor: "text-slate-600 bg-slate-200",
  },
];

export default function QuickAccess() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.title}
            href={item.href}
            className={cn(
              "group relative overflow-hidden flex flex-col p-6 rounded-[2rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] border border-slate-200/60 bg-white/60 backdrop-blur-xl",
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 relative z-10", item.iconColor)}>
              <Icon size={24} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-1.5 relative z-10 transition-colors group-hover:text-blue-700">
              {item.title}
            </h3>
            
            <p className="text-sm text-slate-500 font-medium relative z-10">
              {item.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
