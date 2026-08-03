"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, FileText, BarChart2, MessageSquare, BookOpen, ChevronRight, LayoutDashboard } from "lucide-react";
import MobileTopBar from "@/components/student/MobileTopBar";
import ResponsiveWrapper from "@/components/student/ResponsiveWrapper";
import { useSessionEnforcer } from "@/hooks/useSessionEnforcer";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  useSessionEnforcer();

  const navItems = [
    { name: "My Batches", href: "/student/batches", icon: Users },
    { name: "My Courses", href: "/student/courses", icon: BookOpen },
    { name: "Tests & Assessments", href: "/student/tests", icon: FileText },
    { name: "Performance", href: "/student/performance", icon: BarChart2 },
  ];

  return (
    <div className="relative min-h-[100dvh] w-full bg-white md:bg-slate-50 flex flex-col md:block m-0 p-0 overflow-x-hidden">
      <MobileTopBar />

      {/* Abstract Background Elements */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none hidden md:block" />
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none mix-blend-multiply hidden md:block" />

      {/* Premium Header - Desktop Only */}
      <div className="hidden md:block relative border-b border-slate-200/60 bg-white/60 backdrop-blur-2xl">
        <div className="container mx-auto px-4 py-10 max-w-7xl relative z-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Dashboard</h1>
          <p className="text-slate-500 mt-3 font-medium text-lg">Welcome back! Here's an overview of your learning journey.</p>
        </div>
      </div>

      <div className="w-full md:container md:mx-auto md:px-4 m-0 p-0 md:py-10 md:max-w-7xl relative z-10 flex-1 flex flex-col max-w-none">
        <div className="flex flex-col md:flex-row gap-0 md:gap-8 w-full flex-1 m-0 p-0 max-w-none">
          
          {/* Sidebar Navigation - Desktop Only */}
          <aside className="hidden md:block w-full md:w-72 shrink-0">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-24">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/student" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden
                        ${isActive 
                          ? 'text-blue-700 shadow-sm' 
                          : 'text-slate-600 hover:text-blue-600'}
                      `}
                    >
                      {isActive && <div className="absolute inset-0 bg-blue-50/80 border border-blue-100/50 rounded-2xl -z-10" />}
                      {!isActive && <div className="absolute inset-0 bg-slate-50/0 group-hover:bg-slate-50/80 rounded-2xl -z-10 transition-colors" />}
                      
                      <div className="flex items-center gap-3.5">
                        <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                          <Icon size={18} />
                        </div>
                        {item.name}
                      </div>
                      <ChevronRight size={16} className={`transition-transform duration-300 ${isActive ? "text-blue-600" : "text-slate-300 group-hover:translate-x-1 group-hover:text-blue-400"}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
          
          {/* Main Content Area */}
          <main className="flex-1 w-full max-w-full md:max-w-none flex flex-col pt-[60px] pb-[90px] md:pt-0 md:pb-0 m-0 overflow-x-hidden bg-white md:bg-transparent">
            <div className="bg-white/90 md:backdrop-blur-3xl md:border md:border-slate-200/80 rounded-none md:rounded-[2.5rem] p-0 md:p-10 md:shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex-1 w-full m-0 max-w-none overflow-x-hidden">
              <ResponsiveWrapper>
                {children}
              </ResponsiveWrapper>
            </div>
          </main>
          
        </div>
      </div>
    </div>
  );
}
