"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, BookOpen, FileText, BarChart2, ChevronRight } from "lucide-react";

export default function DashboardOverview() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // On PC, we don't need the overview, just redirect to batches directly
    if (window.innerWidth >= 768) {
      router.replace("/student/batches");
    }
  }, [router]);

  const options = [
    { name: "My Batches", href: "/student/batches", icon: Users, color: "bg-blue-500", textColor: "text-blue-600", lightBg: "bg-blue-50" },
    { name: "My Courses", href: "/student/courses", icon: BookOpen, color: "bg-purple-500", textColor: "text-purple-600", lightBg: "bg-purple-50" },
    { name: "Tests & Assessments", href: "/student/tests", icon: FileText, color: "bg-emerald-500", textColor: "text-emerald-600", lightBg: "bg-emerald-50" },
    { name: "Performance", href: "/student/performance", icon: BarChart2, color: "bg-orange-500", textColor: "text-orange-600", lightBg: "bg-orange-50" },
  ];

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <div className="space-y-4 md:hidden px-4 mt-4">
      <h2 className="text-xl font-bold text-foreground mb-4">Dashboard Options</h2>
      
      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <Link key={opt.name} href={opt.href} className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform">
            <div className={`p-2.5 rounded-xl ${opt.lightBg} ${opt.textColor}`}>
              <opt.icon size={22} />
            </div>
            <span className="font-semibold text-slate-800 text-[15px] flex-1">{opt.name}</span>
            <ChevronRight size={18} className="text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
