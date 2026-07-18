"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";
import { ArrowLeft, LayoutDashboard, FileText, Megaphone, CalendarCheck } from "lucide-react";

export default function BatchDetailsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const pathname = usePathname();
  const unwrappedParams = use(params);
  const batchId = unwrappedParams.id;

  const navItems = [
    { name: "Overview", href: `/student/batches/${batchId}`, icon: <LayoutDashboard size={18} /> },
    { name: "Tests", href: `/student/batches/${batchId}/tests`, icon: <FileText size={18} /> },
    { name: "Announcements", href: `/student/batches/${batchId}/announcements`, icon: <Megaphone size={18} /> },
    { name: "Attendance", href: `/student/batches/${batchId}/attendance`, icon: <CalendarCheck size={18} /> },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Secondary Batch Sidebar */}
      <div className="w-full md:w-64 shrink-0">
        <Link 
          href="/student"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Back to All Batches
        </Link>
        
        <nav className="space-y-1 bg-card border border-border p-3 rounded-2xl shadow-sm">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className={isActive ? "text-white" : "text-muted-foreground"}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Batch Main Content */}
      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[60vh]">
        {children}
      </div>
    </div>
  );
}
